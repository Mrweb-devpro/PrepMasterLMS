"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";

export async function submitAttempt(input: {
  attemptId: string;
  answers: Record<string, string>;
  flagged: string[];
  durationSeconds: number;
}) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, exam_id")
    .eq("id", input.attemptId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .single();

  if (!attempt) return { error: "Attempt not found or already submitted." };

  const { data: examQuestions } = await supabase
    .from("exam_questions")
    .select("question_id")
    .eq("exam_id", attempt.exam_id);

  const qids = (examQuestions ?? []).map((q) => q.question_id);
  const { data: questions } = await supabase
    .from("questions")
    .select("id, correct_answer")
    .in("id", qids);

  const qmap = new Map(
    (questions ?? []).map((q: { id: string; correct_answer: string }) => [
      q.id,
      q.correct_answer,
    ])
  );

  let score = 0;
  for (const [qid, answer] of Object.entries(input.answers)) {
    if (qmap.get(qid) === answer) score++;
  }

  const { data, error } = await supabase
    .from("attempts")
    .update({
      answers: input.answers,
      flagged: input.flagged,
      score,
      total: qids.length,
      duration_seconds: input.durationSeconds,
      submitted_at: new Date().toISOString(),
      status: "submitted",
    })
    .eq("id", input.attemptId)
    .eq("user_id", user.id)
    .select("id, score, total")
    .single();

  if (error) return { error: error.message };
  return { result: data };
}

export async function saveProgress(input: {
  attemptId: string;
  answers: Record<string, string>;
  flagged: string[];
}) {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("attempts")
    .select("id")
    .eq("id", input.attemptId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();
  if (!attempt) return { error: "Attempt not found." };

  const { error } = await supabase
    .from("attempts")
    .update({ answers: input.answers, flagged: input.flagged })
    .eq("id", input.attemptId)
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  return { ok: true };
}
