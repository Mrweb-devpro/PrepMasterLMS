import { createFileRoute } from "@tanstack/react-router";
import { TaskDetailPage } from "@/features/solidworks/pages/TaskDetailPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/tasks/$taskId")({
  head: () => pageHead("Task details", "Watch the video, follow the steps and submit your drawing.", "SolidWorks"),
  component: function RouteComponent() {
    return <TaskDetailPage taskId={Route.useParams().taskId} />;
  },
});
