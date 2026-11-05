-- PrepMaster database schema. Run once in the Supabase SQL editor (on a fresh project).
-- The API uses the service role key, so RLS mainly protects against direct
-- browser access with the public key.

create type public.app_role as enum ('admin', 'student');
create type public.cbt_mode as enum ('practice', 'live');
create type public.attempt_status as enum ('in_progress', 'submitted', 'expired');
create type public.payment_status as enum ('pending', 'success', 'failed');
create type public.sw_verdict as enum ('good', 'needs-work');

-- 1. Profiles (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  provider text not null default 'email',       -- email | google
  gender text check (gender in ('male', 'female', 'other', 'prefer_not_to_say')),
  avatar_url text check (char_length(avatar_url) <= 500),
  faculty text,
  department text,
  level text,
  dob date,
  heard text,
  user_type text check (user_type in ('student', 'freelancer')),
  sw_registered boolean not null default false,
  sw_joined_at timestamptz,
  suspended_at timestamptz,
  suspend_reason text,
  created_at timestamptz not null default now()
);

-- Roles live in their own table (never on profiles)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);

create table public.warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  issued_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 2. Courses + their folders
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  code text not null,
  title text not null,
  color text not null default '#3b6cff',
  description text not null default '',
  level text not null default 'all',
  departments text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.course_subfolders (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  category text not null check (category in ('lecture-notes', 'past-questions', 'textbooks')),
  slug text not null,
  name text not null,
  unique (course_id, category, slug)
);

-- 3. Course materials (files live in R2; only the key + price are stored here)
create table public.course_materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  category text not null check (category in ('lecture-notes', 'past-questions', 'textbooks')),
  subfolder text not null default '',      -- course_subfolders.slug
  title text not null,
  file_type text not null default 'pdf',   -- pdf | doc | slides | video | image
  r2_key text not null,
  size_bytes bigint not null default 0,
  price_kobo integer not null default 0,   -- 0 = free
  created_at timestamptz not null default now()
);
create index on public.course_materials (course_id, category);

-- 4. CBTs
create table public.cbts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  mode public.cbt_mode not null default 'practice',
  duration_minutes integer not null check (duration_minutes > 0),
  opens_at timestamptz not null default now(),
  closes_at timestamptz,
  price_kobo integer not null default 0,
  max_attempts integer check (max_attempts is null or max_attempts > 0), -- null = unlimited
  reveal_results boolean not null default true,
  published boolean not null default false,
  paused boolean not null default false, -- "Pending release": visible but students can't start it
  created_at timestamptz not null default now()
);

-- 5. Questions (answer_index is NEVER sent to students before they finish)
create table public.cbt_questions (
  id uuid primary key default gen_random_uuid(),
  cbt_id uuid not null references public.cbts(id) on delete cascade,
  position integer not null,
  text text not null,
  options text[] not null check (array_length(options, 1) between 2 and 6),
  answer_index integer not null,
  topic text not null default '',
  explanation text not null default '',
  unique (cbt_id, position)
);

-- 6. Attempts (server-owned timer)
create table public.cbt_attempts (
  id uuid primary key default gen_random_uuid(),
  cbt_id uuid not null references public.cbts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  deadline timestamptz not null,
  submitted_at timestamptz,
  submit_attempted_at timestamptz,
  status public.attempt_status not null default 'in_progress',
  score integer,
  total integer,
  flagged_question_ids text[] not null default '{}'
);
create index on public.cbt_attempts (user_id, cbt_id);
create unique index one_open_attempt on public.cbt_attempts (cbt_id, user_id) where status = 'in_progress';

-- 7. Answers (autosaved per click; saved_at is set by the server)
create table public.cbt_answers (
  attempt_id uuid not null references public.cbt_attempts(id) on delete cascade,
  question_id uuid not null references public.cbt_questions(id) on delete cascade,
  selected_index integer not null,
  saved_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

-- 8. Payments (Paystack). reference is unique so webhooks are safe to receive twice.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('material', 'cbt')),
  item_id uuid not null,
  item_title text not null default '',
  amount_kobo integer not null,
  reference text not null unique,
  status public.payment_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.payments (user_id, status);

-- 9. SolidWorks
create table public.sw_tasks (
  id uuid primary key default gen_random_uuid(),
  number integer generated always as identity unique,
  title text not null,
  summary text not null default '',
  description text not null default '',
  steps text[] not null default '{}',
  video_url text,
  thumbnail_url text,
  target_mass numeric,
  target_volume numeric,
  tolerance_percent numeric not null default 0.5,
  created_at timestamptz not null default now()
);

