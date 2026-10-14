import { createFileRoute } from "@tanstack/react-router";
import { SubmitPage } from "@/features/solidworks/pages/SubmitPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/submit")({
  validateSearch: (s: Record<string, unknown>): { task?: string } =>
    typeof s["task"] === "string" ? { task: s["task"] } : {},
  head: () => pageHead("Submit work", "Submit your SolidWorks files and answers for grading."),
  component: function RouteComponent() {
    const { task } = Route.useSearch();
    return <SubmitPage {...(task ? { initialTask: task } : {})} />;
  },
});
