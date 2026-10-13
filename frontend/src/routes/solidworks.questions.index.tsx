import { createFileRoute } from "@tanstack/react-router";
import { QuestionsPage } from "@/features/solidworks/pages/QuestionsPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/questions/")({
  head: () => pageHead("Ask a question", "Ask MrPrepMaster about any SolidWorks task."),
  component: QuestionsPage,
});
