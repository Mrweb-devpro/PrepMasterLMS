-- Keep scoring stable when an administrator extends the answering window.
alter table public.competitions
  add column if not exists ends_at timestamptz,
  add column if not exists scoring_ends_at timestamptz,
  add column if not exists arena_question_ids uuid[] not null default '{}';
alter table public.competition_entries
  add column if not exists question_snapshot jsonb not null default '[]',
  add column if not exists next_index integer not null default 0;
create index if not exists competition_started_entries on public.competition_entries(competition_id) where started_at is not null;

update public.competitions set
  ends_at = coalesce(ends_at, starts_at + make_interval(mins => duration_minutes)),
  scoring_ends_at = coalesce(scoring_ends_at, ends_at, starts_at + make_interval(mins => duration_minutes))
where ends_at is null or scoring_ends_at is null;

-- Existing entries retain their question IDs and points. Never silently replace a bank.
update public.competition_entries e set question_snapshot = coalesce((
  select jsonb_agg(jsonb_build_object('id', q.id, 'text', q.text, 'options', q.options,
    'topic', q.topic, 'answer_index', q.answer_index) order by ids.ordinality)
  from unnest(e.question_ids) with ordinality ids(id, ordinality)
  join public.cbt_questions q on q.id = ids.id
), '[]') where question_snapshot = '[]' and cardinality(question_ids) > 0;
update public.competition_entries e set next_index = coalesce((
  select max(ids.ordinality)::integer from unnest(e.question_ids) with ordinality ids(id, ordinality)
  where e.answers ? ids.id::text
), 0) where next_index = 0;

create or replace function public.guard_competition_settings()
returns trigger language plpgsql set search_path = public as $$
declare started boolean;
begin
  if tg_op = 'INSERT' then
    new.ends_at := coalesce(new.ends_at, new.starts_at + make_interval(mins => new.duration_minutes));
    new.scoring_ends_at := new.ends_at;
    return new;
  end if;
  select exists(select 1 from public.competition_entries where competition_id = old.id and started_at is not null) into started;
  if started then
    if new.starts_at is distinct from old.starts_at then
      raise exception 'The contest has started. Change its closing time instead of moving the start.';
    end if;
    if new.cbt_id is distinct from old.cbt_id or new.question_limit is distinct from old.question_limit then
      raise exception 'Questions cannot be changed after students have started.';
    end if;
    if new.level is distinct from old.level then
      raise exception 'The target level cannot change after students have started.';
    end if;
    new.scoring_ends_at := old.scoring_ends_at;
  else
    new.ends_at := coalesce(new.ends_at, new.starts_at + make_interval(mins => new.duration_minutes));
    new.scoring_ends_at := new.ends_at;
    if new.cbt_id is distinct from old.cbt_id or new.question_limit is distinct from old.question_limit then
      new.arena_question_ids := '{}';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists competition_settings_guard on public.competitions;
create trigger competition_settings_guard before insert or update on public.competitions
for each row execute function public.guard_competition_settings();

-- The contest and its hidden practice release move together in the same transaction.
create or replace function public.sync_competition_practice_release()
returns trigger language plpgsql set search_path = public as $$
declare release_time timestamptz;
begin
  release_time := coalesce(new.ends_at, new.starts_at + make_interval(mins => new.duration_minutes)) + interval '90 minutes';
  update public.cbts set releases_at = release_time,
    title = '🏆 Practice: ' || new.title, course_id = coalesce(new.course_id, course_id),
    published = release_time <= clock_timestamp()
  where competition_id = new.id and id = new.cbt_id;
  return new;
end;
$$;
drop trigger if exists competition_practice_release on public.competitions;
create trigger competition_practice_release after update of starts_at, duration_minutes, ends_at, title, course_id, cbt_id
on public.competitions for each row execute function public.sync_competition_practice_release();

-- Also protect banks edited through the ordinary admin CBT screens.
create or replace function public.guard_competition_bank()
returns trigger language plpgsql set search_path = public as $$
declare bank_id uuid; contest public.competitions;
begin
  if tg_table_name = 'cbts' then
    bank_id := old.id;
  elsif tg_op = 'DELETE' then
    bank_id := old.cbt_id;
  else
    bank_id := new.cbt_id;
  end if;
  for contest in select * from public.competitions where cbt_id = bank_id order by id for update loop
    if tg_table_name = 'cbts' or (
      contest.status <> 'cancelled'
      and clock_timestamp() < coalesce(contest.ends_at, contest.starts_at + make_interval(mins => contest.duration_minutes))
      and exists(select 1 from public.competition_entries where competition_id = contest.id and started_at is not null)
    ) then
      raise exception 'This question bank is linked to a competition. Its active questions and linked CBT cannot be removed or replaced.';
    end if;
  end loop;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists competition_bank_guard on public.cbt_questions;
create trigger competition_bank_guard before insert or update or delete on public.cbt_questions
for each row execute function public.guard_competition_bank();
drop trigger if exists competition_cbt_delete_guard on public.cbts;
create trigger competition_cbt_delete_guard before delete on public.cbts
for each row execute function public.guard_competition_bank();

-- All arena writes run in one transaction, locking contest then entry in that order.
create or replace function public.guard_competition_score_write()
returns trigger language plpgsql set search_path = public as $$
declare contest public.competitions;
begin
  select * into contest from public.competitions where id = new.competition_id for update;
  if old.submitted_at is not null or contest.status in ('completed', 'cancelled')
    or clock_timestamp() >= coalesce(contest.ends_at, contest.starts_at + make_interval(mins => contest.duration_minutes)) then
    if new.score is distinct from old.score or new.answers is distinct from old.answers
      or new.final_rank is distinct from old.final_rank then
      raise exception 'Competition results are locked';
    end if;
  end if;
  if old.submitted_at is not null and (new.speed_seconds is distinct from old.speed_seconds or new.submitted_at is distinct from old.submitted_at) then
    raise exception 'This entry is already submitted';
  end if;
  return new;
