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
