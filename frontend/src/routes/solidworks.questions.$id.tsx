import { createFileRoute } from "@tanstack/react-router";
import { QuestionDetailPage } from "@/features/solidworks/pages/QuestionDetailPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/questions/$id")({
  head: () => pageHead("Question", "Your question and responses from the instructor."),
  component: function RouteComponent() {
    return <QuestionDetailPage id={Route.useParams().id} />;
  },
});
