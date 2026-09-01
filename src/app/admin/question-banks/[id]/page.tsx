import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { AddQuestionForm } from "./add-question";
import { RemoveQuestionButton } from "./remove-question";

type QuestionRow = {
  id: string;
  text: string;
  options: string[] | Record<string, string>;
  correct_answer: string;
  explanation: string | null;
  topic: string | null;
  difficulty: string | null;
  is_premium: boolean;
};

export default async function BankDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: bank } = await supabase
    .from("question_banks")
    .select("*")
    .eq("id", id)
    .single();

  if (!bank) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-muted-foreground">Bank not found.</p>
      </div>
    );
  }

  const { data: links } = await supabase
    .from("bank_questions")
    .select("question_id, topic")
    .eq("bank_id", id);

  const qids = (links ?? []).map((l) => l.question_id);
  const { data: rawQs } = qids.length
    ? await supabase.from("questions").select("*").in("id", qids)
    : { data: [] as QuestionRow[] };
  const qs = (rawQs ?? []) as QuestionRow[];

  const questions: (QuestionRow & { bankTopic: string | null })[] = (links ?? [])
    .map((l) => {
      const q = qs.find((x) => x.id === l.question_id);
      return q ? { ...q, bankTopic: l.topic } : null;
    })
    .filter((q): q is NonNullable<typeof q> => q !== null);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/admin/question-banks"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All banks
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{bank.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {questions.length} question{questions.length === 1 ? "" : "s"} in this
            bank.
          </p>
        </div>
        <AddQuestionForm bankId={bank.id} />
      </div>

      {questions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <Database className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              No questions yet. Add your first question.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Card key={q.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">
                    <span className="mr-2 text-muted-foreground">Q{i + 1}.</span>
                    {q.text}
                  </p>
                  <RemoveQuestionButton bankId={bank.id} questionId={q.id} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {Array.isArray(q.options) ? (
                    q.options.map((o, idx) => (
                      <span
                        key={idx}
                        className={`rounded-md px-2 py-1 text-xs font-medium ${
                          String.fromCharCode(65 + idx) === q.correct_answer
                            ? "bg-green-100 text-green-800 dark:bg-green-500/20"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {String(o)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {JSON.stringify(q.options)}
                    </span>
                  )}
                  {q.bankTopic && <Badge variant="secondary">{q.bankTopic}</Badge>}
                  {q.is_premium && <Badge variant="outline">Premium</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
