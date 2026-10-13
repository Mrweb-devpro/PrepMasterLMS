import { useEffect, useState } from "react";
import { AlertTriangle, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type ModerationMode = "suspend" | "warn";

const presets: Record<ModerationMode, string[]> = {
  suspend: [
    "Exam malpractice",
    "Sharing paid materials",
    "Payment fraud",
    "Abusive behaviour",
    "Multiple warnings ignored",
  ],
  warn: [
    "Suspicious exam activity",
    "Account sharing",
    "Inappropriate language",
    "Late payment",
    "Spam or misuse",
  ],
};

interface Props {
  open: boolean;
  mode: ModerationMode;
  targetLabel: string;
  onOpenChange: (o: boolean) => void;
  onConfirm: (reason: string) => void;
}

export function ModerationDialog({ open, mode, targetLabel, onOpenChange, onConfirm }: Props) {
  const [preset, setPreset] = useState<string | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    if (open) {
      setPreset(null);
      setNote("");
    }
  }, [open]);

  const reason = [preset, note.trim()].filter(Boolean).join(" — ");
  const isSuspend = mode === "suspend";
  const Icon = isSuspend ? Ban : AlertTriangle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span
            className={cn(
              "mb-1 flex size-10 items-center justify-center rounded-lg",
              isSuspend ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning",
            )}
          >
            <Icon className="size-5" />
          </span>
          <DialogTitle>
            {isSuspend ? "Suspend" : "Warn"} {targetLabel}
          </DialogTitle>
          <DialogDescription>
            {isSuspend
              ? "They'll lose access until restored. The reason is shown to them."
              : "They'll see this warning next time they sign in."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {presets[mode].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(preset === p ? null : p)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  preset === p
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border text-text-secondary hover:bg-surface-hover",
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add details (optional if a reason is picked)"
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!reason} onClick={() => onConfirm(reason)}>
            <Icon />
            {isSuspend ? "Suspend" : "Send warning"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
