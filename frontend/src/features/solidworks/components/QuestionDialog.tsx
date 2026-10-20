import { useSuspenseQuery } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  imageUrls?: string[];
  imageKeys?: string[];
  imageFiles?: File[];
}

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 2;

/** Ask or edit a question, optionally tagging tasks and attaching up to two screenshots. */
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
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [existingKeys, setExistingKeys] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) return;
    const draft = initial ?? { title: "", body: "", taskIds: [] };
    setD(draft);
    setExistingUrls(draft.imageUrls ?? []);
    setExistingKeys(draft.imageKeys ?? draft.imageUrls ?? []);
    setNewFiles([]);
  }, [open, initial]);

  const totalImages = existingUrls.length + newFiles.length;
  const toggle = (id: string) =>
    setD((current) => ({
      ...current,
      taskIds: current.taskIds.includes(id)
        ? current.taskIds.filter((value) => value !== id)
        : [...current.taskIds, id],
    }));

  const handleAddFiles = (incomingFiles: FileList | File[]) => {
    const incoming = Array.from(incomingFiles).filter((file) => IMAGE_TYPES.has(file.type));
    if (incoming.length === 0) {
      toast.error("Attach PNG, JPG, or WebP images only");
      return;
    }
    if (incoming.some((file) => file.size > MAX_IMAGE_SIZE)) {
      toast.error("Each screenshot must be 5 MB or smaller");
      return;
    }
    const available = MAX_IMAGES - totalImages;
    if (incoming.length > available) toast.info("Maximum 2 screenshots allowed. First 2 were kept.");
    if (available > 0) setNewFiles((current) => [...current, ...incoming.slice(0, available)]);
  };

  const removeExisting = (index: number) => {
    setExistingUrls((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setExistingKeys((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };
  const removeNew = (index: number) => setNewFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!d.title.trim() || !d.body.trim()) {
      toast.error("Add a title and your question");
      return;
    }
    onSubmit({
      ...d,
      title: d.title.trim(),
      body: d.body.trim(),
      imageUrls: existingKeys,
      imageKeys: existingKeys,
      imageFiles: newFiles,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-sw max-h-[90dvh] max-w-lg gap-0 overflow-hidden p-0 sm:rounded-xl">
        <div className="shrink-0 border-b border-border/60 p-5 pb-3">
          <DialogTitle>{initial ? "Edit question" : "Ask a question"}</DialogTitle>
          <DialogDescription className="mt-1">Mr PrepMaster will reply here.</DialogDescription>
        </div>
        <form
          id="question-form"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5"
          onPaste={(event) => {
            const files = [...event.clipboardData.items]
              .filter((item) => IMAGE_TYPES.has(item.type))
              .map((item) => item.getAsFile())
              .filter((file): file is File => file !== null);
            if (files.length === 0) return;
            event.preventDefault();
            handleAddFiles(files);
          }}
          onSubmit={handleFormSubmit}
        >
          <Field label="Title">
            <Input value={d.title} onChange={(event) => setD({ ...d, title: event.target.value })} placeholder="e.g. Why is my mass different?" />
          </Field>
          <Field label="Your question">
            <Textarea rows={5} value={d.body} onChange={(event) => setD({ ...d, body: event.target.value })} placeholder="Explain what you tried…" />
          </Field>
          <Field label={`Screenshots (optional)${totalImages > 0 ? ` · ${totalImages}/2` : ""}`}>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              onChange={(event) => {
                if (event.target.files) handleAddFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <div className="flex flex-wrap items-start gap-2">
              {existingUrls.map((url, index) => (
                <ImagePreview key={`${url}-${index}`} src={url} label={`Existing screenshot ${index + 1}`} onRemove={() => removeExisting(index)} />
              ))}
              {newFiles.map((file, index) => (
                <ImagePreview key={`${file.name}-${file.lastModified}-${index}`} file={file} label={`New screenshot ${index + 1}`} onRemove={() => removeNew(index)} />
              ))}
              {totalImages < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className="flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-surface-subtle/40 text-xs text-text-muted transition-colors hover:bg-surface-subtle hover:text-foreground"
                >
                  <Plus className="size-4" />
                  <span>{totalImages === 0 ? "Upload" : "Add more"}</span>
                </button>
              )}
            </div>
            <p className="mt-1.5 text-2xs text-text-muted">Up to 2 PNG, JPG, or WebP images, 5 MB each. You can also paste images.</p>
          </Field>
          <Field label="Related tasks (optional)">
            <div className="flex flex-wrap gap-1.5">
              {tasks.map((task) => (
                <button type="button" key={task.id} onClick={() => toggle(task.id)} className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors", d.taskIds.includes(task.id) ? "border-primary bg-primary-soft text-primary" : "border-border hover:border-border-strong")}>
                  {task.title}
                </button>
              ))}
            </div>
          </Field>
        </form>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/60 bg-surface/50 p-4">
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="question-form" disabled={busy}>{initial ? "Save changes" : "Send question"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ImagePreview({ src, file, label, onRemove }: { src?: string; file?: File; label: string; onRemove: () => void }) {
  const [previewUrl, setPreviewUrl] = useState(src ?? "");
  useEffect(() => {
    if (!file) {
      setPreviewUrl(src ?? "");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, src]);

  return (
    <div className="relative size-20 overflow-hidden rounded-md border border-border bg-surface-subtle">
      <img src={previewUrl} alt={label} className="size-full object-cover" />
      <button type="button" onClick={onRemove} className="absolute right-1 top-1 inline-flex size-5 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground" aria-label={`Remove ${label}`}>
        <X className="size-3" />
      </button>
    </div>
  );
}
