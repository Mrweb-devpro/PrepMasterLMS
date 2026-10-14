import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { EmptyState, PageHeader } from "@/components/prep/bits";
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
          title="No questions yet"
          description="Your questions and replies will appear here."
        />
      )}
      <div className="space-y-3">
        {questions.map((q) => (
          <Link
            key={q.id}
            to="/solidworks/questions/$id"
            params={{ id: q.id }}
            className="block min-w-0 rounded-lg border border-border bg-surface p-4 shadow-sm transition-colors hover:border-border-strong"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-2xs text-text-muted">{formatDate(q.createdAt)}</span>
              <AnsweredPill count={q.responses.length} />
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
          </Link>
        ))}
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
