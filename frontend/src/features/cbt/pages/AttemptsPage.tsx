import { Link } from "@tanstack/react-router";
import { ChevronRight, Loader2 } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/prep/bits";
import { CbtEmptyIllustration } from "@/components/common/EmptyStateIllustration";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/features/catalog/useCatalog";
import { usePrep } from "@/lib/prep-store";

export function AttemptsPage() {
  const { attempts, attemptsLoading } = usePrep();
  const { getCbt, getCourse } = useCatalog();
  return (
    <>
      <PageHeader title="My attempts" subtitle="Every CBT you've submitted is saved here." />
      {attemptsLoading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-text-muted">
          <Loader2 className="size-4 animate-spin" /> Loading attempts…
        </div>
      ) : attempts.length === 0 ? (
        <EmptyState
          illustration={<CbtEmptyIllustration />}
          title="No attempts yet"
          description="Every CBT you submit or practice will be tracked, timed, and graded here."
          action={<Button asChild><Link to="/cbts">Browse CBTs</Link></Button>}
        />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          {attempts.map((a) => {
            const cbt = getCbt(a.cbtId);
            const course = cbt ? getCourse(cbt.courseSlug) : undefined;
            const hidden = a.correct === null || cbt?.revealResults === false;
            return (
              <Link
                key={a.id}
                to="/attempts/$attemptId"
                params={{ attemptId: a.id }}
                className="flex items-center gap-4 p-4 transition-colors hover:bg-surface-hover"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-2xs text-text-muted">{course?.code}</p>
                  <p className="truncate font-medium">{cbt?.title ?? "CBT"}</p>
                  <p className="text-xs text-text-muted">
                    {new Date(a.submittedAt).toLocaleString()}
                  </p>
                </div>
                <p className="font-display text-lg font-semibold tabular-nums">
                  {hidden || a.correct === null ? (
                    <span className="text-sm font-normal text-text-muted">Pending</span>
                  ) : (
                    `${Math.round((a.correct / a.total) * 100)}%`
                  )}
                </p>
                <ChevronRight className="size-4 text-text-muted" />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
