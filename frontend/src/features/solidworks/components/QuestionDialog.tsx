import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/features/admin/components/parts";
import { cn } from "@/lib/utils";
import { swQueries } from "../hooks/queries";

export interface QuestionDraft {
  title: string;
  body: string;
  taskIds: string[];
}

/** Ask or edit a question, optionally tagging tasks as references. */
export function QuestionDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  busy,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: QuestionDraft;
  onSubmit: (d: QuestionDraft) => void;
  busy?: boolean;
}) {
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const [d, setD] = useState<QuestionDraft>({ title: "", body: "", taskIds: [] });
  useEffect(() => {
    if (open) setD(initial ?? { title: "", body: "", taskIds: [] });
  }, [open, initial]);

  const toggle = (id: string) =>
    setD((p) => ({
      ...p,
      taskIds: p.taskIds.includes(id) ? p.taskIds.filter((x) => x !== id) : [...p.taskIds, id],
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-sw max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit question" : "Ask a question"}</DialogTitle>
          <DialogDescription>Mr PrepMaster will reply here.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!d.title.trim() || !d.body.trim()) {
              toast.error("Add a title and your question");
              return;
            }
            onSubmit({ ...d, title: d.title.trim(), body: d.body.trim() });
          }}
        >
          <Field label="Title">
            <Input
              value={d.title}
              onChange={(e) => setD({ ...d, title: e.target.value })}
              placeholder="e.g. Why is my mass different?"
            />
          </Field>
          <Field label="Your question">
            <Textarea
              rows={5}
              value={d.body}
              onChange={(e) => setD({ ...d, body: e.target.value })}
              placeholder="Explain what you tried…"
            />
          </Field>
          <Field label="Related tasks (optional)">
            <div className="flex flex-wrap gap-1.5">
              {tasks.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-xs transition-colors",
                    d.taskIds.includes(t.id)
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  {t.title}
                </button>
              ))}
            </div>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {initial ? "Save changes" : "Send question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
