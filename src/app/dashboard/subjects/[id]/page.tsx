import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getExamsForSubject } from "@/lib/data";
import { ExamCard, ExamCardData } from "@/components/dashboard/exam-card";
import { Resources } from "@/components/dashboard/resources";
import { createClient } from "@/lib/supabase/server";

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [[{ data: subject }, exams], { data: materials }, { data: telegram }] =
    await Promise.all([
      Promise.all([
        supabase.from("subjects").select("name").eq("id", id).single(),
        getExamsForSubject(id),
      ]),
      supabase.from("materials").select("*").eq("subject_id", id),
      supabase.from("telegram_groups").select("invite_link").eq("subject_id", id),
    ]);

  const mapped = exams.map((e) => ({
    ...e,
    subject_name: e.subjects?.name ?? null,
  })) as ExamCardData[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/dashboard/subjects"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All subjects
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">
        {subject?.name ?? "Subject"}
      </h1>
      <p className="text-muted-foreground">
        {exams.length} available {exams.length === 1 ? "CBT" : "CBTs"} and mock
        exams.
      </p>

      {mapped.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-24 text-center">
          <p className="text-muted-foreground">
            No CBTs published for this subject yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mapped.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}

      <Resources materials={materials ?? []} telegram={telegram ?? []} />
    </div>
  );
}
