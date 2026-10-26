import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { Card } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ResultsPanel, SubmissionAnswers } from "@/features/solidworks/components/SubmissionView";
import { MAX_SCORES, SCORE_LABELS } from "@/features/solidworks/constants";
import { useGradeSubmission } from "@/features/solidworks/hooks/mutations";
import { swQueries } from "@/features/solidworks/hooks/queries";
import type { Verdict } from "@/features/solidworks/types";
import { Choice, Field } from "../../components/parts";

type K = keyof typeof MAX_SCORES;

export function SwSubmissionDetailPage({ id }: { id: string }) {
  const { data: sub } = useSuspenseQuery(swQueries.submission(id));
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const grade = useGradeSubmission();
  const confirm = useConfirm();
  const g = sub.grade;
  const task = tasks.find((item) => item.id === sub.taskId);
  const autoScores = sub.autoScores;
  const [scores, setScores] = useState<Record<K, string>>({
    mass: String(g?.scores.mass ?? autoScores?.mass ?? ""),
    volume: String(g?.scores.volume ?? autoScores?.volume ?? ""),
    model: String(g?.scores.model ?? ""),
  });
  const [verdict, setVerdict] = useState<Verdict | "">(g?.verdict ?? "");
  const [remarks, setRemarks] = useState(g?.remarks ?? "");
  const total = (Object.keys(scores) as K[]).reduce((n, k) => n + (Number(scores[k]) || 0), 0);
  const deviation = (value: string, target?: number, mass = false) => {
    const submitted = Number.parseFloat(value.replace(/,/g, ""));
    const normalized = mass && /\bkg\b/i.test(value) ? submitted * 1000 : submitted;
    return target && Number.isFinite(normalized) ? Math.abs(normalized - target) / target * 100 : undefined;
  };

  const save = async () => {
    const nums = {
      mass: Number(scores.mass),
      volume: Number(scores.volume),
      model: Number(scores.model),
    };
    if (
      (Object.keys(nums) as K[]).some(
        (k) => scores[k] === "" || isNaN(nums[k]) || nums[k] < 0 || nums[k] > MAX_SCORES[k],
      )
    ) {
      toast.error("Enter every score within its maximum");
      return;
    }
    if (!verdict) {
      toast.error("Choose a verdict");
      return;
    }
    if (
      g &&
      !(await confirm({
        title: "Update this grade?",
        description: "The student will see the new result.",
        confirmLabel: "Update grade",
      }))
    )
      return;
    grade.mutate({ id: sub.id, grade: { scores: nums, verdict, remarks: remarks.trim() } });
  };

  return (
    <div className="space-y-6">
      <SubmissionAnswers
        sub={sub}
        taskTitle={task?.title ?? "Deleted task"}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <p className="text-sm font-semibold">{g ? "Update grade" : "Grade this submission"}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(MAX_SCORES) as K[]).map((k) => {
              const target = k === "mass" ? task?.targetMass : k === "volume" ? task?.targetVolume : undefined;
              const submitted = k === "mass" ? sub.mass : k === "volume" ? sub.volume : undefined;
              const pct = submitted ? deviation(submitted, target, k === "mass") : undefined;
              return (
              <Field key={k} label={`${SCORE_LABELS[k]} /${MAX_SCORES[k]}`}>
                {(k === "mass" || k === "volume") && autoScores && (
                  <span className="mb-1 inline-flex rounded-full bg-primary-soft px-1.5 py-0.5 text-2xs font-semibold text-primary">Auto-graded</span>
                )}
                <Input
                  type="number"
                  min={0}
                  max={MAX_SCORES[k]}
                  value={scores[k]}
                  onChange={(e) => setScores({ ...scores, [k]: e.target.value })}
                />
                {target && submitted && pct !== undefined && (
                  <p className="mt-1 text-2xs text-text-muted">
                    Target {target} · submitted {submitted} · {pct.toFixed(2)}% deviation
                    {task?.tolerancePercent ? ` (±${task.tolerancePercent}% tolerance)` : ""}
                  </p>
                )}
              </Field>
              );
            })}
          </div>
          <p className="text-sm">
            Total: <span className="font-display text-lg font-semibold">{total}</span>/100
          </p>
          <Choice
            value={verdict}
            onChange={(v) => setVerdict(v as Verdict)}
            options={[
              { value: "good", label: "Good attempt", hint: "Counts toward their good attempts" },
              { value: "needs-work", label: "Needs work", hint: "Encourage a retry" },
            ]}
          />
          <Field label="Remarks">
            <Textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="What they did well, what to fix…"
            />
          </Field>
          <Button onClick={save} disabled={grade.isPending} className="w-full">
            {g ? "Update grade" : "Save grade"}
          </Button>
        </Card>
        <div>
          <p className="mb-2 text-sm font-semibold">What the student sees</p>
          <ResultsPanel {...(g ? { grade: g } : {})} />
        </div>
      </div>
    </div>
  );
}
