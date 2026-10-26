import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, Clock3, ListChecks, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { StudentShell } from "@/components/prep/StudentShell";
import { CbtMonitorIllustration } from "@/components/common/EmptyStateIllustration";
import { EmptyState, PageHeader, PaidPill } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { DepartmentFilter, type DepartmentFilterMode } from "@/features/catalog/components/DepartmentFilter";
import { cbtStatusPill } from "@/features/cbt/utils/cbt-status";
import { isAttemptableLiveCbt, isCbtClosed } from "@/features/cbt/utils/cbt-lifecycle";
import { useSession } from "@/features/auth/session";
import { formatDateTime } from "@/lib/mock-data";
import { useCatalog } from "@/features/catalog/useCatalog";
import { matchesDepartment, matchesLevel } from "@/features/catalog/utils/department-filter";
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
  const { user } = useSession();
  const { cbts, getCourse, loading } = useCatalog();
  const [tab, setTab] = useState<"all" | "practice" | "live" | "closed">("all");
  const [departmentMode, setDepartmentMode] = useState<DepartmentFilterMode>(user?.course ? "mine" : "all");
  const [departmentFilterTouched, setDepartmentFilterTouched] = useState(false);
  const tabLabel =
    tab === "all" ? "CBTs" : tab === "practice" ? "practice CBTs" : tab === "live" ? "live exams" : "closed CBTs";
  const list = cbts
    .filter((cbt) => {
      const course = getCourse(cbt.courseSlug);
      if (!matchesLevel(course, user?.level) || !matchesDepartment(course, departmentMode, user?.course)) return false;
      const closed = isCbtClosed(cbt);
      if (tab === "all") return true;
      if (tab === "practice") return cbt.kind === "practice" && !closed;
      if (tab === "live") return cbt.kind === "live" && !closed;
      return closed;
    })
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (a.scheduledFor && b.scheduledFor) {
        return new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime();
      }
      return 0;
    });
  const hasActiveLiveCbt = cbts.some(isAttemptableLiveCbt);
  const resetDepartmentFilter = () => {
    setDepartmentFilterTouched(true);
    setDepartmentMode("all");
  };

  useEffect(() => {
    if (!departmentFilterTouched) setDepartmentMode(user?.course ? "mine" : "all");
  }, [departmentFilterTouched, user?.course]);

  return (
    <StudentShell>
      <PageHeader
        title="CBTs"
        subtitle="Practise at your own pace or join a scheduled live exam."
      />

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <DepartmentFilter
          userDepartment={user?.course}
          mode={departmentMode}
          className="mb-0"
          onModeChange={(mode) => {
            setDepartmentFilterTouched(true);
            setDepartmentMode(mode);
          }}
        />

        <div className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-md border border-border bg-surface p-1 shadow-sm">
          {[
            { key: "all", label: "All" },
            { key: "practice", label: "Practice sets" },
            { key: "live", label: "Live exams", hasLive: hasActiveLiveCbt },
            { key: "closed", label: "Closed" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key as typeof tab)}
              className={cn(
                "relative flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors",
                tab === item.key
                  ? "bg-primary-active text-primary-foreground shadow-sm"
                  : "text-text-secondary hover:text-foreground",
              )}
            >
              <span>{item.label}</span>
              {item.hasLive && (
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-error opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-error" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-text-muted">
          <Loader2 className="size-4 animate-spin" /> Loading CBTs…
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          illustration={<CbtMonitorIllustration />}
          title={
            departmentMode !== "all"
              ? `No ${tabLabel} found for your department at this level`
              : tab === "all"
                ? "No CBTs available"
                : tab === "practice"
                  ? "No practice CBTs available"
                  : tab === "live"
                    ? "No live exams scheduled"
                    : "No closed CBTs"
          }
          description={
            departmentMode !== "all"
              ? "Switch to all courses to explore other departments at this level."
              : tab === "all"
                ? "CBTs will appear here when added."
                : tab === "practice"
                  ? "Practice CBTs will appear here when they are available."
                  : tab === "live"
                    ? "Scheduled live exams will appear here."
                    : "Finished live exams will appear here."
          }
          action={
            departmentMode !== "all" ? (
              <Button variant="outline" onClick={resetDepartmentFilter}>
                View all courses
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((cbt) => {
            const course = getCourse(cbt.courseSlug);
            const closed = isCbtClosed(cbt);
            return (
              <Link
                key={cbt.id}
                to="/cbts/$cbtId"
                params={{ cbtId: cbt.id }}
                className={cn(
                  "group flex flex-col rounded-lg border p-5 shadow-sm transition-all",
                  closed
                    ? "border-border/60 bg-surface/50 opacity-75 hover:border-border-strong hover:bg-surface hover:opacity-100"
                    : "card-hover border-border bg-surface",
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <span
                    className={cn("rounded-sm px-2 py-1 text-xs font-semibold", closed && "grayscale opacity-75")}
                    style={{ backgroundColor: `${course?.color}1a`, color: course?.color }}
                  >
                    {course?.code}
                  </span>
                  <div className="flex gap-1.5">
                    {closed ? (
                      <span className="inline-flex h-6 items-center rounded-full border border-border bg-secondary/80 px-2 text-xs font-medium leading-none text-text-muted">
                        Closed
                      </span>
                    ) : (
                      cbtStatusPill(cbt)
                    )}
                    <PaidPill paid={cbt.paid} owned={prep.ownsCbt(cbt.id)} />
                  </div>
                </div>
                <h3 className={cn("text-lg font-semibold leading-snug", closed && "text-text-secondary")}>{cbt.title}</h3>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
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
                      {closed ? "Exam ended" : formatDateTime(cbt.scheduledFor)}
                    </span>
                  )}
                </div>
                <span className={cn("mt-5 flex items-center gap-1 text-sm font-medium", closed ? "text-text-muted group-hover:text-foreground" : "text-primary")}>
                  {closed ? "View past exam" : "View details"}{" "}
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
