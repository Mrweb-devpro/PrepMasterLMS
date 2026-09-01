import Link from "next/link";
import { Database, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { CreateBank } from "./create-bank";

export default async function QuestionBanksPage() {
  const supabase = await createClient();
  const [{ data: banks }, { data: subjects }, { data: courses }] =
    await Promise.all([
      supabase.from("question_banks").select("*").order("name"),
      supabase.from("subjects").select("*"),
      supabase.from("courses").select("id, code, name"),
    ]);

  // count questions per bank
  const banksWithCounts = await Promise.all(
    (banks ?? []).map(async (b) => {
      const { count } = await supabase
        .from("bank_questions")
        .select("id", { count: "exact", head: true })
        .eq("bank_id", b.id);
      return { ...b, count: count ?? 0 };
    })
  );

  const scopeLabel = (b: { subject_id: string | null; course_id: string | null }) => {
    if (b.subject_id)
      return subjects?.find((s) => s.id === b.subject_id)?.name ?? "Subject";
    if (b.course_id) {
      const c = courses?.find((x) => x.id === b.course_id);
      return c ? `${c.code} ${c.name}` : "Course";
    }
    return "General";
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question Banks</h1>
          <p className="mt-1 text-muted-foreground">
            Organise questions by subject or course, tagged by topic for targeted
            practice and CBT building.
          </p>
        </div>
        <CreateBank />
      </div>

      {banksWithCounts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {banksWithCounts.map((b) => (
            <Link key={b.id} href={`/admin/question-banks/${b.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <Database className="h-5 w-5 text-primary" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="mt-3 font-semibold">{b.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {scopeLabel(b)} · {b.count} question{b.count === 1 ? "" : "s"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <Database className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              No question banks yet. Create one to start adding questions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
