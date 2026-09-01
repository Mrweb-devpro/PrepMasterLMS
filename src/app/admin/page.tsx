import Link from "next/link";
import {
  Users,
  FileText,
  FileQuestion,
  Database,
  GraduationCap,
  BookOpen,
  ArrowRight,
  ClipboardCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverview() {
  const supabase = await createClient();

  const [{ count: users }, { count: exams }, { count: questions }, { count: banks }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "student"),
      supabase.from("exams").select("id", { count: "exact", head: true }),
      supabase.from("questions").select("id", { count: "exact", head: true }),
      supabase
        .from("question_banks")
        .select("id", { count: "exact", head: true }),
    ]);

  const { count: liveExams } = await supabase
    .from("exams")
    .select("id", { count: "exact", head: true })
    .eq("status", "live");

  const stats = [
    { label: "Students", value: users ?? 0, icon: Users, href: "/admin/users" },
    { label: "CBTs & Exams", value: exams ?? 0, icon: FileText, href: "/admin/exams" },
    { label: "Questions", value: questions ?? 0, icon: FileQuestion, href: "/admin/question-banks" },
    { label: "Question Banks", value: banks ?? 0, icon: Database, href: "/admin/question-banks" },
  ];

  const quickActions = [
    { label: "Create a CBT", href: "/admin/exams/new", icon: FileText },
    { label: "Add questions to bank", href: "/admin/question-banks", icon: FileQuestion },
    { label: "Add a course", href: "/admin/courses", icon: GraduationCap },
    { label: "Add a subject", href: "/admin/subjects", icon: BookOpen },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin overview</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your platform: content, exams, question banks and structure.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Live now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 text-green-600">
                <ClipboardCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{liveExams ?? 0}</div>
                <p className="text-sm text-muted-foreground">
                  CBTs currently live for students
                </p>
              </div>
            </div>
            <Link
              href="/admin/exams"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Manage exams
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                <a.icon className="h-4 w-4 text-primary" />
                {a.label}
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
