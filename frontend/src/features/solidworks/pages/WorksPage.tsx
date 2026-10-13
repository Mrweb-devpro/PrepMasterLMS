import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { EmptyState, PageHeader } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import { GradeBadge, TaskThumb } from "../components/bits";
import { swQueries } from "../hooks/queries";
import { useSwUser } from "../hooks/useSwUser";

const FILTERS = [
  { v: "all", label: "All" },
  { v: "graded", label: "Graded" },
  { v: "pending", label: "Awaiting grade" },
] as const;

export function WorksPage() {
  const user = useSwUser();
  const { data: subs } = useSuspenseQuery(swQueries.submissions(user.id));
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const [f, setF] = useState<(typeof FILTERS)[number]["v"]>("all");
  const list = subs.filter((s) => f === "all" || (f === "graded" ? !!s.grade : !s.grade));

  return (
    <>
      <PageHeader
        title="My works"
        subtitle="Everything you've submitted, with your results."
        action={
          <Button asChild>
            <Link to="/solidworks/submit">Submit work</Link>
          </Button>
        }
      />
      <div className="mb-5 flex gap-1.5">
        {FILTERS.map((x) => (
          <button
            key={x.v}
            onClick={() => setF(x.v)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs",
              f === x.v
                ? "border-primary bg-primary-soft font-medium text-primary"
                : "border-border bg-surface",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>
      {list.length === 0 && (
        <EmptyState title="Nothing here yet" description="Your submissions will show up here." />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => {
          const t = tasks.find((x) => x.id === s.taskId);
          return (
            <Link
              key={s.id}
              to="/solidworks/works/$id"
              params={{ id: s.id }}
              className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-shadow hover:shadow-md"
            >
              {t && <TaskThumb task={t} />}
              <div className="space-y-2 p-4">
                <p className="font-medium">{t?.title ?? "Deleted task"}</p>
                <p className="text-xs text-text-muted">
                  Submitted {formatDate(s.submittedAt)} · {s.files.length} file
                  {s.files.length === 1 ? "" : "s"}
                </p>
                <GradeBadge sub={s} />
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
