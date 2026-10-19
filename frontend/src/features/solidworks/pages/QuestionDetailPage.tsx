import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCircleQuestion, Pencil, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Breadcrumbs, Card } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/mock-api";
import { QuestionDialog } from "../components/QuestionDialog";
import { QuestionImageAttachment, QuestionImageLightbox } from "../components/QuestionImageAttachment";
import { useEditQuestion } from "../hooks/mutations";
import { swQueries } from "../hooks/queries";
import { useSwUser } from "../hooks/useSwUser";
import { AnsweredPill } from "./QuestionsPage";

export function QuestionDetailPage({ id }: { id: string }) {
  const user = useSwUser();
  const { data: q } = useSuspenseQuery(swQueries.question(id));
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const edit = useEditQuestion(user.id);
  const [open, setOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  return (
    <div className="max-w-3xl">
      <Breadcrumbs
        items={[{ label: "Questions", to: "/solidworks/questions" }, { label: q.title }]}
      />

      <Card className="mb-4 border-primary/30">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
            <MessageCircleQuestion className="size-4 shrink-0 text-primary" /> Your question
          </p>
          <Button size="sm" variant="secondary" onClick={() => setOpen(true)} className="shrink-0">
            <Pencil className="size-3.5" /> Edit
          </Button>
        </div>
        <div className="rounded-md border-l-4 border-primary bg-primary-soft p-3 sm:p-4">
          <h1 className="break-words font-display text-lg font-semibold sm:text-xl">{q.title}</h1>
          <p className="mt-2 whitespace-pre-line break-words text-sm text-text-secondary sm:text-base">
            {q.body}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span>
            Asked {formatDate(q.createdAt)}
            {q.updatedAt !== q.createdAt && <> · edited {formatDate(q.updatedAt)}</>}
          </span>
          <AnsweredPill count={q.responses.length} />
        </div>
        {q.taskIds.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {q.taskIds.map((tid) => (
              <span
                key={tid}
                className="max-w-full truncate rounded-full border border-border px-2.5 py-0.5 text-xs"
              >
                {tasks.find((t) => t.id === tid)?.title ?? "Task"}
              </span>
            ))}
          </div>
        )}
        {q.imageUrl && <QuestionImageAttachment imageUrl={q.imageUrl} onZoom={setZoomedImage} />}
      </Card>

      <Card>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck className="size-4 text-primary" /> Responses from admin
        </p>
        {q.responses.length === 0 ? (
          <p className="text-sm text-text-muted">
            No reply yet. You'll see it here as soon as Mr PrepMaster answers.
          </p>
        ) : (
          <div className="space-y-3">
            {q.responses.map((r) => (
              <div key={r.id} className="rounded-md bg-surface-subtle p-3">
                <p className="whitespace-pre-line break-words text-sm">{r.body}</p>
                <p className="mt-1.5 text-2xs text-text-muted">{formatDate(r.at)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <QuestionDialog
        open={open}
        onOpenChange={setOpen}
        initial={{
          title: q.title,
          body: q.body,
          taskIds: q.taskIds,
          ...(q.imageUrl !== undefined ? { imageUrl: q.imageUrl } : {}),
        }}
        busy={edit.isPending}
        onSubmit={(data) => {
          setOpen(false);
          edit.mutate({ id: q.id, data });
        }}
      />
      <QuestionImageLightbox imageUrl={zoomedImage} onOpenChange={() => setZoomedImage(null)} />
    </div>
  );
}
