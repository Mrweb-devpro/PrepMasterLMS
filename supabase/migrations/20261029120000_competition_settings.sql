alter table public.competitions
  add column if not exists prize_description text not null default '';

-- Prevent direct browser reads from bypassing the API's level restriction.
drop policy if exists "read competitions" on public.competitions;
drop policy if exists "Competitions readable" on public.competitions;
-- All reads and entry writes go through the authenticated backend service.
revoke all on public.competitions from authenticated, anon;
revoke all on public.competition_entries from authenticated, anon;


-- Serialize score writes with contest closure and keep ended results immutable.
create or replace function public.guard_competition_score_write()
returns trigger language plpgsql set search_path = public as $$
declare contest public.competitions;
begin
  select * into contest from public.competitions where id = new.competition_id for update;
  if contest.status in ('completed', 'cancelled')
    or clock_timestamp() >= contest.starts_at + make_interval(mins => contest.duration_minutes) then
    if new.score is distinct from old.score
      or new.speed_seconds is distinct from old.speed_seconds
      or new.answers is distinct from old.answers
      or new.final_rank is distinct from old.final_rank then
      raise exception 'Competition results are locked';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists competition_scores_locked on public.competition_entries;
create trigger competition_scores_locked before update on public.competition_entries
for each row execute function public.guard_competition_score_write();
