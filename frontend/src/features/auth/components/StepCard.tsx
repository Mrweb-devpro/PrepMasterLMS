import { ArrowLeft, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Progress dots + title + body + back/next — shared by every multi-step auth flow. */
export function StepCard({
  step,
  total,
  title,
  subtitle,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  busy,
  aside,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  busy?: boolean;
  aside?: ReactNode;
}) {
  return (
    <form
      className="animate-fade-in"
      onSubmit={(e) => {
        e.preventDefault();
        onNext?.();
      }}
    >
      {total > 1 && (
        <div className="mb-6 flex gap-1.5" aria-label={`Step ${step + 1} of ${total}`}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
      )}
      <p className="text-2xs font-medium uppercase tracking-wider text-text-muted">
        Step {step + 1} of {total}
      </p>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
      <div className="mt-6 space-y-4">{children}</div>
      {onNext && (
        <div className="mt-7 flex items-center gap-2">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack} className="gap-1.5">
              <ArrowLeft className="size-4" /> Back
            </Button>
          )}
          {aside}
          <Button type="submit" className="ml-auto min-w-32" disabled={busy}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            {nextLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
