import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  FileQuestion,
  Info,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StartExamButton } from "./start-exam-button";
import { UnlockExamButton } from "./unlock-exam-button";

export default async function CbtIntroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("*, subjects(name), courses(code, name)")
    .eq("id", id)
    .single();

  if (!exam) {
    redirect("/dashboard/practice");
  }

  if (exam.status !== "live" && exam.status !== "scheduled") {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        <p className="mt-3 text-muted-foreground">
          This exam is not currently available.
        </p>
        <div className="mt-6">
          <Button asChild variant="outline">
            <Link href="/dashboard/practice">Back to practice</Link>
          </Button>
        </div>
      </div>
    );
  }

  const locked = !exam.free;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <Link
        href="/dashboard/practice"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to practice
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={exam.tag === "mock_exam" ? "default" : "secondary"}>
          {exam.tag === "mock_exam" ? "Mock Exam" : "Practice CBT"}
        </Badge>
        {exam.type === "cbt" && <Badge variant="outline">CBT</Badge>}
        {exam.year && <Badge variant="outline">{exam.year}</Badge>}
      </div>

      <h1 className="text-3xl font-bold tracking-tight">{exam.title}</h1>
      <p className="text-muted-foreground">
        {exam.subjects?.name ??
          (exam.courses
            ? `${exam.courses.code} — ${exam.courses.name}`
            : "Prepmaster exam")}
      </p>

      <Card>
        <CardContent className="divide-y">
          <div className="flex items-center gap-3 py-4">
            <FileQuestion className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Question count</p>
              <p className="text-sm text-muted-foreground">
                {exam.question_count} questions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Duration</p>
              <p className="text-sm text-muted-foreground">
                {exam.duration_minutes} minutes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <Info className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Instructions</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                <li>You can navigate between questions freely.</li>
                <li>Flag questions to review them before submitting.</li>
                <li>
                  The exam submits automatically when the timer reaches zero.
                </li>
                <li>
                  {exam.show_explanations
                    ? "Explanations are shown after submission."
                    : "Explanations are hidden for this exam."}
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {locked ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm text-muted-foreground">
            {exam.is_premium
              ? "This is a premium exam. Subscribe to premium to unlock it."
              : "This exam requires payment. Unlock it to attempt."}
          </p>
          <div className="mt-3">
            {exam.is_premium ? (
              <Button asChild size="lg">
                <Link href="/dashboard/packages">
                  <Crown className="mr-2 h-4 w-4" />
                  Go premium
                </Link>
              </Button>
            ) : (
              <UnlockExamButton examId={id} price={exam.price} />
            )}
          </div>
        </div>
      ) : (
        <StartExamButton
          examId={id}
          durationMinutes={exam.duration_minutes}
          userId={user!.id}
        />
      )}
    </div>
  );
}
