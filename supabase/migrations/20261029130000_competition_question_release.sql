-- Competition-created practice sets remain hidden until the post-contest buffer ends.
alter table public.competitions
  add column if not exists question_limit integer check (question_limit is null or question_limit > 0);

alter table public.cbts
  add column if not exists competition_id uuid references public.competitions(id) on delete set null,
  add column if not exists releases_at timestamptz;

alter table public.competition_entries
  add column if not exists question_ids uuid[] not null default '{}';

create index if not exists idx_cbts_competition_release
  on public.cbts (competition_id, releases_at);
