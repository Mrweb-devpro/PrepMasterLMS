-- Fix handle_new_user to persist registration metadata (track/level/etc.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, track_id, faculty_id, department_id, level_id, semester_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'student',
    nullif(new.raw_user_meta_data->>'track_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'faculty_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'department_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'level_id', '')::uuid,
    nullif(new.raw_user_meta_data->>'semester_id', '')::uuid
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    track_id = coalesce(excluded.track_id, public.profiles.track_id),
    faculty_id = coalesce(excluded.faculty_id, public.profiles.faculty_id),
    department_id = coalesce(excluded.department_id, public.profiles.department_id),
    level_id = coalesce(excluded.level_id, public.profiles.level_id),
    semester_id = coalesce(excluded.semester_id, public.profiles.semester_id);
  return new;
end;
$$;
