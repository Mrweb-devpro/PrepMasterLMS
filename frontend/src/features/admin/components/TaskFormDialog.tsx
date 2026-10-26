import { ImagePlus } from "lucide-react";
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
import { TaskThumb } from "@/features/solidworks/components/bits";
import type { NewTask, SwTask } from "@/features/solidworks/types";
import { Field } from "./parts";

const empty = {
  title: "",
  summary: "",
  description: "",
  steps: "",
  videoUrl: "",
  thumbnailUrl: "",
  targetMass: "",
  targetVolume: "",
  tolerancePercent: "0.5",
};

export function TaskFormDialog({
  open,
  onOpenChange,
  task,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: SwTask | null;
  onSave: (t: NewTask) => void;
}) {
  const [f, setF] = useState(empty);
  useEffect(() => {
    if (open)
      setF(
        task
          ? {
              ...task,
              steps: task.steps.join("\n"),
              videoUrl: task.videoUrl ?? "",
              thumbnailUrl: task.thumbnailUrl ?? "",
              targetMass: task.targetMass?.toString() ?? "",
              targetVolume: task.targetVolume?.toString() ?? "",
              tolerancePercent: (task.tolerancePercent ?? 0.5).toString(),
            }
          : empty,
      );
  }, [open, task]);

  const upload = (file?: File) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setF((p) => ({ ...p, thumbnailUrl: String(r.result) }));
    r.readAsDataURL(file);
  };

  const save = () => {
    const steps = f.steps
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!f.title.trim() || !f.summary.trim()) {
      toast.error("Add a title and short description");
      return;
    }
    if (steps.length === 0) {
      toast.error("Add at least one step");
      return;
    }
    onSave({
      title: f.title.trim(),
      summary: f.summary.trim(),
      description: f.description.trim(),
      steps,
      ...(f.videoUrl.trim() ? { videoUrl: f.videoUrl.trim() } : {}),
      ...(f.thumbnailUrl ? { thumbnailUrl: f.thumbnailUrl } : {}),
      ...(f.targetMass.trim() ? { targetMass: Number(f.targetMass) } : {}),
      ...(f.targetVolume.trim() ? { targetVolume: Number(f.targetVolume) } : {}),
      tolerancePercent: Number(f.tolerancePercent) || 0.5,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          <DialogDescription>
            Upload a thumbnail, or paste the YouTube link and its preview is used.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
          <div className="space-y-4">
            <Field label="Title">
              <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            </Field>
            <Field label="Short description" hint="Shown on the task card">
              <Input value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />
            </Field>
            <Field label="YouTube video link">
              <Input
                value={f.videoUrl}
                onChange={(e) => setF({ ...f, videoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=…"
              />
            </Field>
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium">Thumbnail</span>
            <TaskThumb
              task={{
                title: f.title,
                ...(f.thumbnailUrl ? { thumbnailUrl: f.thumbnailUrl } : {}),
                ...(f.videoUrl ? { videoUrl: f.videoUrl } : {}),
              }}
              className="rounded-md border border-border"
            />
            <label className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-border text-sm hover:bg-surface-hover">
              <ImagePlus className="size-4" /> Upload image
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            {f.thumbnailUrl && (
              <button
                type="button"
                className="w-full text-xs text-text-muted hover:text-foreground"
                onClick={() => setF({ ...f, thumbnailUrl: "" })}
              >
                Remove image
              </button>
            )}
          </div>
        </div>
        <Field label="Full description">
          <Textarea
            rows={3}
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
        </Field>
        <Field label="Steps" hint="One step per line">
          <Textarea
            rows={6}
            value={f.steps}
            onChange={(e) => setF({ ...f, steps: e.target.value })}
          />
        </Field>
        <div className="rounded-lg border border-border bg-surface-subtle/50 p-4">
          <p className="text-sm font-semibold">Auto-grading targets <span className="font-normal text-text-muted">(optional)</span></p>
          <p className="mt-1 text-xs text-text-muted">Students within the tolerance automatically receive full marks for mass and volume.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Target mass (g)">
              <Input type="number" min="0" step="any" value={f.targetMass} onChange={(e) => setF({ ...f, targetMass: e.target.value })} />
            </Field>
            <Field label="Target volume (cm³)">
              <Input type="number" min="0" step="any" value={f.targetVolume} onChange={(e) => setF({ ...f, targetVolume: e.target.value })} />
            </Field>
            <Field label="Tolerance (± %)">
              <Input type="number" min="0.01" step="0.1" value={f.tolerancePercent} onChange={(e) => setF({ ...f, tolerancePercent: e.target.value })} />
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save}>{task ? "Save changes" : "Create task"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
