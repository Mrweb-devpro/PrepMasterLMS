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
  TrendingUp,
  Sparkles,
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
    {
      label: "Students",
      value: users ?? 0,
      icon: Users,
      href: "/admin/users",
      pastel: "bg-blue-50 dark:bg-blue-950/20",
      accent: "text-blue-600 dark:text-blue-400",
      bar: [40, 65, 50, 80, 55],
    },
    {
      label: "CBTs & Exams",
      value: exams ?? 0,
      icon: FileText,
      href: "/admin/exams",
      pastel: "bg-amber-50 dark:bg-amber-950/20",
      accent: "text-amber-600 dark:text-amber-400",
      bar: [30, 45, 60, 35, 70],
    },
    {
      label: "Questions",
      value: questions ?? 0,
      icon: FileQuestion,
      href: "/admin/question-banks",
      pastel: "bg-pink-50 dark:bg-pink-950/20",
      accent: "text-pink-600 dark:text-pink-400",
      bar: [50, 30, 70, 45, 60],
    },
    {
      label: "Question Banks",
      value: banks ?? 0,
      icon: Database,
      href: "/admin/question-banks",
      pastel: "bg-emerald-50 dark:bg-emerald-950/20",
      accent: "text-emerald-600 dark:text-emerald-400",
      bar: [35, 55, 40, 65, 50],
    },
  ];

  const quickActions = [
    { label: "Create a CBT", href: "/admin/exams/new", icon: FileText },
    { label: "Add questions to bank", href: "/admin/question-banks", icon: FileQuestion },
    { label: "Add a course", href: "/admin/courses", icon: GraduationCap },
    { label: "Add a subject", href: "/admin/subjects", icon: BookOpen },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Admin overview</h1>
          <p className="mt-1 flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Manage your platform: content, exams, question banks and structure.
          </p>
        </div>
        <Link
          href="/admin/exams/new"
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition-colors hover:bg-foreground/90"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground">+</span>
          Add New
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <div
              className={`flex aspect-square flex-col justify-between rounded-[1.75rem] border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${s.pastel}`}
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-card ${s.accent}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-foreground shadow-sm dark:bg-card">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  +12%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-3xl font-bold tracking-tight">{s.value}</p>
                <div className="mt-4 flex items-end gap-1">
                  {s.bar.map((h, i) => (
                    <div
                      key={i}
                      className={`w-full rounded-full ${s.accent} bg-current opacity-20 group-hover:opacity-30`}
                      style={{ height: `${h * 0.35}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="rounded-[1.75rem] border-0 bg-foreground text-background shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-background">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
                <ClipboardCheck className="h-4 w-4" />
              </span>
              Live now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="text-5xl font-bold tracking-tight">{liveExams ?? 0}</div>
              <div className="mb-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">active</div>
            </div>
            <p className="mt-2 text-sm text-white/70">CBTs currently live for students — monitor and manage in real time.</p>
            <div className="mt-6 flex gap-2">
              <div className="h-1.5 w-12 rounded-full bg-white" />
              <div className="h-1.5 w-8 rounded-full bg-white/30" />
              <div className="h-1.5 w-6 rounded-full bg-white/20" />
            </div>
            <Link
              href="/admin/exams"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/90"
            >
              Manage exams
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] p-0 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Quick actions</CardTitle>
            <p className="text-sm text-muted-foreground">Jump to common tasks</p>
          </CardHeader>
          <CardContent className="grid gap-3">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-sm font-medium transition-colors hover:bg-accent hover:shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <a.icon className="h-4 w-4" />
                </span>
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