create table public.sw_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.sw_tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  files jsonb not null default '[]',   -- [{ name, size, mime, r2Key }]
  mass text not null,
  volume text not null,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard', 'super-hard')),
  challenge text not null default '',
  score_mass integer,
  score_volume integer,
  score_model integer,
  verdict public.sw_verdict,
  remarks text,
  graded_at timestamptz,
  submitted_at timestamptz not null default now(),
  unique (task_id, user_id)
);

create table public.sw_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  task_ids uuid[] not null default '{}',
  image_url text,
  image_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sw_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.sw_questions(id) on delete cascade,
  body text not null,
  responder_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- 10. Scheduled competitions (reuse a CBT question bank, but track contest standings separately)
create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  course_id uuid references public.courses(id) on delete set null,
  cbt_id uuid references public.cbts(id) on delete set null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  level text not null default 'all',
  prize_pool_naira integer not null default 0 check (prize_pool_naira >= 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
create index on public.competitions (status, starts_at);

create table public.competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  score integer not null default 0,
  speed_seconds numeric not null default 0,
  final_rank integer,
  answers jsonb not null default '{}'::jsonb,
  question_answered_at jsonb not null default '{}'::jsonb,
  unique (competition_id, user_id)
);
create index on public.competition_entries (competition_id, score desc, speed_seconds asc);

-- Role helper
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- New sign-ups get a profile + student role. Names come from sign-up metadata or Google.
create or replace function public.dicebear_avatar_url(_id uuid, _gender text)
returns text language sql immutable set search_path = public as $$
  select 'https://api.dicebear.com/9.x/adventurer/svg?seed=' || _id::text
    || '&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf'
    || case _gender
      when 'male' then '&hair=short01,short02,short03,short04,short05,short06,short07,short08,short09,short10,short11,short12,short13,short14,short15,short16'
      when 'female' then '&hair=long01,long02,long03,long04,long05,long06,long07,long08,long09,long10,long11,long12,long13,long14,long15,long16,long17,long18,long19,long20'
      else ''
    end
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  full_name text := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
begin
  insert into public.profiles (id, email, first_name, last_name, provider, faculty, department, level, dob, heard, user_type, gender, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), split_part(full_name, ' ', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'last_name', ''), nullif(substr(full_name, length(split_part(full_name, ' ', 1)) + 2), ''), ''),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    nullif(new.raw_user_meta_data->>'faculty', ''),
    nullif(new.raw_user_meta_data->>'department', ''),
    nullif(new.raw_user_meta_data->>'level', ''),
    nullif(new.raw_user_meta_data->>'dob', '')::date,
    nullif(new.raw_user_meta_data->>'heard', ''),
    case when new.raw_user_meta_data->>'user_type' in ('student', 'freelancer') then new.raw_user_meta_data->>'user_type' end,
    case when new.raw_user_meta_data->>'gender' in ('male', 'female', 'other', 'prefer_not_to_say') then new.raw_user_meta_data->>'gender' end,
    public.dicebear_avatar_url(new.id, new.raw_user_meta_data->>'gender')
  );
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grants + RLS
grant select on public.profiles, public.user_roles, public.warnings, public.courses, public.course_subfolders,
  public.cbts, public.cbt_attempts, public.payments, public.sw_tasks to authenticated;
grant all on all tables in schema public to service_role;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.warnings enable row level security;
alter table public.courses enable row level security;
alter table public.course_subfolders enable row level security;
alter table public.course_materials enable row level security;
alter table public.cbts enable row level security;
alter table public.cbt_questions enable row level security;
alter table public.cbt_attempts enable row level security;
alter table public.cbt_answers enable row level security;
alter table public.payments enable row level security;
alter table public.sw_tasks enable row level security;
alter table public.sw_submissions enable row level security;
alter table public.sw_questions enable row level security;
alter table public.sw_responses enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_entries enable row level security;

create policy "own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "own warnings" on public.warnings for select to authenticated using (user_id = auth.uid());
create policy "read courses" on public.courses for select to authenticated using (true);
create policy "read subfolders" on public.course_subfolders for select to authenticated using (true);
create policy "read published cbts" on public.cbts for select to authenticated using (published);
create policy "own attempts" on public.cbt_attempts for select to authenticated using (user_id = auth.uid());
create policy "own payments" on public.payments for select to authenticated using (user_id = auth.uid());
create policy "read sw tasks" on public.sw_tasks for select to authenticated using (true);
create policy "read competitions" on public.competitions for select to authenticated using (true);
create policy "read competition entries" on public.competition_entries for select to authenticated using (true);
create policy "register own competition entry" on public.competition_entries
  for insert to authenticated with check (user_id = auth.uid());
