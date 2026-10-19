import { createFileRoute, notFound } from "@tanstack/react-router";
import { InAppNotFound } from "@/components/common/InAppNotFound";
import { QuestionDetailPage } from "@/features/solidworks/pages/QuestionDetailPage";
import { swQueries } from "@/features/solidworks/hooks/queries";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/questions/$id")({
  head: () => pageHead("Question", "Your question and responses from the instructor.", "SolidWorks"),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(swQueries.question(params.id));
    } catch {
      throw notFound();
    }
  },
  notFoundComponent: () => (
    <InAppNotFound
      title="Question not found"
      description="This question doesn't exist or has been removed."
      backTo="/solidworks/questions"
      backLabel="Back to questions"
    />
  ),
  component: function RouteComponent() {
    return <QuestionDetailPage id={Route.useParams().id} />;
  },
});
