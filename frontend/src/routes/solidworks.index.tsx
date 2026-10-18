import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/solidworks/pages/DashboardPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/")({
  head: () => pageHead("Dashboard", "Your SolidWorks progress, grades and next task.", "SolidWorks"),
  component: DashboardPage,
});
