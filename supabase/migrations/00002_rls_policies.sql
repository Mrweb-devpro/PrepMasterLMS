-- ============================================================
-- Prepmaster LMS — RLS Policies
-- ============================================================

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Reference data: readable by all authenticated users,
-- writable by admins only
-- ============================================================

-- tracks
create policy "tracks_read_auth" on public.tracks
  for select to authenticated using (true);
create policy "tracks_write_admin" on public.tracks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- faculties
create policy "faculties_read_auth" on public.faculties
  for select to authenticated using (true);
create policy "faculties_write_admin" on public.faculties
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- departments
create policy "departments_read_auth" on public.departments
  for select to authenticated using (true);
create policy "departments_write_admin" on public.departments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- levels (non-active levels hidden from students in registration)
create policy "levels_read_auth" on public.levels
  for select to authenticated using (true);
create policy "levels_write_admin" on public.levels
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- semesters
create policy "semesters_read_auth" on public.semesters
  for select to authenticated using (true);
create policy "semesters_write_admin" on public.semesters
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- subjects
create policy "subjects_read_auth" on public.subjects
  for select to authenticated using (true);
create policy "subjects_write_admin" on public.subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Profiles
-- ============================================================
create policy "profiles_read_own" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_write_admin" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Questions: students see non-premium + their level content.
-- To keep it simple for now, students can read questions that
-- are not premium, or any question if admin. Full per-level
-- scoping is handled at the app layer via joins.
-- ============================================================
create policy "questions_read_nonpremium" on public.questions
  for select to authenticated using (not is_premium or public.is_admin());
create policy "questions_write_admin" on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Question banks
create policy "banks_read_auth" on public.question_banks
  for select to authenticated using (true);
create policy "banks_write_admin" on public.question_banks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "bank_questions_read_auth" on public.bank_questions
  for select to authenticated using (true);
create policy "bank_questions_write_admin" on public.bank_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Exams: students read non-premium (or premium if entitled).
-- For simplicity, students can read all non-premium exams;
-- premium gating enforced at app layer + entitlements.
-- ============================================================
create policy "exams_read_auth" on public.exams
  for select to authenticated using (not is_premium or public.is_admin());
create policy "exams_write_admin" on public.exams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "exam_questions_read_auth" on public.exam_questions
  for select to authenticated using (true);
create policy "exam_questions_write_admin" on public.exam_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Attempts: students only read/insert/update their own
-- ============================================================
create policy "attempts_read_own" on public.attempts
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "attempts_insert_own" on public.attempts
  for insert to authenticated with check (user_id = auth.uid());
create policy "attempts_update_own" on public.attempts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "attempts_write_admin" on public.attempts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Materials
-- ============================================================
create policy "materials_read_nonpremium" on public.materials
  for select to authenticated using (not is_premium or public.is_admin());
create policy "materials_write_admin" on public.materials
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Past papers: read by all auth, managed by admin
-- ============================================================
create policy "past_papers_read_auth" on public.past_papers
  for select to authenticated using (true);
create policy "past_papers_write_admin" on public.past_papers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Packages & payments
-- ============================================================
create policy "packages_read_auth" on public.packages
  for select to authenticated using (true);
create policy "packages_write_admin" on public.packages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "payments_read_own" on public.payments
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "payments_insert_own" on public.payments
  for insert to authenticated with check (user_id = auth.uid());
create policy "payments_write_admin" on public.payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Telegram groups
-- ============================================================
create policy "telegram_read_auth" on public.telegram_groups
  for select to authenticated using (true);
create policy "telegram_write_admin" on public.telegram_groups
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- User courses & subjects
-- ============================================================
create policy "user_courses_read_own" on public.user_courses
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "user_courses_insert_own" on public.user_courses
  for insert to authenticated with check (user_id = auth.uid());
create policy "user_courses_delete_own" on public.user_courses
  for delete to authenticated using (user_id = auth.uid());
create policy "user_courses_write_admin" on public.user_courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "user_subjects_read_own" on public.user_subjects
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "user_subjects_insert_own" on public.user_subjects
  for insert to authenticated with check (user_id = auth.uid());
create policy "user_subjects_delete_own" on public.user_subjects
  for delete to authenticated using (user_id = auth.uid());
create policy "user_subjects_write_admin" on public.user_subjects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Seed reference data
-- ============================================================
insert into public.tracks (name, type) values
  ('Secondary School', 'secondary'),
  ('University', 'university')
on conflict do nothing;

insert into public.faculties (name) values
  ('Engineering'),
  ('Science'),
  ('Architecture')
on conflict (name) do nothing;

insert into public.semesters (name, "order") values
  ('First Semester', 1),
  ('Second Semester', 2)
on conflict (name) do nothing;

insert into public.subjects (name) values
  ('Physics'),
  ('Chemistry'),
  ('Mathematics'),
  ('Further Mathematics')
on conflict (name) do nothing;
