import Link from "next/link";
import { Clock, FileQuestion, Play, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ExamCardData = {
  id: string;
  title: string;
  type: string;
  tag: string;
  duration_minutes: number;
  question_count: number;
  free: boolean;
  is_premium: boolean;
  status: string;
  year: number | null;
  subject_name?: string | null;
  course_label?: string | null;
};

export function ExamCard({ exam }: { exam: ExamCardData }) {
  const locked = exam.is_premium && !exam.free;
  const canAttempt = exam.question_count > 0;

  return (
    <div className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant={exam.type === "mock" ? "default" : "secondary"}>
              {exam.tag === "mock_exam" ? "Mock Exam" : "Practice"}
            </Badge>
            {exam.year && <Badge variant="outline">{exam.year}</Badge>}
          </div>
          {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
        <h3 className="mt-3 text-base font-semibold leading-snug">
          {exam.title}
        </h3>
        {exam.subject_name && (
          <p className="mt-1 text-sm text-muted-foreground">
            {exam.subject_name}
          </p>
        )}
        {exam.course_label && (
          <p className="mt-1 text-sm text-muted-foreground">
            {exam.course_label}
          </p>
        )}
      </div>

      <div>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            {exam.duration_minutes} min
          </span>
          <span className="flex items-center gap-1.5">
            <FileQuestion className="h-4 w-4" />
            {exam.question_count} Qs
          </span>
          {exam.type === "cbt" && (
            <Badge variant="outline" className="text-xs">
              CBT
            </Badge>
          )}
        </div>
        <div className="mt-4">
          {locked ? (
            <Button variant="outline" className="w-full" disabled>
              <Lock className="mr-2 h-4 w-4" />
              Unlock to attempt
            </Button>
          ) : canAttempt ? (
            <Button asChild className="w-full">
              <Link href={`/dashboard/cbt/${exam.id}`}>
                <Play className="mr-2 h-4 w-4" />
                {exam.type === "cbt" ? "Start CBT" : "Start practice"}
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Coming soon
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
