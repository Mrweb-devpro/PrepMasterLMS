import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarDays, ListChecks, Upload } from "lucide-react";
import { Breadcrumbs, Card } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/mock-api";
import { SubmittedTag, TaskThumb } from "../components/bits";
import { swQueries } from "../hooks/queries";
import { useSwUser } from "../hooks/useSwUser";
import { youtubeEmbed, youtubeId } from "../utils/youtube";

export function TaskDetailPage({ taskId }: { taskId: string }) {
  const user = useSwUser();
  const { data: task } = useSuspenseQuery(swQueries.task(taskId));
  const { data: subs } = useSuspenseQuery(swQueries.submissions(user.id));
  const mine = subs.find((s) => s.taskId === task.id);
  const vid = youtubeId(task.videoUrl);

  return (
    <div className="mx-auto max-w-4xl">
      <Breadcrumbs items={[{ label: "Tasks", to: "/solidworks/tasks" }, { label: task.title }]} />
      {mine && (
        <div className="mb-3">
          <SubmittedTag />
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-border shadow-sm">
        {vid ? (
          <iframe
            title={task.title}
            src={youtubeEmbed(vid)}
            className="aspect-video w-full"
            allowFullScreen
            allow="accelerometer; encrypted-media; picture-in-picture"
          />
        ) : (
          <TaskThumb task={task} />
        )}
      </div>

      <p className="mt-6 font-display text-sm font-semibold text-primary">Task #{task.number}</p>
      <h1 className="mt-1 text-2xl font-semibold md:text-3xl">{task.title}</h1>
      <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
        <CalendarDays className="size-3.5" /> Posted {formatDate(task.createdAt)} ·{" "}
        {task.steps.length} steps
      </p>
      <p className="mt-4 text-text-secondary">{task.description}</p>

      <Card className="mt-6">
        <p className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <ListChecks className="size-4 text-primary" /> What to do
        </p>
        <ol className="space-y-3">
          {task.steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xs font-semibold text-primary">
                {i + 1}
              </span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-md bg-surface-subtle px-3 py-2 text-xs text-text-secondary">
          When you submit you'll be asked for the part's mass and volume, plus your model files.
        </p>
      </Card>

      <div className="mt-6 flex justify-end">
        {mine ? (
          <Button asChild variant="outline">
            <Link to="/solidworks/works/$id" params={{ id: mine.id }}>
              View my submission
            </Link>
          </Button>
        ) : (
          <Button asChild size="lg">
            <Link to="/solidworks/submit" search={{ task: task.id }}>
              <Upload className="size-4" /> Submit for this task
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
