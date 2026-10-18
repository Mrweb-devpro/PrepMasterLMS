import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/features/solidworks/pages/TasksPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/tasks/")({
  head: () => pageHead("Tasks", "Every drawing task from the MrPrepMaster channel.", "SolidWorks"),
  component: TasksPage,
});
