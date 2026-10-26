alter table public.sw_tasks
  add column if not exists target_mass numeric,
  add column if not exists target_volume numeric,
  add column if not exists tolerance_percent numeric not null default 0.5;
