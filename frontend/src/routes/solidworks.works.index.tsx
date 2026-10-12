import { createFileRoute } from "@tanstack/react-router";
import { WorksPage } from "@/features/solidworks/pages/WorksPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/works/")({
  head: () => pageHead("My works", "Your SolidWorks submissions and results."),
  component: WorksPage,
});
