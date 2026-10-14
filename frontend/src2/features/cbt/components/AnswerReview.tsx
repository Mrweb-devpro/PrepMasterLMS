import { Check, CheckCircle2, MinusCircle, X, XCircle } from "lucide-react";
import type { Question } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const letters = ["A", "B", "C", "D", "E", "F"];

/** Every question with all its options: correct one in green, a wrong pick in red. */
export function AnswerReview({
  questions,
  answers,
}: {
  questions: Question[];
  answers: Record<string, number>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Review answers</h2>
        <div className="flex gap-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-success" /> Correct
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2.5 rounded-full bg-error" /> Your wrong pick
          </span>
        </div>
      </div>
      {questions.map((q, i) => {
        const picked = answers[q.id];
        const status = picked === undefined ? "skipped" : picked === q.answerIndex ? "ok" : "wrong";
        return (
          <div key={q.id} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="flex gap-3">
              {status === "ok" && <CheckCircle2 className="size-5 shrink-0 text-success" />}
              {status === "wrong" && <XCircle className="size-5 shrink-0 text-error" />}
              {status === "skipped" && <MinusCircle className="size-5 shrink-0 text-text-muted" />}
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {i + 1}. {q.text}
                </p>
                {status === "skipped" && (
                  <p className="mt-0.5 text-xs text-text-muted">Not answered</p>
                )}
                <ul className="mt-3 space-y-1.5">
                  {q.options.map((opt, oi) => {
                    const isCorrect = oi === q.answerIndex;
                    const isWrongPick = oi === picked && !isCorrect;
                    return (
                      <li
                        key={oi}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm",
                          isCorrect && "border-success bg-success-bg font-medium",
                          isWrongPick && "border-error bg-error-bg",
                          !isCorrect && !isWrongPick && "border-border text-text-secondary",
                        )}
                      >
                        <span className="w-4 shrink-0 text-xs font-semibold text-text-muted">
                          {letters[oi]}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && <Check className="size-4 text-success" />}
                        {isWrongPick && <X className="size-4 text-error" />}
                        {oi === picked && (
                          <span className="text-2xs text-text-muted">Your answer</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
