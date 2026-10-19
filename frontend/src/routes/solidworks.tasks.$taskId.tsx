import { createFileRoute, notFound } from "@tanstack/react-router";
import { InAppNotFound } from "@/components/common/InAppNotFound";
import { TaskDetailPage } from "@/features/solidworks/pages/TaskDetailPage";
import { swQueries } from "@/features/solidworks/hooks/queries";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/tasks/$taskId")({
  head: () => pageHead("Task details", "Watch the video, follow the steps and submit your drawing.", "SolidWorks"),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(swQueries.task(params.taskId));
    } catch {
      throw notFound();
    }
  },
  notFoundComponent: () => (
    <InAppNotFound
      title="Task not found"
      description="This task doesn't exist or has been removed."
      backTo="/solidworks/tasks"
      backLabel="Back to tasks"
    />
  ),
  component: function RouteComponent() {
    return <TaskDetailPage taskId={Route.useParams().taskId} />;
  },
});
