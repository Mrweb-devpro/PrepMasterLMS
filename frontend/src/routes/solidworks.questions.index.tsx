import { createFileRoute } from "@tanstack/react-router";
import { QuestionsPage } from "@/features/solidworks/pages/QuestionsPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/questions/")({
  head: () => pageHead("Questions", "Ask MrPrepMaster about any SolidWorks task.", "SolidWorks"),
  component: QuestionsPage,
});
