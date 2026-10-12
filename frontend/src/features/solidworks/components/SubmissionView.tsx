import { Eye, FileBox, Trophy } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/prep/bits";
import { KV } from "@/features/admin/components/parts";
import { FileViewerDialog, type ViewableFile } from "@/features/files/components/FileViewer";
import { formatBytes, formatDate } from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import { difficultyLabel, MAX_SCORES, SCORE_LABELS } from "../constants";
import type { SwFile, SwGrade, SwSubmission } from "../types";

export function FileList({ files }: { files: SwFile[] }) {
  const [open, setOpen] = useState<ViewableFile | null>(null);
  return (
    <>
      <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
        {files.map((f) => (
          <li key={f.name}>
            <button
              type="button"
              onClick={() =>
                setOpen({
                  name: f.name,
                  ...(f.url ? { url: f.url } : {}),
                  ...(f.mime ? { mime: f.mime } : {}),
                })
              }
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-subtle"
            >
              <FileBox className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
              <span className="text-2xs text-text-muted">{formatBytes(f.size)}</span>
              <Eye className="size-4 text-text-muted" />
            </button>
          </li>
        ))}
      </ul>
      <FileViewerDialog file={open} onClose={() => setOpen(null)} />
    </>
  );
}

export function ResultsPanel({ grade }: { grade?: SwGrade }) {
  if (!grade) {
    return (
      <Card className="border-dashed">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-subtle text-text-muted">
            <Trophy className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Results</p>
            <p className="text-sm text-text-muted">
              Not graded yet. Your results will appear here.
            </p>
          </div>
        </div>
      </Card>
    );
  }
  const good = grade.verdict === "good";
  return (
    <Card className={cn(good ? "border-success/40" : "border-warning/40")}>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            "flex size-16 flex-col items-center justify-center rounded-full font-display",
            good ? "bg-success-bg text-success" : "bg-warning-bg text-warning",
          )}
        >
          <span className="text-xl font-semibold leading-none">{grade.total}</span>
          <span className="text-2xs">/100</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{good ? "Good attempt" : "Needs work"}</p>
          <p className="text-xs text-text-muted">Graded {formatDate(grade.gradedAt)}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {(Object.keys(MAX_SCORES) as (keyof typeof MAX_SCORES)[]).map((k) => (
          <div key={k} className="rounded-md bg-surface-subtle p-3">
            <p className="text-xs text-text-muted">{SCORE_LABELS[k]}</p>
            <p className="mt-1 font-display text-lg font-semibold">
              {grade.scores[k]}
              <span className="text-sm text-text-muted">/{MAX_SCORES[k]}</span>
            </p>
          </div>
        ))}
      </div>
      {grade.remarks && (
        <div className="mt-4 rounded-md border border-border p-3">
          <p className="text-xs font-medium text-text-muted">Remarks</p>
          <p className="mt-1 whitespace-pre-line text-sm">{grade.remarks}</p>
        </div>
      )}
    </Card>
  );
}

export function SubmissionAnswers({
  sub,
  taskTitle,
}: {
  sub: Pick<SwSubmission, "files" | "mass" | "volume" | "difficulty" | "challenge"> & {
    submittedAt?: string;
  };
  taskTitle?: string;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <p className="mb-2 text-sm font-semibold">{taskTitle ? "Answers" : "Your answers"}</p>
        <div className="divide-y divide-border">
          {taskTitle && <KV k="Task" v={taskTitle} />}
          <KV k="Mass" v={sub.mass} />
          <KV k="Volume" v={sub.volume} />
          <KV k="How was it?" v={difficultyLabel(sub.difficulty)} />
          {sub.submittedAt && <KV k="Submitted" v={formatDate(sub.submittedAt)} />}
        </div>
        <p className="mt-4 text-xs font-medium text-text-muted">
          What was challenging or interesting
        </p>
        <p className="mt-1 whitespace-pre-line text-sm">{sub.challenge}</p>
      </Card>
      <Card>
        <p className="mb-3 text-sm font-semibold">Files ({sub.files.length})</p>
        <FileList files={sub.files} />
      </Card>
    </div>
  );
}
