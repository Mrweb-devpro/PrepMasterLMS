import { CheckCircle2, Clock, ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { SwSubmission, SwTask } from "../types";
import { taskThumb } from "../utils/youtube";

export function PageLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TaskThumb({
  task,
  className,
}: {
  task: Pick<SwTask, "thumbnailUrl" | "videoUrl" | "title">;
  className?: string;
}) {
  const src = taskThumb(task);
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-surface-subtle", className)}>
      {src ? (
        <img
          src={src}
          alt={task.title}
          loading="lazy"
          width={1280}
          height={720}
          className="size-full object-cover"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-text-muted">
          <ImageOff className="size-6" />
        </span>
      )}
    </div>
  );
}

export function GradeBadge({ sub }: { sub: Pick<SwSubmission, "grade"> }) {
  if (!sub.grade)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
        <Clock className="size-3" /> Awaiting grade
      </span>
    );
  const good = sub.grade.verdict === "good";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        good ? "bg-success-bg text-success" : "bg-warning-bg text-warning",
      )}
    >
      <CheckCircle2 className="size-3" /> {sub.grade.total}/100 ·{" "}
      {good ? "Good attempt" : "Needs work"}
    </span>
  );
}

export function SubmittedTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-medium text-success">
      <CheckCircle2 className="size-3" /> Already submitted
    </span>
  );
}

/** "#12" badge shown on the top-left of task cards. */
export function TaskNumber({ n }: { n: number }) {
  return (
    <span className="rounded-md bg-foreground/85 px-2 py-0.5 font-display text-xs font-semibold tabular-nums text-background shadow-sm backdrop-blur">
      #{n}
    </span>
  );
}
