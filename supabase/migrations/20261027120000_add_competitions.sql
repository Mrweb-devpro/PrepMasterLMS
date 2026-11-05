-- Scheduled competitions and their student entries.
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

alter table public.competition_entries
  add column if not exists answers jsonb not null default '{}'::jsonb,
  add column if not exists question_answered_at jsonb not null default '{}'::jsonb;

create index if not exists idx_competitions_status
  on public.competitions (status, starts_at);
create index if not exists idx_competition_entries_comp_score
  on public.competition_entries (competition_id, score desc, speed_seconds asc);

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
