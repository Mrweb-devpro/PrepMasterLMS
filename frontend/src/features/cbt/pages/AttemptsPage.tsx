import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/features/catalog/useCatalog";
import { usePrep } from "@/lib/prep-store";

export function AttemptsPage() {
  const { attempts } = usePrep();
  const { getCbt, getCourse } = useCatalog();
  return (
    <>
      <PageHeader title="My attempts" subtitle="Every CBT you've submitted is saved here." />
      {attempts.length === 0 ? (
        <div className="space-y-4">
          <EmptyState title="No attempts yet" />
          <div className="text-center">
            <Button asChild>
              <Link to="/cbts">Browse CBTs</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          {attempts.map((a) => {
            const cbt = getCbt(a.cbtId);
            const course = cbt ? getCourse(cbt.courseSlug) : undefined;
            const hidden = cbt?.revealResults === false;
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
                  {hidden ? (
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
