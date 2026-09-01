-- ============================================================
-- Courses RLS + shared course audiences
-- Fixes: new row violates row-level security for table "courses"
-- and allows GET/general courses to be shared across multiple
-- faculties/departments via checkboxes (bad UX was single select)
-- ============================================================

-- 1) Courses: add missing RLS policies (was enabled but no policies)
create policy "courses_read_auth" on public.courses
  for select to authenticated using (true);
create policy "courses_write_admin" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 2) Shared audiences: a course can be linked to many faculties/departments
-- e.g. GET 101 shared by 3 of 5 Engineering departments
create table if not exists public.course_shares (
  course_id uuid not null references public.courses(id) on delete cascade,
  faculty_id uuid references public.faculties(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, faculty_id, department_id),
  check (
    (faculty_id is not null and department_id is null) or
    (faculty_id is null and department_id is not null) or
    (faculty_id is not null and department_id is not null)
  )
);

alter table public.course_shares enable row level security;

create policy "course_shares_read_auth" on public.course_shares
  for select to authenticated using (true);
create policy "course_shares_write_admin" on public.course_shares
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Optional: index for lookups
create index if not exists idx_course_shares_course on public.course_shares(course_id);
create index if not exists idx_course_shares_dept on public.course_shares(department_id);
