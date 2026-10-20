import { Link } from "@tanstack/react-router";
import { Flag, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Panel, PanelHeader, Td, Th } from "@/features/admin/components/parts";
import { formatDateTime } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export interface StudentAttemptRow {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  score: number;
  correct: number;
  missed: number;
  total: number;
  flaggedQuestionNumbers: number[];
  submittedAt: string;
}

export function CbtAttemptsPanel({
  cbtTitle,
  totalQuestions,
  attempts,
}: {
  cbtTitle: string;
  totalQuestions: number;
  attempts: StudentAttemptRow[];
}) {
  const [query, setQuery] = useState("");
  const [flagFilter, setFlagFilter] = useState<"all" | "flagged" | "unflagged">("all");
  const [scoreFilter, setScoreFilter] = useState<"all" | "high" | "average" | "low">("all");
  const filtered = useMemo(
    () =>
      attempts.filter((attempt) => {
        const needle = query.trim().toLowerCase();
        const matchSearch =
          !needle ||
          attempt.studentName.toLowerCase().includes(needle) ||
          attempt.studentEmail.toLowerCase().includes(needle);
        if (!matchSearch) return false;
        if (flagFilter === "flagged" && attempt.flaggedQuestionNumbers.length === 0) return false;
        if (flagFilter === "unflagged" && attempt.flaggedQuestionNumbers.length > 0) return false;
        if (scoreFilter === "high" && attempt.score < 70) return false;
        if (scoreFilter === "average" && (attempt.score < 50 || attempt.score >= 70)) return false;
        if (scoreFilter === "low" && attempt.score >= 50) return false;
        return true;
      }),
    [attempts, flagFilter, query, scoreFilter],
  );
  const flaggedCount = attempts.filter((attempt) => attempt.flaggedQuestionNumbers.length > 0).length;

  return (
    <Panel>
      <PanelHeader
        title={`Student attempts (${attempts.length})`}
        aside={
          <span className="text-xs text-text-muted">
            {flaggedCount} student{flaggedCount === 1 ? "" : "s"} flagged questions · {totalQuestions} questions
          </span>
        }
      />
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search student by name or email"
            className="bg-surface pl-9 text-sm"
            aria-label={`Search attempts for ${cbtTitle}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-surface-subtle p-0.5 text-xs font-medium">
            {([
              ["all", "All"],
              ["flagged", "Flagged only"],
              ["unflagged", "No flags"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFlagFilter(value)}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2.5 py-1 transition-colors",
                  flagFilter === value
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-text-muted hover:text-foreground",
                )}
              >
                {value === "flagged" && <Flag className="size-3 text-gold-text" />}
                {label}
              </button>
            ))}
          </div>
          <select
            value={scoreFilter}
            onChange={(event) => setScoreFilter(event.target.value as typeof scoreFilter)}
            className="h-8 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Filter attempts by score"
          >
            <option value="all">All scores</option>
            <option value="high">High (≥ 70%)</option>
            <option value="average">Average (50% – 69%)</option>
            <option value="low">Needs help (&lt; 50%)</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-subtle text-xs text-text-muted">
              <Th>Student</Th>
              <Th>Score</Th>
              <Th>Correct / missed</Th>
              <Th>Flagged questions</Th>
              <Th className="text-right">Submitted</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-text-muted">
                  No matching student attempts found.
                </td>
              </tr>
            ) : (
              filtered.map((attempt) => (
                <tr key={attempt.id} className="transition-colors hover:bg-surface-hover/50">
                  <Td>
                    <Link
                      to="/admin/students/$studentId"
                      params={{ studentId: attempt.studentId }}
                      className="group inline-flex flex-col font-medium text-foreground hover:text-primary"
                    >
                      <span className="underline-offset-2 group-hover:underline">{attempt.studentName}</span>
                      <span className="text-xs text-text-muted">{attempt.studentEmail}</span>
                    </Link>
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        "inline-flex items-center rounded px-2 py-0.5 font-display text-sm font-semibold tabular-nums",
                        attempt.score >= 70
                          ? "bg-success-bg text-success"
                          : attempt.score >= 50
                            ? "bg-warning-bg text-warning"
                            : "bg-error-bg text-error",
                      )}
                    >
                      {attempt.score}%
                    </span>
                  </Td>
                  <Td>
                    <span className="text-xs text-foreground">
                      <span className="font-semibold text-success">{attempt.correct}</span> correct
                      <span className="mx-1.5 text-text-muted">·</span>
                      <span className="font-semibold text-error">{attempt.missed}</span> missed
                    </span>
                  </Td>
                  <Td>
                    {attempt.flaggedQuestionNumbers.length === 0 ? (
                      <span className="text-xs text-text-muted">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {attempt.flaggedQuestionNumbers.map((number) => (
                          <span
                            key={number}
                            className="inline-flex items-center rounded-sm border border-gold/30 bg-gold-bg px-1.5 py-0.5 text-2xs font-semibold text-gold-text"
                          >
                            Q{number}
                          </span>
                        ))}
                        <span className="text-2xs text-text-muted">({attempt.flaggedQuestionNumbers.length})</span>
                      </div>
                    )}
                  </Td>
                  <Td className="text-right text-xs text-text-muted">{formatDateTime(attempt.submittedAt)}</Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
