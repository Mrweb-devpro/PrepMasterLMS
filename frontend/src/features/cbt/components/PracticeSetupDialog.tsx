import { BookOpen, Lightbulb, ListChecks, Shuffle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PracticeConfig } from "../utils/practice-config";

interface PracticeSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalQuestions: number;
  config: PracticeConfig;
  onChange: (config: PracticeConfig) => void;
  onBegin: () => void;
}

const optionClass = (active: boolean) =>
  cn(
    "flex min-w-0 items-center gap-2 rounded-md border px-3 py-2.5 text-left text-sm font-medium transition-colors",
    active
      ? "border-primary bg-primary-soft text-foreground ring-1 ring-primary"
      : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover",
  );

export function PracticeSetupDialog({
  open,
  onOpenChange,
  totalQuestions,
  config,
  onChange,
  onBegin,
}: PracticeSetupDialogProps) {
  const counts = Array.from(new Set([10, 15, 25].filter((count) => count <= totalQuestions)));
  const countOptions: (number | "all")[] = [...counts, "all"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl gap-0 p-0 sm:w-full">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-4 pr-12 sm:px-5 sm:py-5">
          <DialogTitle className="font-display text-xl">Set up your practice</DialogTitle>
          <DialogDescription className="sr-only">
            Choose your practice preferences before beginning.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:space-y-5 sm:px-5 sm:py-5">
          <section className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Question set</p>
              <p className="text-xs text-text-muted">Choose your focus</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {countOptions.map((count) => {
                const active = config.questionCount === count;
                const label = count === "all" ? `All ${totalQuestions}` : `${count} questions`;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => onChange({ ...config, questionCount: count })}
                    className={cn(
                      "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-text-secondary hover:bg-surface-hover",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium text-foreground">Study mode</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={optionClass(!config.timed)} onClick={() => onChange({ ...config, timed: false })}>
                <BookOpen className="size-4 shrink-0 text-primary" />
                <span className="truncate">Self-paced</span>
              </button>
              <button type="button" className={optionClass(config.timed)} onClick={() => onChange({ ...config, timed: true })}>
                <Timer className="size-4 shrink-0 text-primary" />
                <span className="truncate">Timed drill</span>
              </button>
            </div>
            {config.timed && (
              <label className="block rounded-md bg-surface-subtle px-3 py-2 text-xs font-medium text-text-secondary">
                {config.durationMinutes}-minute timer
                <input
                  className="mt-1.5 block w-full accent-primary"
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={config.durationMinutes}
                  onChange={(event) => onChange({ ...config, durationMinutes: Number(event.target.value) })}
                />
              </label>
            )}
          </section>

          <section className="space-y-2">
            <p className="text-sm font-medium text-foreground">Feedback mode</p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={optionClass(config.feedback === "instant")} onClick={() => onChange({ ...config, feedback: "instant" })}>
                <Lightbulb className="size-4 shrink-0 text-primary" />
                <span className="truncate">Instant feedback</span>
              </button>
              <button type="button" className={optionClass(config.feedback === "review")} onClick={() => onChange({ ...config, feedback: "review" })}>
                <ListChecks className="size-4 shrink-0 text-primary" />
                <span className="truncate">Review at end</span>
              </button>
            </div>
          </section>

          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              checked={config.shuffle}
              onChange={(event) => onChange({ ...config, shuffle: event.target.checked })}
              className="size-4 accent-primary"
            />
            <Shuffle className="size-4 text-primary" />
            <span className="font-medium text-foreground">Shuffle questions</span>
          </label>
        </div>
        <DialogFooter className="!flex-row shrink-0 justify-center gap-3 border-t border-border bg-background px-4 py-3 sm:px-5 sm:py-4">
          <Button className="min-w-28" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="min-w-36" onClick={onBegin}>Begin practice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
