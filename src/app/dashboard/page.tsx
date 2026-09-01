import Link from "next/link";
import {
  Award,
  ArrowRight,
  ClipboardCheck,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isUniversity
            ? "Pick a course below to start a CBT or practice."
            : "Pick a subject below to start practicing for your exams."}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available exams</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-xs text-muted-foreground">
              CBTs you can start right now
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mock exams</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exams.filter((e) => e.tag === "mock_exam").length}
            </div>
            <p className="text-xs text-muted-foreground">
              Scheduled mock exams
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Track</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {isUniversity ? "University" : "Secondary"}
            </div>
            <p className="text-xs text-muted-foreground">
              {isUniversity ? "Course-based practice" : "Subject-based practice"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available exams */}
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
          <Card className="border-dashed">
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
