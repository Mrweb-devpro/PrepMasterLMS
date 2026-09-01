import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getExamsForCourse } from "@/lib/data";
import { ExamCard, ExamCardData } from "@/components/dashboard/exam-card";
import { Resources } from "@/components/dashboard/resources";
import { createClient } from "@/lib/supabase/server";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: course }, exams] = await Promise.all([
    supabase
      .from("courses")
      .select("code, name, level_id")
      .eq("id", id)
      .single(),
    getExamsForCourse(id),
  ]);

  const [{ data: materials }, { data: telegram }, { data: level }] =
    await Promise.all([
      supabase.from("materials").select("*").eq("course_id", id),
      supabase.from("telegram_groups").select("invite_link").eq("course_id", id),
      course?.level_id
        ? supabase
            .from("levels")
            .select("telegram_invite_link")
            .eq("id", course.level_id)
            .single()
        : Promise.resolve({ data: null }),
    ]);

  const levelLink = level?.telegram_invite_link;
  const telegramLinks = [
    ...(telegram ?? []),
    ...(levelLink ? [{ invite_link: levelLink }] : []),
  ];

  const mapped = exams.map((e) => ({
    ...e,
    course_label: course?.code ? `${course.code} — ${course.name}` : null,
    subject_name: e.subjects?.name ?? null,
  })) as ExamCardData[];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/dashboard/courses"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All courses
      </Link>
      <div>
        <div className="text-sm font-semibold uppercase tracking-wide text-primary">
          {course?.code}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{course?.name}</h1>
        <p className="mt-1 text-muted-foreground">
          {exams.length} available {exams.length === 1 ? "CBT" : "CBTs"} for
          this course.
        </p>
      </div>

      {mapped.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-24 text-center">
          <p className="text-muted-foreground">
            No CBTs published for this course yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mapped.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}

      <Resources materials={materials ?? []} telegram={telegramLinks} />
    </div>
  );
}
