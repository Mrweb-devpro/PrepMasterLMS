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

create policy "own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());
create policy "own warnings" on public.warnings for select to authenticated using (user_id = auth.uid());
create policy "read courses" on public.courses for select to authenticated using (true);
create policy "read subfolders" on public.course_subfolders for select to authenticated using (true);
create policy "read published cbts" on public.cbts for select to authenticated using (published);
create policy "own attempts" on public.cbt_attempts for select to authenticated using (user_id = auth.uid());
create policy "own payments" on public.payments for select to authenticated using (user_id = auth.uid());
create policy "read sw tasks" on public.sw_tasks for select to authenticated using (true);
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

-- Python Web Book early-access waitlist upgrade (idempotent).
create table if not exists public.python_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  constraint python_waitlist_user_unique unique (user_id)
);

alter table public.python_waitlist enable row level security;
drop policy if exists "insert own waitlist" on public.python_waitlist;
drop policy if exists "read own waitlist" on public.python_waitlist;
create policy "insert own waitlist" on public.python_waitlist
  for insert to authenticated with check (user_id = auth.uid());
create policy "read own waitlist" on public.python_waitlist
  for select to authenticated using (user_id = auth.uid());
grant select, insert on public.python_waitlist to authenticated;
grant all on public.python_waitlist to service_role;

-- Course targeting upgrade (idempotent).
-- An empty department array means a general course that every department can browse.
alter table public.courses
  add column if not exists level text not null default 'all',
  add column if not exists departments text[] not null default '{}';

comment on column public.courses.level is
  'Academic level: 100, 200, 300, 400, 500, 600, Postgraduate, or all';
comment on column public.courses.departments is
  'List of department names eligible for this course. Empty array means general / all departments.';
