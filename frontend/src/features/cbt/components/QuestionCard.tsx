import type { Question } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const letters = ["A", "B", "C", "D", "E"];

/** Clean, low-text question card shared by the student exam screen and admin preview. */
export function QuestionCard({
  question,
  index,
  total,
  selected,
  onSelect,
  compact,
}: {
  question: Question;
  index: number;
  total: number;
  selected: number | undefined;
  onSelect: (i: number) => void;
  compact?: boolean;
}) {
  return (
    <div className="animate-fade-in" key={question.id}>
      <p className="text-xs font-medium tabular-nums text-text-muted">
        {index + 1} / {total}
      </p>
      <h2
        className={cn(
          "mt-2 font-semibold leading-snug",
          compact ? "text-base" : "text-xl md:text-2xl",
        )}
      >
        {question.text || "Untitled question"}
      </h2>
      <div className={cn("space-y-2", compact ? "mt-3" : "mt-6")}>
        {question.options.map((opt, i) => {
          const active = selected === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md border bg-surface text-left transition-all",
                compact ? "p-2.5 text-sm" : "p-3.5 text-base",
                active
                  ? "border-primary ring-1 ring-primary"
                  : "border-border hover:border-border-strong hover:bg-surface-hover",
              )}
            >
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-sm font-display text-xs font-semibold",
                  compact ? "size-6" : "size-8",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-subtle text-text-secondary",
                )}
              >
                {letters[i]}
              </span>
              <span>{opt || `Option ${letters[i]}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
