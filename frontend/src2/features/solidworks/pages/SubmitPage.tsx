import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Check, Loader2, UploadCloud, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { Card, PageHeader } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Stepper } from "@/features/admin/components/parts";
import { SelectField } from "@/features/auth/components/fields";
import { formatBytes } from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import { SubmittedTag, TaskNumber, TaskThumb } from "../components/bits";
import { SubmissionAnswers } from "../components/SubmissionView";
import { DIFFICULTIES } from "../constants";
import { useCreateSubmission } from "../hooks/mutations";
import { swQueries } from "../hooks/queries";
import { useSwUser } from "../hooks/useSwUser";
import type { Difficulty, SwFile } from "../types";

const STEPS = ["Task", "Files", "Questions", "Preview"];

interface Draft {
  taskId?: string;
  files: SwFile[];
  mass: string;
  volume: string;
  difficulty?: Difficulty;
  challenge: string;
}

export function SubmitPage({ initialTask }: { initialTask?: string }) {
  const user = useSwUser();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const { data: subs } = useSuspenseQuery(swQueries.submissions(user.id));
  const create = useCreateSubmission();
  const done = new Set(subs.map((s) => s.taskId));

  const [step, setStep] = useState(initialTask && !done.has(initialTask) ? 1 : 0);
  const [d, setD] = useState<Draft>({
    ...(initialTask && !done.has(initialTask) ? { taskId: initialTask } : {}),
    files: [],
    mass: "",
    volume: "",
    challenge: "",
  });
  const task = tasks.find((t) => t.id === d.taskId);

  const problem = [
    () => (!d.taskId ? "Choose the task you're submitting for" : null),
    () => (d.files.length === 0 ? "Add at least one file" : null),
    () =>
      !d.mass.trim()
        ? "Enter the mass"
        : !d.volume.trim()
          ? "Enter the volume"
          : !d.difficulty
            ? "Tell us how it was"
            : !d.challenge.trim()
              ? "Describe what was challenging"
              : null,
  ];
  const next = () => {
    const err = problem[step]?.();
    if (err) {
      toast.error(err);
      return;
    }
    setStep(step + 1);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const added = Array.from(list).map((f) => ({
      name: f.name,
      size: f.size,
      mime: f.type,
      url: URL.createObjectURL(f),
      file: f,
    }));
    setD((p) => ({
      ...p,
      files: [...p.files, ...added.filter((a) => !p.files.some((x) => x.name === a.name))],
    }));
  };

  const submit = async () => {
    const ok = await confirm({
      title: "Submit your work?",
      description:
        "Submissions can't be edited once sent. You'll still be able to view it in My works.",
      confirmLabel: "Submit",
    });
    if (!ok || !d.taskId || !d.difficulty) return;
    create.mutate(
      {
        taskId: d.taskId,
        userId: user.id,
        userName: user.name,
        files: d.files,
        mass: d.mass.trim(),
        volume: d.volume.trim(),
        difficulty: d.difficulty,
        challenge: d.challenge.trim(),
      },
      {
        onSuccess: (s) =>
          navigate({ to: "/solidworks/works/$id", params: { id: (s as { id: string }).id } }),
      },
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Submit work"
        subtitle="Four quick steps. Your instructor grades it and you'll see results in My works."
      />
      <Stepper steps={STEPS} current={step} onStep={setStep} />

      {step === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {tasks.map((t) => {
            const sent = done.has(t.id);
            const active = d.taskId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                disabled={sent}
                onClick={() => setD({ ...d, taskId: t.id })}
                className={cn(
                  "overflow-hidden rounded-lg border bg-surface text-left transition-all",
                  active
                    ? "border-primary ring-2 ring-primary"
                    : "border-border hover:border-border-strong",
                  sent && "cursor-not-allowed opacity-60",
                )}
              >
                <div className="relative">
                  <TaskThumb task={t} />
                  <span className="absolute left-2 top-2 flex items-center gap-1.5">
                    <TaskNumber n={t.number} />
                    {sent && <SubmittedTag />}
                  </span>
                  {active && (
                    <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-3.5" />
                    </span>
                  )}
                </div>
                <p className="p-3 text-sm font-medium">{t.title}</p>
              </button>
            );
          })}
        </div>
      )}

      {step === 1 && (
        <Card>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-border-strong bg-surface-subtle px-6 py-10 text-center transition-colors hover:border-primary">
            <UploadCloud className="size-8 text-primary" />
            <span className="text-sm font-medium">Click to add your files</span>
            <span className="text-xs text-text-muted">
              .SLDPRT, .SLDASM, .SLDDRW, STEP, PDF or screenshots
            </span>
            <input
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
          {d.files.length > 0 && (
            <ul className="mt-4 divide-y divide-border rounded-md border border-border">
              {d.files.map((f) => (
                <li key={f.name} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{f.name}</span>
                  <span className="text-2xs text-text-muted">{formatBytes(f.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setD({ ...d, files: d.files.filter((x) => x.name !== f.name) })}
                    className="text-text-muted hover:text-destructive"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {step === 2 && (
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What is the mass?" hint="Include units, e.g. 612.4 g">
              <Input
                value={d.mass}
                onChange={(e) => setD({ ...d, mass: e.target.value })}
                placeholder="612.4 g"
              />
            </Field>
            <Field label="What is the volume?" hint="Include units, e.g. 226.8 cm³">
              <Input
                value={d.volume}
                onChange={(e) => setD({ ...d, volume: e.target.value })}
                placeholder="226.8 cm³"
              />
            </Field>
          </div>
          <SelectField
            label="How was it?"
            value={d.difficulty}
            options={DIFFICULTIES}
            onChange={(v) => setD({ ...d, difficulty: v as Difficulty })}
          />
          <Field label="Describe what was challenging or interesting about this problem">
            <Textarea
              rows={6}
              value={d.challenge}
              onChange={(e) => setD({ ...d, challenge: e.target.value })}
              placeholder="What slowed you down, what you learned…"
            />
          </Field>
        </Card>
      )}

      {step === 3 && d.difficulty && (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning-bg px-3 py-2.5 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            Check everything carefully. Submissions can't be edited after you submit — you can only
            view them in My works.
          </p>
          <SubmissionAnswers
            sub={{ ...d, difficulty: d.difficulty }}
            {...(task ? { taskTitle: task.title } : {})}
          />
        </div>
      )}

      <div className="mt-6 flex items-center gap-2">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="size-4" /> Back
          </Button>
        ) : (
          <Button variant="ghost" asChild>
            <Link to="/solidworks/tasks">Browse tasks</Link>
          </Button>
        )}
        {step < 3 ? (
          <Button className="ml-auto min-w-32" onClick={next}>
            Continue
          </Button>
        ) : (
          <Button className="ml-auto min-w-32" onClick={submit} disabled={create.isPending}>
            {create.isPending && <Loader2 className="size-4 animate-spin" />} Submit work
          </Button>
        )}
      </div>
    </div>
  );
}
