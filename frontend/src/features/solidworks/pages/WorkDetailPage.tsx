import { useSuspenseQuery } from "@tanstack/react-query";
import { Breadcrumbs, PageHeader } from "@/components/prep/bits";
import { formatDate } from "@/lib/mock-api";
import { GradeBadge } from "../components/bits";
import { ResultsPanel, SubmissionAnswers } from "../components/SubmissionView";
import { swQueries } from "../hooks/queries";

export function WorkDetailPage({ id }: { id: string }) {
  const { data: sub } = useSuspenseQuery(swQueries.submission(id));
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const task = tasks.find((t) => t.id === sub.taskId);

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "My works", to: "/solidworks/works" },
          { label: task?.title ?? "Submission" },
        ]}
      />
      <PageHeader
        title={task?.title ?? "Submission"}
        subtitle={`Submitted ${formatDate(sub.submittedAt)} · read-only`}
        action={<GradeBadge sub={sub} />}
      />
      <ResultsPanel {...(sub.grade ? { grade: sub.grade } : {})} />
      <div className="mt-6">
        <SubmissionAnswers sub={sub} />
      </div>
    </div>
  );
}
