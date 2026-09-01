import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

const OPTION_KEYS = ["A", "B", "C", "D", "E"];

type Question = {
  id: string;
  text: string;
  options: string[] | Record<string, string>;
  correct_answer: string;
  explanation?: string | null;
};

function getOptions(q: Question): { key: string; value: string }[] {
  if (Array.isArray(q.options)) {
    return q.options.map((v, i) => ({
      key: OPTION_KEYS[i] ?? String(i + 1),
      value: v,
    }));
  }
  return Object.entries(q.options).map(([k, v]) => ({ key: k, value: v }));
}

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .single();

  if (!attempt || !attempt.submitted_at) {
    redirect(`/dashboard/cbt/${id}`);
  }

  const { data: exam } = await supabase.from("exams").select("*").eq("id", id).single();

  const { data: links } = await supabase
    .from("exam_questions")
    .select("question_id, position")
    .eq("exam_id", id)
    .order("position");

  const qids = (links ?? []).map((l) => l.question_id);
  const { data: qs } = await supabase
    .from("questions")
    .select("*")
    .in("id", qids);

  const questions = (links ?? [])
    .map((l) => (qs ?? []).find((q: { id: string }) => q.id === l.question_id))
    .filter(Boolean) as Question[];

  const answers = (attempt.answers ?? {}) as Record<string, string>;
  const score = attempt.score ?? 0;
  const total = attempt.total ?? questions.length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <Link
        href="/dashboard/practice"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to practice
      </Link>

      <Card>
        <CardContent className="flex flex-col items-center py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Award className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-3xl font-bold">{exam?.title}</h1>
          <p className="mt-2 text-xl font-semibold text-primary">
            {score} / {total} ({percent}%)
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {percent >= 70
              ? "Excellent — you're doing great!"
              : percent >= 50
              ? "Good effort — keep practicing to improve."
              : "Keep practicing — review the explanations below."}
          </p>
          {exam?.re_attempts_enabled && (
            <Button className="mt-6" variant="outline" asChild>
              <Link href={`/dashboard/cbt/${id}`}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Re-attempt this exam
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {exam?.show_explanations && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Review your answers</h2>
          {questions.map((q, i) => {
            const userAnswer = answers[q.id];
            const correct = userAnswer === q.correct_answer;
            const options = getOptions(q);
            return (
              <Card key={q.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">
                      <span className="mr-2 text-muted-foreground">
                        Q{i + 1}.
                      </span>
                      {q.text}
                    </p>
                    {correct ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-destructive" />
                    )}
                  </div>
                  <div className="mt-4 space-y-2">
                    {options.map((opt) => {
                      const isCorrect = opt.key === q.correct_answer;
                      const isChosen = opt.key === userAnswer;
                      return (
                        <div
                          key={opt.key}
                          className={cn(
                            "flex items-start gap-3 rounded-lg border-2 px-3 py-2 text-sm",
                            isCorrect
                              ? "border-green-500 bg-green-50 dark:bg-green-500/10"
                              : isChosen && !correct
                              ? "border-destructive bg-destructive/5"
                              : "border-border"
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold",
                              isCorrect
                                ? "bg-green-600 text-white"
                                : isChosen
                                ? "bg-destructive text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {opt.key}
                          </span>
                          <span className="pt-0.5">{opt.value}</span>
                        </div>
                      );
                    })}
                  </div>
                  {!userAnswer && (
                    <p className="mt-3 text-sm font-medium text-amber-600">
                      Not answered
                    </p>
                  )}
                  {q.explanation && (
                    <div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm">
                      <span className="font-semibold">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
