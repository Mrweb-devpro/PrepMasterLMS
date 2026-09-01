import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ExamSettings } from "./exam-settings";
import { AddQuestionsDialog } from "./add-questions-dialog";
import { RemoveQuestionButton } from "./remove-question";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: exam } = await supabase.from("exams").select("*").eq("id", id).single();
  if (!exam) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-muted-foreground">Exam not found.</p>
      </div>
    );
  }

  const { data: links } = await supabase
    .from("exam_questions")
    .select("question_id, position")
    .eq("exam_id", id)
    .order("position", { ascending: true });

  const { data: banks } = await supabase
    .from("question_banks")
    .select("id, name")
    .order("name");

  const qids = (links ?? []).map((l) => l.question_id);
  const { data: questions } = qids.length
    ? await supabase.from("questions").select("*").in("id", qids)
    : { data: [] as { id: string; text: string }[] };

  const qmap = new Map((questions ?? []).map((q) => [q.id, q]));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/exams"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All exams
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>
            <Badge variant="outline">{exam.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {exam.type} · {exam.duration_minutes} min · {questions?.length ?? 0} questions
            {exam.year ? ` · ${exam.year}` : ""}
            {exam.free ? " · Free" : " · Paid"}
          </p>
        </div>
        <AddQuestionsDialog examId={id} existingIds={qids} banks={banks ?? []} />
      </div>

      <ExamSettings exam={exam} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Questions</h2>
          <span className="text-sm text-muted-foreground">
            Ordered by position
          </span>
        </div>

        {questions && questions.length > 0 ? (
          <div className="space-y-2">
            {(links ?? []).map((l) => {
              const q = qmap.get(l.question_id);
              if (!q) return null;
              return (
                <Card key={l.question_id}>
                  <CardContent className="flex items-start justify-between gap-3 p-4">
                    <p className="font-medium">
                      <span className="mr-2 text-muted-foreground">
                        {l.position + 1}.
                      </span>
                      {q.text}
                    </p>
                    <RemoveQuestionButton examId={id} questionId={l.question_id} />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">
                No questions yet. Add questions from a bank.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
