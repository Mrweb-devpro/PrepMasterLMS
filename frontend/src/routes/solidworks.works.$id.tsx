import { createFileRoute } from "@tanstack/react-router";
import { WorkDetailPage } from "@/features/solidworks/pages/WorkDetailPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/works/$id")({
  head: () => pageHead("Submission", "Your submitted work and its results."),
  component: function RouteComponent() {
    return <WorkDetailPage id={Route.useParams().id} />;
  },
});
