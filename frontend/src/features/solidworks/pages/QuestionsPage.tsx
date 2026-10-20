import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ImageIcon, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState, PageHeader } from "@/components/prep/bits";
import { QuestionsEmptyIllustration } from "@/components/common/EmptyStateIllustration";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/mock-api";
import { QuestionDialog } from "../components/QuestionDialog";
import { useAskQuestion } from "../hooks/mutations";
import { swQueries } from "../hooks/queries";
import { useSwUser } from "../hooks/useSwUser";

export function AnsweredPill({ count }: { count: number }) {
  return count > 0 ? (
    <span className="rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-medium text-success">
      Answered
    </span>
  ) : (
    <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
      Waiting for reply
    </span>
  );
}

export function QuestionsPage() {
  const user = useSwUser();
  const { data: questions } = useSuspenseQuery(swQueries.questions(user.id));
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const ask = useAskQuestion(user.id);
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Ask a question"
        subtitle="Stuck on a task? Ask Mr PrepMaster and tag the task for context."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> New question
          </Button>
        }
      />
      {questions.length === 0 && (
        <EmptyState
          illustration={<QuestionsEmptyIllustration />}
          title="No questions yet"
          description="Stuck on a CAD task or exercise? Ask a question to get guidance from Mr PrepMaster."
          action={<Button onClick={() => setOpen(true)}><Plus className="size-4" /> Ask a question</Button>}
        />
      )}
      <div className="space-y-3">
        {questions.map((q) => {
          const isOptimistic = q.id === "optimistic";
          const cardContent = (
            <>
            <span className="flex items-center justify-between gap-2">
              <span className="text-2xs text-text-muted">{formatDate(q.createdAt)}</span>
              <span className="flex items-center gap-2">
                {q.imageUrls.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-2xs text-text-muted">
                    <ImageIcon className="size-3" /> {q.imageUrls.length} screenshot{q.imageUrls.length === 1 ? "" : "s"}
                  </span>
                )}
                {isOptimistic ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <Loader2 className="size-3 animate-spin" />
                    Posting...
                  </span>
                ) : (
                  <AnsweredPill count={q.responses.length} />
                )}
              </span>
            </span>
            <span className="mt-2 line-clamp-2 block break-words font-medium">{q.title}</span>
            <span className="mt-1 line-clamp-2 block break-words text-sm text-text-secondary">
              {q.body}
            </span>
            {q.taskIds.length > 0 && (
              <span className="mt-3 flex flex-wrap gap-1.5">
                {q.taskIds.map((id) => (
                  <span
                    key={id}
                    className="max-w-full truncate rounded-full border border-border px-2 py-0.5 text-2xs text-text-muted"
                  >
                    {tasks.find((t) => t.id === id)?.title ?? "Task"}
                  </span>
                ))}
              </span>
            )}
            </>
          );

          const cardClasses = "block min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors";

          if (isOptimistic) {
            return (
              <div
                key={q.id}
                className={`${cardClasses} cursor-wait select-none border-dashed border-primary/40 opacity-85`}
                title="Posting question and attachments..."
              >
                {cardContent}
              </div>
            );
          }

          return (
            <Link
              key={q.id}
              to="/solidworks/questions/$id"
              params={{ id: q.id }}
              className={`${cardClasses} hover:border-border-strong`}
            >
              {cardContent}
          </Link>
          );
        })}
      </div>
      <QuestionDialog
        open={open}
        onOpenChange={setOpen}
        busy={ask.isPending}
        onSubmit={(d) => {
          setOpen(false);
          ask.mutate({ ...d, userId: user.id, userName: user.name });
        }}
      />
    </>
  );
}
