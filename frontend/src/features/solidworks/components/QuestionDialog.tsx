import { useSuspenseQuery } from "@tanstack/react-query";
import { ImageIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  imageUrl?: string | null;
  imageFile?: File;
}

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** Ask or edit a question, optionally tagging tasks and attaching a screenshot. */
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
  const fileInput = useRef<HTMLInputElement>(null);
  const [d, setD] = useState<QuestionDraft>({ title: "", body: "", taskIds: [] });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const draft = initial ?? { title: "", body: "", taskIds: [] };
    setD(draft);
    setPreviewUrl(draft.imageUrl ?? null);
  }, [open, initial]);

  useEffect(() => () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const toggle = (id: string) =>
    setD((p) => ({
      ...p,
      taskIds: p.taskIds.includes(id) ? p.taskIds.filter((x) => x !== id) : [...p.taskIds, id],
    }));

  const selectImage = (file?: File) => {
    if (!file) return;
    if (!IMAGE_TYPES.has(file.type)) {
      toast.error("Attach a PNG, JPG, or WebP image");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("The screenshot must be 5 MB or smaller");
      return;
    }
    setD((current) => {
      const { imageUrl: _imageUrl, ...rest } = current;
      return { ...rest, imageFile: file };
    });
    setPreviewUrl(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setD((current) => {
      const { imageFile: _imageFile, ...rest } = current;
      return { ...rest, imageUrl: null };
    });
    setPreviewUrl(null);
    if (fileInput.current) fileInput.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-sw max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit question" : "Ask a question"}</DialogTitle>
          <DialogDescription>Mr PrepMaster will reply here.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onPaste={(event) => {
            const item = [...event.clipboardData.items].find((entry) => IMAGE_TYPES.has(entry.type));
            if (!item) return;
            event.preventDefault();
            selectImage(item.getAsFile() ?? undefined);
          }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!d.title.trim() || !d.body.trim()) {
              toast.error("Add a title and your question");
              return;
            }
            const imageChanged = d.imageFile || d.imageUrl !== initial?.imageUrl;
            const draft: QuestionDraft = {
              ...d,
              title: d.title.trim(),
              body: d.body.trim(),
            };
            if (!imageChanged) delete draft.imageUrl;
            onSubmit(draft);
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
          <Field label="Screenshot (optional)">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => selectImage(event.target.files?.[0])}
            />
            {previewUrl ? (
              <div className="group relative size-24 overflow-hidden rounded-md border border-border bg-surface-subtle">
                <img src={previewUrl} alt="Screenshot preview" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-1 top-1 inline-flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  aria-label="Remove screenshot"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <ImageIcon className="size-4" /> Attach screenshot
              </Button>
            )}
            <p className="mt-1.5 text-2xs text-text-muted">PNG, JPG, or WebP up to 5 MB. You can also paste an image.</p>
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
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
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
