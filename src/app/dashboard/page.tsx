import Link from "next/link";
import {
  Award,
  ArrowRight,
  ClipboardCheck,
  Timer,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getUser, getProfile } from "@/lib/session";
import { getAllAvailableExams } from "@/lib/data";
import { ExamCard, ExamCardData } from "@/components/dashboard/exam-card";

export default async function DashboardOverview() {
  const user = await getUser();
  const profile = await getProfile();
  const exams = (await getAllAvailableExams(profile)) as ExamCardData[];

  const trackType = profile?.tracks?.type ?? "secondary";
  const isUniversity = trackType === "university";
  const displayName = profile?.full_name ?? user?.email?.split("@")[0] ?? "there";

  const stats = [
    {
      label: "Available exams",
      value: exams.length,
      sub: "CBTs you can start right now",
      icon: Timer,
      pastel: "bg-blue-50 dark:bg-blue-950/20",
      accent: "text-blue-600 dark:text-blue-400",
      bar: [40, 65, 50, 80, 55],
    },
    {
      label: "Mock exams",
      value: exams.filter((e) => e.tag === "mock_exam").length,
      sub: "Scheduled mock exams",
      icon: ClipboardCheck,
      pastel: "bg-amber-50 dark:bg-amber-950/20",
      accent: "text-amber-600 dark:text-amber-400",
      bar: [30, 45, 60, 35, 70],
    },
    {
      label: "Track",
      value: isUniversity ? "University" : "Secondary",
      sub: isUniversity ? "Course-based practice" : "Subject-based practice",
      icon: Award,
      pastel: "bg-emerald-50 dark:bg-emerald-950/20",
      accent: "text-emerald-600 dark:text-emerald-400",
      bar: [50, 30, 70, 45, 60],
      isText: true,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-0">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back, {displayName}
          <Sparkles className="h-5 w-5 text-primary" />
        </h1>
        <p className="text-sm text-muted-foreground">
          {isUniversity
            ? "Pick a course below to start a CBT or practice."
            : "Pick a subject below to start practicing for your exams."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`flex min-h-[110px] flex-col justify-between rounded-2xl border bg-card p-3 shadow-sm sm:min-h-[140px] sm:p-4 ${s.pastel}`}
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-card sm:h-8 sm:w-8 ${s.accent}`}>
                <s.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <span className="hidden items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm dark:bg-card sm:flex">
                <TrendingUp className="h-2.5 w-2.5 text-emerald-600" />
                +8%
              </span>
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground sm:text-xs">{s.label}</p>
              <p className={`mt-1 font-bold tracking-tight ${s.isText ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}>{s.value}</p>
              <p className="hidden text-xs text-muted-foreground sm:block">{s.sub}</p>
              <div className="mt-2 flex items-end gap-1 sm:mt-3">
                {s.bar.map((h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-full ${s.accent} bg-current opacity-20`}
                    style={{ height: `${h * 0.18}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Available CBTs</h2>
          <Button variant="ghost" asChild>
            <Link href="/dashboard/practice">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {exams.length === 0 ? (
          <Card className="rounded-[1.75rem] border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No exams available</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                You&apos;ll see CBTs and mock exams here as soon as they&apos;re
                published for your {isUniversity ? "level" : "subjects"}.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {exams.slice(0, 6).map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
