-- ============================================================
-- Exam payments (Paystack)
-- Adds exam_id to payments so a single purchase unlocks one exam
-- ============================================================

alter table public.payments
  add column exam_id uuid references public.exams(id) on delete cascade;

create index if not exists payments_exam_user_idx
  on public.payments (exam_id, user_id);
