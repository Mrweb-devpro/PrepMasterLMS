import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "@/components/prep/StudentShell";
import { AttemptDetailPage } from "@/features/cbt/pages/AttemptDetailPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/attempts/$attemptId")({
  head: () => pageHead("Attempt review", "Review the answers from one of your CBT attempts."),
  component: function RouteComponent() {
    const { attemptId } = Route.useParams();
    return (
      <StudentShell>
        <AttemptDetailPage attemptId={attemptId} />
      </StudentShell>
    );
  },
});
