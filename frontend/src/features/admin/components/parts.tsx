import { Check, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatStrip({
  items,
}: {
  items: { label: string; value: ReactNode; delta?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-surface shadow-sm lg:grid-cols-4">
      {items.map((s, i) => (
        <div
          key={s.label}
          className={cn(
            "p-4 md:p-5",
            i % 2 === 1 && "border-l border-border",
            i >= 2 && "border-t border-border lg:border-t-0",
            i === 2 && "lg:border-l",
          )}
        >
          <p className="flex items-center gap-1 text-xs text-text-muted">
            {s.label}
            <Info className="size-3" />
          </p>
          <p className="mt-2 font-display text-xl font-semibold tabular-nums md:text-2xl">
            {s.value}
          </p>
          {s.delta && (
            <p className="mt-1 text-2xs text-text-muted">
              vs last month{" "}
              <span className="ml-1 rounded-xs bg-success-bg px-1 py-0.5 font-medium text-success">
                {s.delta}
              </span>
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface shadow-sm", className)}>
      {children}
    </div>
  );
}

export function PanelHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
      <h2 className="text-base font-semibold">{title}</h2>
      {aside}
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium text-text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}
export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("whitespace-nowrap px-4 py-3 text-sm", className)}>{children}</td>;
}

export function Stepper({
  steps,
  current,
  onStep,
}: {
  steps: string[];
  current: number;
  onStep?: (i: number) => void;
}) {
  return (
    <ol className="mb-6 flex items-center gap-2 overflow-x-auto">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={i > current}
              onClick={() => onStep?.(i)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
                active && "border-primary bg-primary-soft font-medium text-primary",
                done && "border-border bg-surface text-foreground hover:bg-surface-hover",
                !active && !done && "border-border bg-surface text-text-muted",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-2xs font-semibold",
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-foreground text-background"
                      : "bg-surface-subtle",
                )}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              {s}
            </button>
            {i < steps.length - 1 && <span className="h-px w-6 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-text-muted">{hint}</span>}
    </label>
  );
}

export function Choice({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; hint?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md border p-3 text-left transition-all",
            value === o.value
              ? "border-primary bg-primary-soft ring-1 ring-primary"
              : "border-border bg-surface hover:border-border-strong",
          )}
        >
          <span className="block text-sm font-medium">{o.label}</span>
          {o.hint && <span className="block text-xs text-text-muted">{o.hint}</span>}
        </button>
      ))}
    </div>
  );
}

export function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-text-muted">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