-- Everything else: no browser access at all (API only).

-- After your first sign-up, make yourself admin (replace the email):
-- insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com';

-- Upgrading an existing database? Run once:
-- alter table public.cbts add column if not exists paused boolean not null default false;

-- Avatar profile upgrade (idempotent): run this block on existing databases.
alter table public.profiles
  add column if not exists gender text,
  add column if not exists avatar_url text check (char_length(avatar_url) <= 500);

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check
  check (gender in ('male', 'female', 'other', 'prefer_not_to_say'));

-- Ensure all sign-up providers receive a deterministic Adventurer avatar.
create or replace function public.dicebear_avatar_url(_id uuid, _gender text)
returns text language sql immutable set search_path = public as $$
  select 'https://api.dicebear.com/9.x/adventurer/svg?seed=' || _id::text
    || '&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf'
    || case _gender
      when 'male' then '&hair=short01,short02,short03,short04,short05,short06,short07,short08,short09,short10,short11,short12,short13,short14,short15,short16'
      when 'female' then '&hair=long01,long02,long03,long04,long05,long06,long07,long08,long09,long10,long11,long12,long13,long14,long15,long16,long17,long18,long19,long20'
      else ''
    end
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  full_name text := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
begin
  insert into public.profiles (id, email, first_name, last_name, provider, faculty, department, level, dob, heard, user_type, gender, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'first_name', ''), split_part(full_name, ' ', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'last_name', ''), nullif(substr(full_name, length(split_part(full_name, ' ', 1)) + 2), ''), ''),
    coalesce(new.raw_app_meta_data->>'provider', 'email'),
    nullif(new.raw_user_meta_data->>'faculty', ''),
    nullif(new.raw_user_meta_data->>'department', ''),
    nullif(new.raw_user_meta_data->>'level', ''),
    nullif(new.raw_user_meta_data->>'dob', '')::date,
    nullif(new.raw_user_meta_data->>'heard', ''),
    case when new.raw_user_meta_data->>'user_type' in ('student', 'freelancer') then new.raw_user_meta_data->>'user_type' end,
    case when new.raw_user_meta_data->>'gender' in ('male', 'female', 'other', 'prefer_not_to_say') then new.raw_user_meta_data->>'gender' end,
    public.dicebear_avatar_url(new.id, new.raw_user_meta_data->>'gender')
  );
  insert into public.user_roles (user_id, role) values (new.id, 'student');
  return new;
end $$;

update public.profiles
set avatar_url = public.dicebear_avatar_url(id, gender)
where avatar_url is null;

-- SolidWorks question screenshot upgrade (idempotent).
alter table public.sw_questions add column if not exists image_url text;
alter table public.sw_questions add column if not exists image_urls text[] not null default '{}';

-- CBT attempt flags upgrade (idempotent).
alter table public.cbt_attempts
  add column if not exists flagged_question_ids text[] not null default '{}';

-- SolidWorks CSWA-style auto-grading upgrade (idempotent).
alter table public.sw_tasks
  add column if not exists target_mass numeric,
  add column if not exists target_volume numeric,
  add column if not exists tolerance_percent numeric not null default 0.5;

alter table public.cbt_questions add column if not exists explanation text not null default '';

-- Course targeting upgrade (idempotent).
-- An empty department array means a general course that every department can browse.
alter table public.courses
  add column if not exists level text not null default 'all',
  add column if not exists departments text[] not null default '{}';

comment on column public.courses.level is
  'Academic level: 100, 200, 300, 400, 500, 600, Postgraduate, or all';
comment on column public.courses.departments is
  'List of department names eligible for this course. Empty array means general / all departments.';

-- Scheduled competitions upgrade (idempotent).
create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  course_id uuid references public.courses(id) on delete set null,
  cbt_id uuid references public.cbts(id) on delete set null,
  starts_at timestamptz not null,
  duration_minutes integer not null default 30 check (duration_minutes > 0),
  level text not null default 'all',
  prize_pool_naira integer not null default 0 check (prize_pool_naira >= 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.competition_entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  score integer not null default 0,
  speed_seconds numeric not null default 0,
  final_rank integer,
  answers jsonb not null default '{}'::jsonb,
  question_answered_at jsonb not null default '{}'::jsonb,
  unique (competition_id, user_id)
);

