import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ExamActions } from "./exam-actions";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  scheduled: "outline",
  live: "default",
  paused: "outline",
  ended: "secondary",
};

export default async function AdminExamsPage() {
  const supabase = await createClient();
  const [{ data: exams }, { data: subjects }, { data: courses }] =
    await Promise.all([
      supabase.from("exams").select("*").order("created_at", { ascending: false }),
      supabase.from("subjects").select("id, name"),
      supabase.from("courses").select("id, code, name"),
    ]);

  const scopeLabel = (e: { subject_id: string | null; course_id: string | null }) => {
    if (e.subject_id)
      return subjects?.find((s) => s.id === e.subject_id)?.name ?? "Subject";
    if (e.course_id) {
      const c = courses?.find((x) => x.id === e.course_id);
      return c ? `${c.code} ${c.name}` : "Course";
    }
    return "—";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">CBTs &amp; Exams</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Create and manage CBTs, quizzes, mock exams and past-paper tests.
          </p>
        </div>
        <div className="shrink-0">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/exams/new">
              <Plus className="mr-2 h-4 w-4" />
              Create exam
            </Link>
          </Button>
        </div>
      </div>

      {exams && exams.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          {exams.map((e) => (
            <div
              key={e.id}
              className="flex flex-col gap-3 border-b p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={STATUS_VARIANT[e.status] ?? "secondary"}>
                  {e.status}
                </Badge>
                <div>
                  <Link
                    href={`/admin/exams/${e.id}`}
                    className="font-semibold hover:text-primary hover:underline"
                  >
                    {e.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {scopeLabel(e)} · {e.tag === "mock_exam" ? "Mock" : e.type} ·{" "}
                    {e.duration_minutes} min · {e.question_count} Qs
                    {e.year ? ` · ${e.year}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {e.free ? (
                  <Badge variant="secondary">Free</Badge>
                ) : (
                  <Badge variant="outline">Paid</Badge>
                )}
                {e.is_premium && <Badge variant="outline">Premium</Badge>}
                <ExamActions exam={e} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              No exams yet. Create your first CBT.
            </p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/admin/exams/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create exam
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
