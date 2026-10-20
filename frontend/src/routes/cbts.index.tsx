import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, Clock3, ListChecks, Loader2 } from "lucide-react";
import { useState } from "react";
import { StudentShell } from "@/components/prep/StudentShell";
import { CbtEmptyIllustration } from "@/components/common/EmptyStateIllustration";
import { EmptyState, PageHeader, PaidPill } from "@/components/prep/bits";
import { cbtStatusPill } from "@/features/cbt/utils/cbt-status";
import { formatDateTime } from "@/lib/mock-data";
import { useCatalog } from "@/features/catalog/useCatalog";
import { usePrep } from "@/lib/prep-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cbts/")({
  head: () => ({
    meta: [
      { title: "CBTs | PrepMaster" },
      {
        name: "description",
        content: "Timed practice sets and scheduled live computer-based tests.",
      },
      { property: "og:title", content: "CBTs | PrepMaster" },
      {
        property: "og:description",
        content: "Timed practice sets and scheduled live computer-based tests.",
      },
    ],
  }),
  component: CbtsPage,
});

function CbtsPage() {
  const prep = usePrep();
  const { cbts, getCourse, loading } = useCatalog();
  const [tab, setTab] = useState<"practice" | "live">("practice");
  const list = cbts.filter((c) => c.kind === tab);

  return (
    <StudentShell>
      <PageHeader
        title="CBTs"
        subtitle="Practise at your own pace or join a scheduled live exam."
      />

      <div className="mb-6 inline-flex rounded-md border border-border bg-surface p-1 shadow-sm">
        {(["practice", "live"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-ink text-ink-foreground"
                : "text-text-secondary hover:text-foreground",
            )}
          >
            {t === "practice" ? "Practice sets" : "Live exams"}
          </button>
        ))}
      </div>

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-text-muted">
          <Loader2 className="size-4 animate-spin" /> Loading CBTs…
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          illustration={<CbtEmptyIllustration />}
          title={tab === "practice" ? "No practice CBTs available" : "No live CBTs scheduled"}
          description={
            tab === "practice"
              ? "Practice CBTs will appear here when they are available."
              : "Your upcoming live exams will appear here once they are scheduled."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((cbt) => {
            const course = getCourse(cbt.courseSlug);
            return (
              <Link
                key={cbt.id}
                to="/cbts/$cbtId"
                params={{ cbtId: cbt.id }}
                className="card-hover group flex flex-col rounded-lg border border-border bg-surface p-5 shadow-sm"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span
                    className="rounded-sm px-2 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${course?.color}1a`, color: course?.color }}
                  >
                    {course?.code}
                  </span>
                  <div className="flex gap-1.5">
                    {cbtStatusPill(cbt)}
                    <PaidPill paid={cbt.paid} owned={prep.ownsCbt(cbt.id)} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold leading-snug">{cbt.title}</h3>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <ListChecks className="size-4" />
                    {cbt.questionCount} questions
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock3 className="size-4" />
                    {cbt.minutes} min
                  </span>
                  {cbt.scheduledFor && (
                    <span className="flex items-center gap-1.5">
                      <CalendarClock className="size-4" />
                      {formatDateTime(cbt.scheduledFor)}
                    </span>
                  )}
                </div>
                <span className="mt-5 flex items-center gap-1 text-sm font-medium text-primary">
                  View details{" "}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </StudentShell>
  );
}
