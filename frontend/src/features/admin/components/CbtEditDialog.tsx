import { Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Cbt, Question } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const letters = ["A", "B", "C", "D", "E", "F"];

/** Edit an existing CBT's details and questions. Works for live and practice CBTs. */
export function CbtEditDialog({
  cbt,
  open,
  onOpenChange,
  onSave,
}: {
  cbt: Cbt;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (patch: Partial<Cbt>) => Promise<void>;
}) {
  const [tab, setTab] = useState<"details" | "questions">("details");
  const [d, setD] = useState(cbt);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setD({ ...cbt, questions: cbt.questions.map((q) => ({ ...q, options: [...q.options] })) });
      setTab("details");
    }
  }, [open, cbt]);

  const setQ = (i: number, p: Partial<Question>) =>
    setD((x) => ({ ...x, questions: x.questions.map((q, j) => (j === i ? { ...q, ...p } : q)) }));

  const save = async (): Promise<void> => {
    if (d.title.trim().length < 3) { toast.error("Give the CBT a title"); return; }
    if (!d.minutes || d.minutes < 1) { toast.error("Duration must be at least 1 minute"); return; }
    if (d.kind === "live" && (!d.scheduledFor || !d.closesAt)) {
      toast.error("Live CBTs need opening and closing times");
      return;
    }
    if (d.kind === "live" && new Date(d.closesAt!).getTime() <= new Date(d.scheduledFor!).getTime()) {
      toast.error("Closing time must be after the opening time");
      return;
    }
    if (d.paid && !(d.price && d.price > 0)) { toast.error("Enter a price"); return; }
    if (d.questions.length === 0) { toast.error("Add at least one question"); return; }
    const bad = d.questions.findIndex((q) => !q.text.trim() || q.options.some((o) => !o.trim()));
    if (bad >= 0) {
      setTab("questions");
      toast.error(`Question ${bad + 1} is incomplete`);
      return;
    }
    setSaving(true);
    try {
      await onSave({
        title: d.title.trim(),
        minutes: d.minutes,
        paid: d.paid,
        price: d.paid ? (d.price ?? 0) : 0,
        retakePolicy: d.retakePolicy,
        ...(d.scheduledFor ? { scheduledFor: d.scheduledFor } : {}),
        ...(d.closesAt ? { closesAt: d.closesAt } : {}),
        questions: d.questions,
      });
      toast.success("CBT updated");
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't save", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Edit CBT</DialogTitle>
          <DialogDescription>
            Changes apply right away. Students already in the exam keep their saved answers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5">
          {(["details", "questions"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "h-8 rounded-full border px-3 text-xs capitalize",
                tab === t
                  ? "border-primary bg-primary-soft font-medium text-primary"
                  : "border-border bg-surface",
              )}
            >
              {t === "questions" ? `Questions (${d.questions.length})` : "Details"}
            </button>
          ))}
        </div>

        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {tab === "details" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Title</Label>
                <Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={d.minutes}
                  onChange={(e) => setD({ ...d, minutes: Number(e.target.value) })}
                />
              </div>
              {d.kind === "live" ? (
                <>
                  <div className="space-y-1.5">
                    <Label>Starts at</Label>
                    <Input
                      type="datetime-local"
                      value={d.scheduledFor ? d.scheduledFor.slice(0, 16) : ""}
                      onChange={(e) => setD({ ...d, scheduledFor: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Closes at</Label>
                    <Input
                      type="datetime-local"
                      value={d.closesAt ? d.closesAt.slice(0, 16) : ""}
                      onChange={(e) => setD({ ...d, closesAt: e.target.value })}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <Label>Retakes</Label>
                  <Input
                    value={d.retakePolicy}
                    onChange={(e) => setD({ ...d, retakePolicy: e.target.value })}
                    placeholder="e.g. 3 attempts or Unlimited retakes"
                  />
                </div>
              )}
              <label className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm sm:col-span-2">
                Paid CBT
                <Switch checked={d.paid} onCheckedChange={(v) => setD({ ...d, paid: v })} />
              </label>
              {d.paid && (
                <div className="space-y-1.5">
                  <Label>Price (₦)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={d.price ?? 0}
                    onChange={(e) => setD({ ...d, price: Number(e.target.value) })}
                  />
                </div>
              )}
            </div>
          ) : (
            <ol className="space-y-4">
              {d.questions.map((q, i) => (
                <li key={q.id} className="rounded-lg border border-border p-3 sm:p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Question {i + 1}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8"
                      aria-label="Delete question"
                      onClick={() =>
                        setD((x) => ({ ...x, questions: x.questions.filter((_, j) => j !== i) }))
                      }
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    value={q.text}
                    onChange={(e) => setQ(i, { text: e.target.value })}
                    placeholder="Question text"
                  />
                  <div className="mt-3 space-y-2">
                    {q.options.map((o, oi) => (
                      <div key={oi} className="flex min-w-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQ(i, { answerIndex: oi })}
                          aria-label={`Mark ${letters[oi]} correct`}
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                            q.answerIndex === oi
                              ? "border-success bg-success-bg text-success"
                              : "border-border text-text-muted",
                          )}
                        >
                          {letters[oi]}
                        </button>
                        <Input
                          className="min-w-0"
                          value={o}
                          onChange={(e) =>
                            setQ(i, {
                              options: q.options.map((x, k) => (k === oi ? e.target.value : x)),
                            })
                          }
                          placeholder={`Option ${letters[oi]}`}
                        />
                      </div>
                    ))}
                  </div>
                  <Input
                    className="mt-3"
                    value={q.topic ?? ""}
                    onChange={(e) => setQ(i, { topic: e.target.value })}
                    placeholder="Topic (optional)"
                  />
                  <p className="mt-2 text-2xs text-text-muted">Tap a letter to mark the correct answer.</p>
                </li>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  setD((x) => ({
                    ...x,
                    questions: [
                      ...x.questions,
                      {
                        id: `nq-${Math.random().toString(36).slice(2, 8)}`,
                        courseSlug: x.courseSlug,
                        text: "",
                        options: ["", "", "", ""],
                        answerIndex: 0,
                      },
                    ],
                  }))
                }
              >
                <Plus /> Add question
              </Button>
            </ol>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
