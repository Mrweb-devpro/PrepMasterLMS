-- ============================================================
-- Prepmaster LMS — Anonymous read access for registration
-- The register page loads reference data (tracks, faculties,
-- departments, levels, semesters) BEFORE the user is signed in,
-- so those tables need `anon` SELECT policies too.
-- ============================================================

create policy "tracks_read_anon" on public.tracks
  for select to anon using (true);

create policy "faculties_read_anon" on public.faculties
  for select to anon using (true);

create policy "departments_read_anon" on public.departments
  for select to anon using (true);

create policy "levels_read_anon" on public.levels
  for select to anon using (true);

create policy "semesters_read_anon" on public.semesters
  for select to anon using (true);
