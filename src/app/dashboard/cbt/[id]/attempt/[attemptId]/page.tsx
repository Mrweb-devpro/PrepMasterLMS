import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { CbtPlayer, QuestionData } from "./cbt-player";

export default async function CbtAttemptPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const [{ data: attempt }, { data: exam }, { data: questionLinks }] =
    await Promise.all([
      supabase
        .from("attempts")
        .select("*")
        .eq("id", attemptId)
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("exams")
        .select("*")
        .eq("id", id)
        .single(),
      supabase
        .from("exam_questions")
        .select("position, question_id")
        .eq("exam_id", id)
        .order("position"),
    ]);

  if (!attempt || !exam) redirect("/dashboard/practice");

  // If already submitted, redirect to the result page
  if (attempt.submitted_at) {
    redirect(`/dashboard/cbt/${id}/result/${attemptId}`);
  }

  const questionIds = (questionLinks ?? []).map((q) => q.question_id);
  const { data: qs } = await supabase
    .from("questions")
    .select("*")
    .in("id", questionIds);

  const orderedQuestions = (questionLinks ?? [])
    .map((eq) =>
      (qs ?? []).find((q: { id: string }) => q.id === eq.question_id)
    )
    .filter(Boolean);

  return (
    <CbtPlayer
      exam={{
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.duration_minutes,
        showExplanations: exam.show_explanations,
      }}
      attemptId={attempt.id}
      attempt={{
        startedAt: attempt.started_at,
        answers: attempt.answers as Record<string, string>,
        flagged: attempt.flagged as string[],
      }}
      questions={orderedQuestions as QuestionData[]}
    />
  );
}
