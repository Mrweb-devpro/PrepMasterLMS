-- ============================================================
-- Prepmaster LMS — Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.user_role as enum ('student', 'admin', 'instructor');
create type public.track_type as enum ('secondary', 'university');
create type public.registration_type as enum ('free', 'paid');
create type public.exam_status as enum ('draft', 'scheduled', 'live', 'paused', 'ended');
create type public.exam_type as enum ('practice', 'quiz', 'cbt', 'mock');
create type public.exam_tag as enum ('practice', 'mock_exam');

-- ============================================================
-- Tracks (secondary, university)
-- ============================================================
create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type track_type not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Faculties (Engineering, Science, Architecture)
-- ============================================================
create table public.faculties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Departments
-- ============================================================
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (faculty_id, name)
);

-- ============================================================
-- Levels (SS1-SS3, 100L-500L)
-- ============================================================
create table public.levels (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.tracks(id) on delete cascade,
  name text not null,
  "order" integer not null,
  telegram_invite_link text,
  is_active boolean not null default true,
  registration_type registration_type not null default 'free',
  registration_price numeric(10,2),
  created_at timestamptz not null default now(),
  unique (track_id, name)
);

-- ============================================================
-- Semesters
-- ============================================================
create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  "order" integer not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Subjects (secondary: Physics, Chemistry, Maths, Further Maths)
-- ============================================================
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Courses (university)
-- ============================================================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  faculty_id uuid references public.faculties(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  level_id uuid not null references public.levels(id) on delete cascade,
  semester_id uuid references public.semesters(id) on delete set null,
  track_id uuid not null references public.tracks(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (code, level_id)
);

-- ============================================================
-- Profiles (extends auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role user_role not null default 'student',
  track_id uuid references public.tracks(id) on delete set null,
  faculty_id uuid references public.faculties(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  level_id uuid references public.levels(id) on delete set null,
  semester_id uuid references public.semesters(id) on delete set null,
  theme_preference text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Questions
-- ============================================================
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  text text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation text,
  topic text,
  difficulty text,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Question Banks
-- ============================================================
create table public.question_banks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.bank_questions (
  id uuid primary key default gen_random_uuid(),
  bank_id uuid not null references public.question_banks(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  topic text,
  source text,
  created_at timestamptz not null default now(),
  unique (bank_id, question_id)
);

-- ============================================================
-- Exams (CBT, quizzes, mock exams)
-- ============================================================
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type exam_type not null default 'cbt',
  tag exam_tag not null default 'practice',
  course_id uuid references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  duration_minutes integer not null default 60,
  question_count integer not null default 0,
  is_premium boolean not null default false,
  price numeric(10,2),
  show_explanations boolean not null default true,
  review_enabled boolean not null default true,
  re_attempts_enabled boolean not null default true,
  status exam_status not null default 'draft',
  schedule_start timestamptz,
  schedule_end timestamptz,
  free boolean not null default true,
  exam_type text,
  year integer,
  created_at timestamptz not null default now()
);

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (exam_id, position)
);

-- ============================================================
-- Attempts (student submissions)
-- ============================================================
create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  score integer,
  total integer,
  answers jsonb not null default '{}'::jsonb,
  flagged jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  duration_seconds integer,
  status text not null default 'in_progress'
);

-- ============================================================
-- Materials
-- ============================================================
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  title text not null,
  file_url text not null,
  is_premium boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Past Papers (secondary: WAEC/JAMB/NECO)
-- ============================================================
create table public.past_papers (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  exam_type text not null,
  year integer not null,
  file_url text,
  extracted boolean not null default false,
  created_at timestamptz not null default now(),
  unique (subject_id, exam_type, year)
);

-- ============================================================
-- Packages & Payments
-- ============================================================
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id uuid references public.packages(id) on delete set null,
  paystack_reference text not null,
  amount numeric(10,2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Telegram Groups
-- ============================================================
create table public.telegram_groups (
  id uuid primary key default gen_random_uuid(),
  level_id uuid references public.levels(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete cascade,
  invite_link text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- User Courses & Subjects
-- ============================================================
create table public.user_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.user_subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, subject_id)
);

-- ============================================================
-- Triggers: automatically create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), 'student')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Enable RLS
-- ============================================================
alter table public.tracks enable row level security;
alter table public.faculties enable row level security;
alter table public.departments enable row level security;
alter table public.levels enable row level security;
alter table public.semesters enable row level security;
alter table public.subjects enable row level security;
alter table public.courses enable row level security;
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_banks enable row level security;
alter table public.bank_questions enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.attempts enable row level security;
alter table public.materials enable row level security;
alter table public.past_papers enable row level security;
alter table public.packages enable row level security;
alter table public.payments enable row level security;
alter table public.telegram_groups enable row level security;
alter table public.user_courses enable row level security;
alter table public.user_subjects enable row level security;
