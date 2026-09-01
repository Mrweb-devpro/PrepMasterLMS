"use server";

import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";
import { hasExamAccess } from "@/lib/access";

export async function startExam(examId: string) {
  const user = await getUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, status, is_premium, free")
    .eq("id", examId)
    .single();

  if (!exam) return { error: "Exam not found." };
  if (exam.status !== "live" && exam.status !== "scheduled") {
    return { error: "This exam is not available." };
  }

  if (!exam.free) {
    const access = await hasExamAccess(user.id, examId);
    if (!access.unlocked) {
      return { error: "This exam requires payment. Unlock it to start." };
    }
  }

  // Resume an existing in-progress attempt if there is one
  const { data: existing } = await supabase
    .from("attempts")
    .select("id")
    .eq("exam_id", examId)
    .eq("user_id", user.id)
    .eq("status", "in_progress")
    .maybeSingle();

  if (existing) return { attemptId: existing.id };

  const { data, error } = await supabase
    .from("attempts")
    .insert({ exam_id: examId, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { attemptId: data.id };
}
