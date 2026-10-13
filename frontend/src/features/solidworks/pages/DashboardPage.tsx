import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardList,
  Upload,
} from "lucide-react";
import { Card, PageHeader, SectionTitle } from "@/components/prep/bits";
import { StatStrip } from "@/features/admin/components/parts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDate } from "@/lib/mock-api";
import { GradeBadge, TaskThumb } from "../components/bits";
import { swQueries } from "../hooks/queries";
import { useSwUser } from "../hooks/useSwUser";

export function DashboardPage() {
  const user = useSwUser();
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const { data: subs } = useSuspenseQuery(swQueries.submissions(user.id));
  const { data: questions } = useSuspenseQuery(swQueries.questions(user.id));

  const graded = subs.filter((s) => s.grade);
  const good = graded.filter((s) => s.grade?.verdict === "good").length;
  const avg = graded.length
    ? Math.round(graded.reduce((n, s) => n + (s.grade?.total ?? 0), 0) / graded.length)
    : 0;
  const done = new Set(subs.map((s) => s.taskId));
  const next = tasks.find((t) => !done.has(t.id));
  const pct = tasks.length ? Math.round((done.size / tasks.length) * 100) : 0;

  return (
    <>
      <PageHeader
        title={`Hi ${user.firstName}, keep drawing`}
        subtitle="Your SolidWorks progress at a glance."
        action={
          <Button asChild>
            <Link to="/solidworks/submit">
              <Upload className="size-4" /> Submit work
            </Link>
          </Button>
        }
      />

      <StatStrip
        items={[
          { label: "Submitted", value: subs.length, delta: `of ${tasks.length} tasks` },
          { label: "Graded", value: graded.length, delta: `${subs.length - graded.length} awaiting` },
          {
            label: "Good attempts",
            value: good,
            delta: graded.length ? `${good} of ${graded.length} graded` : "No grades yet",
          },
          {
            label: "Average score",
            value: graded.length ? `${avg}/100` : "—",
            delta: `${questions.length} questions asked`,
          },
        ]}
      />

      <Card className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Task progress</span>
          <span className="text-text-muted">
            {done.size}/{tasks.length} completed
          </span>
        </div>
        <Progress value={pct} className="mt-3 h-2" />
      </Card>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <SectionTitle
            aside={
              <Link to="/solidworks/works" className="text-sm text-primary">
                View all
              </Link>
            }
          >
            Recent submissions
          </SectionTitle>
          <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
            {subs.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-text-muted">
                No submissions yet — pick a task to get started.
              </p>
            )}
            {subs.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                to="/solidworks/works/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-surface-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {tasks.find((t) => t.id === s.taskId)?.title ?? "Task"}
                  </span>
                  <span className="block text-xs text-text-muted">
                    Submitted {formatDate(s.submittedAt)}
                  </span>
                </span>
                <GradeBadge sub={s} />
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle>Up next</SectionTitle>
          {next ? (
            <Link
              to="/solidworks/tasks/$taskId"
              params={{ taskId: next.id }}
              className="group block overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
            >
              <TaskThumb task={next} />
              <div className="p-4">
                <p className="font-medium">{next.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{next.summary}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary">
                  Open task{" "}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ) : (
            <Card>
              <ClipboardList className="size-5 text-primary" />
              <p className="mt-2 text-sm font-medium">All tasks submitted 🎉</p>
              <p className="text-sm text-text-muted">New tasks drop with each video.</p>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