create index if not exists idx_competitions_status on public.competitions (status, starts_at);
create index if not exists idx_competition_entries_comp_score
  on public.competition_entries (competition_id, score desc, speed_seconds asc);

alter table public.competition_entries
  add column if not exists answers jsonb not null default '{}'::jsonb,
  add column if not exists question_answered_at jsonb not null default '{}'::jsonb;

alter table public.competitions enable row level security;
alter table public.competition_entries enable row level security;
drop policy if exists "Read competitions" on public.competitions;
drop policy if exists "Read competition entries" on public.competition_entries;
drop policy if exists "Register own entry" on public.competition_entries;
create policy "Read competitions" on public.competitions
  for select to authenticated using (true);
create policy "Read competition entries" on public.competition_entries
  for select to authenticated using (true);
create policy "Register own entry" on public.competition_entries
  for insert to authenticated with check (user_id = auth.uid());
grant select on public.competitions to authenticated;
grant select, insert on public.competition_entries to authenticated;
grant all on public.competitions, public.competition_entries to service_role;

-- Competition settings and server-enforced level access (20261029120000).
alter table public.competitions
  add column if not exists prize_description text not null default '';
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

-- Competition question sourcing and delayed practice release (idempotent).
alter table public.competitions
  add column if not exists question_limit integer check (question_limit is null or question_limit > 0);
alter table public.cbts
  add column if not exists competition_id uuid references public.competitions(id) on delete set null,
  add column if not exists releases_at timestamptz;
alter table public.competition_entries
  add column if not exists question_ids uuid[] not null default '{}';
create index if not exists idx_cbts_competition_release on public.cbts (competition_id, releases_at);

-- Competition arena safety and stable delayed practice release (20261030120000).
-- This mirrors the production migration in supabase/migrations/.
alter table public.competitions
  add column if not exists ends_at timestamptz,
  add column if not exists scoring_ends_at timestamptz,
  add column if not exists arena_question_ids uuid[] not null default '{}';
alter table public.competition_entries
  add column if not exists question_snapshot jsonb not null default '[]',
  add column if not exists next_index integer not null default 0;

create index if not exists competition_started_entries
  on public.competition_entries (competition_id) where started_at is not null;

update public.competitions set
  ends_at = coalesce(ends_at, starts_at + make_interval(mins => duration_minutes)),
  scoring_ends_at = coalesce(scoring_ends_at, ends_at, starts_at + make_interval(mins => duration_minutes))
where ends_at is null or scoring_ends_at is null;

update public.competition_entries e set question_snapshot = coalesce((
  select jsonb_agg(jsonb_build_object(
    'id', q.id, 'text', q.text, 'options', q.options, 'topic', q.topic, 'answer_index', q.answer_index
  ) order by ids.ordinality)
  from unnest(e.question_ids) with ordinality ids(id, ordinality)
  join public.cbt_questions q on q.id = ids.id
), '[]') where question_snapshot = '[]' and cardinality(question_ids) > 0;

update public.competition_entries e set next_index = coalesce((
  select max(ids.ordinality)::integer
  from unnest(e.question_ids) with ordinality ids(id, ordinality)
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

create or replace function public.sync_competition_practice_release()
returns trigger language plpgsql set search_path = public as $$
declare release_time timestamptz;
begin
  release_time := coalesce(new.ends_at, new.starts_at + make_interval(mins => new.duration_minutes)) + interval '90 minutes';
  update public.cbts set
    releases_at = release_time,
    title = '🏆 Practice: ' || new.title,
    course_id = coalesce(new.course_id, course_id),
    published = release_time <= clock_timestamp()
  where competition_id = new.id and id = new.cbt_id;
  return new;
end;
$$;
drop trigger if exists competition_practice_release on public.competitions;
create trigger competition_practice_release after update of starts_at, duration_minutes, ends_at, title, course_id, cbt_id
on public.competitions for each row execute function public.sync_competition_practice_release();

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
        select jsonb_agg(jsonb_build_object(
          'id', q.id, 'text', q.text, 'options', q.options, 'topic', q.topic, 'answer_index', q.answer_index
        ) order by ids.ordinality) into entry.question_snapshot
        from unnest(selected_ids) with ordinality ids(id, ordinality)
        join public.cbt_questions q on q.id = ids.id;
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
