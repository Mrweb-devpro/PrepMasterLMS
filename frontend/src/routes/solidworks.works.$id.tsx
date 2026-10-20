import { createFileRoute, notFound } from "@tanstack/react-router";
import { InAppNotFound } from "@/components/common/InAppNotFound";
import { WorkDetailPage } from "@/features/solidworks/pages/WorkDetailPage";
import { swQueries } from "@/features/solidworks/hooks/queries";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/works/$id")({
  head: () => pageHead("Work details", "Your submitted work and its results.", "SolidWorks"),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(swQueries.submission(params.id));
    } catch {
      throw notFound();
    }
  },
  notFoundComponent: () => (
    <InAppNotFound
      title="Submission not found"
      description="This submission doesn't exist or has been removed."
      backTo="/solidworks/works"
      backLabel="Back to my works"
    />
  ),
  component: function RouteComponent() {
    return <WorkDetailPage id={Route.useParams().id} />;
  },
});
