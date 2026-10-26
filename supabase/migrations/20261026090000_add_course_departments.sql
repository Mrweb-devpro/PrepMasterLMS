-- Courses can target an academic level and multiple departments.
-- An empty department array is general/open to all departments.
alter table public.courses
  add column if not exists departments text[] not null default '{}';

alter table public.courses
  add column if not exists level text not null default 'all';

comment on column public.courses.level is
  'Academic level: 100, 200, 300, 400, 500, 600, Postgraduate, or all';
comment on column public.courses.departments is
  'List of department names eligible for this course. Empty array means general / all departments.';