end;
$$;

-- Only the backend service role can call this function; no answer keys leave the backend.
create or replace function public.competition_arena_action(
  p_competition_id uuid, p_user_id uuid, p_action text,
  p_question_id uuid default null, p_selected_index integer default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  contest public.competitions; entry public.competition_entries; student_level text;
  cutoff timestamptz; stamp timestamptz; question jsonb; selected_ids uuid[];
  points integer := 0; question_key text;
begin
  select * into contest from public.competitions where id = p_competition_id for update;
  if not found then raise exception 'Competition not found.'; end if;
  select * into entry from public.competition_entries where competition_id = p_competition_id and user_id = p_user_id for update;
  select level into student_level from public.profiles where id = p_user_id;
  if contest.level <> 'all' and contest.level is distinct from student_level and entry.started_at is null then
    raise exception 'This competition is for a different study level.';
  end if;
  stamp := clock_timestamp();
  cutoff := coalesce(contest.ends_at, contest.starts_at + make_interval(mins => contest.duration_minutes));
  if contest.status = 'cancelled' then raise exception 'This competition was cancelled.'; end if;
  if stamp < contest.starts_at then raise exception 'This competition has not started yet.'; end if;
  if p_action not in ('enter', 'answer', 'submit') then raise exception 'Invalid arena action.'; end if;

  -- A retry after a lost response returns the original accepted choice, without scoring twice.
  question_key := p_question_id::text;
  if p_action = 'answer' and entry.answers ? question_key then
    return jsonb_build_object('saved', true, 'score', entry.score, 'selectedIndex', entry.answers -> question_key, 'awarded', 0);
  end if;
  if p_action <> 'submit' and (contest.status = 'completed' or stamp >= cutoff) then
    raise exception 'This competition has ended.';
  end if;

  if p_action = 'enter' then
    if entry.id is null then
      insert into public.competition_entries(competition_id, user_id) values (p_competition_id, p_user_id) returning * into entry;
    end if;
    if entry.submitted_at is null then
      if cardinality(entry.question_ids) = 0 then
        selected_ids := contest.arena_question_ids;
        if cardinality(selected_ids) = 0 then
          select array_agg(id order by position) into selected_ids from (
            select id, position from public.cbt_questions where cbt_id = contest.cbt_id
            order by random() limit coalesce(contest.question_limit, 2147483647)
          ) chosen;
          if coalesce(cardinality(selected_ids), 0) = 0 then raise exception 'This contest has no questions yet.'; end if;
          update public.competitions set arena_question_ids = selected_ids where id = contest.id;
        end if;
        select jsonb_agg(jsonb_build_object('id', q.id, 'text', q.text, 'options', q.options, 'topic', q.topic,
          'answer_index', q.answer_index) order by ids.ordinality) into entry.question_snapshot
        from unnest(selected_ids) with ordinality ids(id, ordinality) join public.cbt_questions q on q.id = ids.id;
        entry.question_ids := selected_ids;
      end if;
      if jsonb_array_length(entry.question_snapshot) <> cardinality(entry.question_ids) then
        raise exception 'The saved question set is incomplete. Please contact the contest organiser.';
      end if;
      update public.competition_entries set started_at = coalesce(started_at, stamp),
        question_ids = entry.question_ids, question_snapshot = entry.question_snapshot
      where id = entry.id returning * into entry;
    end if;
    return to_jsonb(entry);
  end if;

  if entry.id is null or entry.started_at is null then raise exception 'Enter the arena first.'; end if;
  if p_action = 'submit' then
    if entry.submitted_at is null then
      update public.competition_entries set submitted_at = least(stamp, cutoff),
        speed_seconds = greatest(0, floor(extract(epoch from (least(stamp, cutoff) - started_at))))
      where id = entry.id returning * into entry;
    end if;
    return to_jsonb(entry);
  end if;
  if entry.submitted_at is not null then raise exception 'Your competition entry is already complete.'; end if;
  if entry.question_ids[entry.next_index + 1] is distinct from p_question_id then
    raise exception 'Answer the current question. Previous answers cannot be changed.';
  end if;
  question := entry.question_snapshot -> entry.next_index;
  if question is null then raise exception 'The saved question is unavailable.'; end if;
  if p_selected_index is not null and (p_selected_index < 0 or p_selected_index >= jsonb_array_length(question -> 'options')) then
    raise exception 'Invalid answer choice.';
  end if;
  if p_selected_index = (question ->> 'answer_index')::integer then
    points := 100 + 2 * greatest(0, floor(extract(epoch from (contest.scoring_ends_at - stamp)))::integer);
  end if;
  update public.competition_entries set
    answers = answers || jsonb_build_object(question_key, p_selected_index),
    question_answered_at = question_answered_at || jsonb_build_object(question_key, stamp),
    score = score + points, next_index = next_index + 1,
    speed_seconds = greatest(0, floor(extract(epoch from (stamp - started_at))))
  where id = entry.id returning * into entry;
  return jsonb_build_object('saved', true, 'score', entry.score, 'selectedIndex', entry.answers -> question_key, 'awarded', points);
end;
$$;
revoke all on function public.competition_arena_action(uuid, uuid, text, uuid, integer) from public, anon, authenticated;
grant execute on function public.competition_arena_action(uuid, uuid, text, uuid, integer) to service_role;
