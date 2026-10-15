import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/features/auth/session";
import type { AccountWarning } from "@/features/auth/types";
import { acknowledgeWarning, claimWarningView, formatWarningDate, latestWarning } from "@/features/auth/utils/warning-views";

export function WarningNoticeDialog() {
  const { hydrated, user } = useSession();
  const [notice, setNotice] = useState<{ userId: string; warning: AccountWarning } | null>(null);

  useEffect(() => {
    if (!hydrated || !user || user.role !== "student") return;
    let storage: Storage;
    try { storage = window.localStorage; } catch { return; }
    const warning = latestWarning(user.warnings ?? []);
    // Do not clear the displayed notice when Strict Mode replays the effect.
    if (warning && claimWarningView(storage, user.id, warning.id)) {
      setNotice({ userId: user.id, warning });
    }
  }, [hydrated, user]);

  if (!user || user.role !== "student" || notice?.userId !== user.id) return null;
  const { warning } = notice;

  const acknowledge = () => {
    let saved = false;
    try { saved = acknowledgeWarning(window.localStorage, warning.id); } catch { /* Storage blocked. */ }
    setNotice(null);
    if (!saved) toast.error("Acknowledgment couldn't be saved on this device.");
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) setNotice(null); }}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg border-warning/30">
        <DialogHeader>
          <span className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="size-4" aria-hidden="true" /> Account Warning
          </span>
          <DialogTitle>Official Account Notice</DialogTitle>
          <DialogDescription>
            Your account has received an official administrative notice. Repeated violations may result
            in account suspension or exam disqualification.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-warning/30 bg-warning-bg p-3">
          <p className="whitespace-pre-wrap break-words text-sm font-semibold">{warning.reason}</p>
          <time dateTime={warning.created_at} className="mt-2 block text-xs text-text-muted">
            {formatWarningDate(warning.created_at)}
          </time>
        </div>
        <p className="text-xs text-text-muted">You can always review these notices in Settings under Account Status &amp; Moderation.</p>
        <DialogFooter>
          <Button onClick={acknowledge}>I Understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
