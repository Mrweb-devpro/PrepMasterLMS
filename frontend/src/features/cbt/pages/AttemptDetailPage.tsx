import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/features/catalog/useCatalog";
import { LIVE } from "@/lib/api/config";
import type { Question } from "@/lib/mock-data";
import { usePrep } from "@/lib/prep-store";
import { AnswerReview } from "../components/AnswerReview";
import { cbtApi, toReview } from "../services/cbt.api";

interface View {
  cbtTitle: string;
  courseCode: string;
  submittedAt: string;
  hidden: boolean;
  autoSubmitted: boolean;
  correct: number;
  total: number;
  questions: Question[];
  answers: Record<string, number>;
}

export function AttemptDetailPage({ attemptId }: { attemptId: string }) {
  const { attempts } = usePrep();
  const { getCbt, getCourse } = useCatalog();
  const result = useQuery({
    queryKey: ["attempt-result", attemptId],
    queryFn: () => cbtApi.result(attemptId),
    enabled: LIVE,
    retry: false,
  });

  let view: View | null = null;
  if (LIVE && result.data) {
    const r = result.data;
    const cbt = getCbt(r.cbtId);
    view = {
      cbtTitle: cbt?.title ?? "CBT",
      courseCode: cbt ? (getCourse(cbt.courseSlug)?.code ?? "") : "",
      submittedAt: r.submittedAt ?? r.startedAt,
      hidden: !r.revealed,
      autoSubmitted: r.autoSubmitted,
      correct: r.score ?? 0,
      total: r.total ?? 0,
      ...toReview(r),
    };
  } else if (!LIVE) {
    const a = attempts.find((x) => x.id === attemptId);
    const cbt = a ? getCbt(a.cbtId) : undefined;
    if (a && cbt)
      view = {
        cbtTitle: cbt.title,
        courseCode: getCourse(cbt.courseSlug)?.code ?? "",
        submittedAt: a.submittedAt,
        hidden: cbt.revealResults === false,
        autoSubmitted: false,
        correct: a.correct,
        total: a.total,
        questions: cbt.questions,
        answers: a.answers,
      };
  }

  if (LIVE && result.isPending) return <p className="text-sm text-text-muted">Loading result…</p>;
  if (!view)
    return (
      <div className="space-y-4 text-center">
        <EmptyState title={result.error?.message ?? "Attempt not found"} />
        <Button asChild variant="outline">
          <Link to="/attempts">Back to my attempts</Link>
        </Button>
      </div>
    );

  return (
    <>
      <PageHeader
        title={view.cbtTitle}
        subtitle={`${view.courseCode} · Submitted ${new Date(view.submittedAt).toLocaleString()}${view.autoSubmitted ? " (auto-submitted at the deadline)" : ""}`}
      />
      {view.hidden ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
          <Lock className="mx-auto size-6 text-text-muted" />
          <p className="mt-2 font-medium">Review isn't available for this CBT yet</p>
          <p className="text-sm text-text-secondary">Your instructor will release results soon.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-baseline gap-3 rounded-lg border border-border bg-surface p-5 shadow-sm">
            <p className="font-display text-4xl font-semibold">
              {Math.round((view.correct / (view.total || 1)) * 100)}%
            </p>
            <p className="text-sm text-text-secondary">
              {view.correct} of {view.total} correct
            </p>
          </div>
          <AnswerReview questions={view.questions} answers={view.answers} />
        </>
      )}
    </>
  );
}
