alter table public.cbt_attempts
  add column if not exists flagged_question_ids text[] not null default '{}';
