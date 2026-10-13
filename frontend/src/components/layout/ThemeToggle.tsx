import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";

const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({
  withLabels = false,
  compact = false,
  className,
}: {
  withLabels?: boolean;
  /** One button that cycles Light → Dark → System (used on small screens). */
  compact?: boolean;
  className?: string;
}) {
  const { mode, setMode } = useTheme();

  if (compact) {
    const i = Math.max(0, options.findIndex((o) => o.value === mode));
    const cur = options[i]!;
    const next = options[(i + 1) % options.length]!;
    return (
      <button
        onClick={() => setMode(next.value)}
        aria-label={`Theme: ${cur.label}. Switch to ${next.label}`}
        title={`Theme: ${cur.label}`}
        className={cn(
          "flex size-9 items-center justify-center rounded-md border border-border bg-surface text-text-secondary transition-colors hover:text-foreground",
          className,
        )}
      >
        <cur.icon className="size-4" />
      </button>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-surface-subtle p-0.5",
        className,
      )}
    >
      {options.map((o) => {
        const active = mode === o.value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            aria-label={o.label}
            title={o.label}
            onClick={() => setMode(o.value)}
            className={cn(
              "flex h-7 items-center justify-center gap-1.5 rounded-sm px-2 text-xs transition-colors",
              active
                ? "bg-surface font-medium text-foreground shadow-sm ring-1 ring-border"
                : "text-text-muted hover:text-foreground",
            )}
          >
            <o.icon className="size-4" />
            {withLabels && o.label}
          </button>
        );
      })}
    </div>
  );
}
