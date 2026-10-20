import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronDown, Reply, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRespondToQuestion } from "@/features/solidworks/hooks/mutations";
import { swQueries } from "@/features/solidworks/hooks/queries";
import { QuestionImageAttachment, QuestionImageLightbox } from "@/features/solidworks/components/QuestionImageAttachment";
import { AnsweredPill } from "@/features/solidworks/pages/QuestionsPage";
import { formatDate } from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import { Panel } from "../../components/parts";

const FILTERS = [
  { v: "open", label: "Waiting" },
  { v: "answered", label: "Answered" },
  { v: "all", label: "All" },
] as const;

export function SwQuestionsPage() {
  const { data: questions } = useSuspenseQuery(swQueries.questions());
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const respond = useRespondToQuestion();
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number]["v"]>("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const active = questions.find((x) => x.id === openId);
  const list = questions.filter(
    (x) =>
      (f === "all" || (f === "answered" ? x.responses.length > 0 : x.responses.length === 0)) &&
      `${x.title} ${x.body} ${x.userName}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((x) => (
            <button
              key={x.v}
              onClick={() => setF(x.v)}
              className={cn(
                "h-8 rounded-full border px-3 text-xs",
                f === x.v
                  ? "border-primary bg-primary-soft font-medium text-primary"
                  : "border-border bg-surface",
              )}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>
      <Panel>
        {list.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-text-muted">No questions here.</p>
        )}
        {list.map((x) => {
          const expanded = expandedId === x.id;
          const answered = x.responses.length > 0;
          return (
            <div key={x.id} className="border-b border-border last:border-b-0">
              <button
                onClick={() => setExpandedId(expanded ? null : x.id)}
                aria-expanded={expanded}
                className="flex w-full min-w-0 items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-subtle sm:px-5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{x.title}</span>
                  <span className="block truncate text-2xs text-text-muted">
                    {x.userName} · {formatDate(x.createdAt)}
                  </span>
                </span>
                <span className="hidden shrink-0 sm:block">
                  <AnsweredPill count={x.responses.length} />
                </span>
                <span
                  className={cn(
                    "size-2.5 shrink-0 rounded-full sm:hidden",
                    answered ? "bg-success" : "bg-warning",
                  )}
                  aria-label={answered ? "Answered" : "Waiting for reply"}
                />
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-text-muted transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>
              {expanded && (
                <div className="space-y-3 bg-surface-subtle/50 px-4 pb-4 pt-1 sm:px-5">
                  <p className="break-words font-display text-base font-semibold">{x.title}</p>
                  <p className="whitespace-pre-line break-words text-sm text-text-secondary">
                    {x.body}
                  </p>
                  {x.taskIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {x.taskIds.map((id) => (
                        <span
                          key={id}
                          className="max-w-full truncate rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs"
                        >
                          {tasks.find((t) => t.id === id)?.title ?? "Task"}
                        </span>
                      ))}
                    </div>
                  )}
                  {x.imageUrls.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-text-muted">Attached screenshots</p>
                      <div className="flex flex-wrap gap-3">
                        {x.imageUrls.map((imageUrl) => (
                          <QuestionImageAttachment key={imageUrl} imageUrl={imageUrl} onZoom={setZoomedImage} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs text-text-muted">
                      {answered
                        ? `${x.responses.length} repl${x.responses.length === 1 ? "y" : "ies"}`
                        : "Waiting for reply"}
                    </span>
                    <Button size="sm" className="w-full sm:w-auto" onClick={() => setOpenId(x.id)}>
                      <Reply className="size-4" /> Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Panel>

      <Dialog open={!!active} onOpenChange={(o) => !o && (setOpenId(null), setReply(""))}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="break-words">{active.title}</DialogTitle>
                <DialogDescription>
                  {active.userName} · {formatDate(active.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <p className="whitespace-pre-line text-sm">{active.body}</p>
              {active.taskIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {active.taskIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs"
                    >
                      {tasks.find((t) => t.id === id)?.title ?? "Task"}
                    </span>
                  ))}
                </div>
              )}
              {active.imageUrls.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-medium text-text-muted">Attached screenshots</p>
                  <div className="flex flex-wrap gap-3">
                    {active.imageUrls.map((imageUrl) => (
                      <QuestionImageAttachment key={imageUrl} imageUrl={imageUrl} onZoom={setZoomedImage} />
                    ))}
                  </div>
                </div>
              )}
              {active.responses.map((r) => (
                <div key={r.id} className="rounded-md bg-primary-soft p-3 text-sm">
                  {r.body}
                  <p className="mt-1 text-2xs text-text-muted">{formatDate(r.at)}</p>
                </div>
              ))}
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!reply.trim()) {
                    toast.error("Write a reply first");
                    return;
                  }
                  respond.mutate({ id: active.id, body: reply.trim() });
                  setReply("");
                }}
              >
                <Textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write your response…"
                />
                <Button type="submit" className="w-full" disabled={respond.isPending}>
                  Send response
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
      <QuestionImageLightbox imageUrl={zoomedImage} onOpenChange={() => setZoomedImage(null)} />
    </>
  );
}
