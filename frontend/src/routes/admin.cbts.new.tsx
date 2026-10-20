import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Eye, ListChecks, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { Choice, Field, KV, Panel, PanelHeader, Stepper } from "@/features/admin/components/parts";
import { QuestionCard } from "@/features/cbt/components/QuestionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/lib/admin-store";
import { formatNaira, type Question } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/cbts/new")({
  head: () => ({
    meta: [
      { title: "Create CBT | PrepMaster Admin" },
      {
        name: "description",
        content: "Set up a CBT, add questions and preview before publishing.",
      },
      { property: "og:title", content: "Create CBT | PrepMaster Admin" },
      {
        property: "og:description",
        content: "Set up a CBT, add questions and preview before publishing.",
      },
    ],
  }),
  component: NewCbt,
});

const STEPS = ["Settings", "Questions", "Preview"];
const letters = ["A", "B", "C", "D"];
const localDateTime = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

interface Settings {
  title: string;
  courseSlug: string;
  kind: "practice" | "live";
  minutes: number;
  questionCount: number;
  availability: "forever" | "window";
  windowHours: number;
  scheduledFor: string;
  paid: boolean;
  price: number;
  retake: string;
  reveal: boolean;
}

const blankQ = (courseSlug: string): Question => ({
  id: `nq-${Math.random().toString(36).slice(2, 8)}`,
  courseSlug,
  text: "",
  options: ["", "", "", ""],
  answerIndex: 0,
});

function NewCbt() {
  const admin = useAdmin();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [s, setS] = useState<Settings>({
    title: "",
    courseSlug: admin.courses[0]?.slug ?? "",
    kind: "practice",
    minutes: 20,
    questionCount: 5,
    availability: "forever",
    windowHours: 2,
    scheduledFor: localDateTime(new Date(Date.now() + 60 * 60_000)),
    paid: false,
    price: 2000,
    retake: "Unlimited retakes",
    reveal: true,
  });
  const [qs, setQs] = useState<Question[]>([blankQ(s.courseSlug)]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v }));
  const course = admin.courses.find((c) => c.slug === s.courseSlug);

  const settingsOk =
    s.title.trim().length > 2 &&
    s.minutes > 0 &&
    (s.kind !== "live" || (s.windowHours > 0 && new Date(s.scheduledFor).getTime() > Date.now()));
  const questionsOk =
    qs.length > 0 && qs.every((q) => q.text.trim() && q.options.every((o) => o.trim()));

  const next = () => {
    if (step === 0 && !settingsOk) {
      toast.error(s.kind === "live" ? "Add a title, future start time, and live window" : "Add a title and duration first");
      return;
    }
    if (step === 1 && !questionsOk) {
      toast.error("Fill in every question and option");
      return;
    }
    setStep((x) => x + 1);
  };

  const [saving, setSaving] = useState(false);
  const create = async () => {
    if (saving) return;
    const id = `cbt-new-${Date.now()}`;
    setSaving(true);
    let newId: string;
    try {
      newId = await admin.addCbt({
      id,
      title: s.title,
      courseSlug: s.courseSlug,
      kind: s.kind,
      paid: s.paid,
      ...(s.paid ? { price: s.price } : {}),
      questionCount: qs.length,
      minutes: s.minutes,
      retakePolicy: s.kind === "live" ? "Single attempt" : s.retake,
      ...(s.kind === "live"
        ? {
            status: "upcoming" as const,
            scheduledFor: new Date(s.scheduledFor).toISOString(),
            closesAt: new Date(new Date(s.scheduledFor).getTime() + s.windowHours * 3_600_000).toISOString(),
          }
        : {}),
      revealResults: s.reveal,
      questions: qs.map((q) => ({ ...q, courseSlug: s.courseSlug })),
      });
    } catch (e) {
      setSaving(false);
      toast.error("Couldn't create the CBT", { description: (e as Error).message });
      return;
    }
    toast.success("CBT created", { description: s.title });
    navigate({ to: "/admin/cbts/$cbtId", params: { cbtId: newId } });
  };

  const updateQ = (id: string, patch: Partial<Question>) =>
    setQs((p) => p.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  return (
    <AdminShell
      title="Create CBT"
      description="Three quick steps: settings, questions, then preview."
      back={{ to: "/admin/cbts", label: "All CBTs" }}
    >
      <Stepper steps={STEPS} current={step} onStep={setStep} />

      {step === 0 && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Panel className="space-y-5 p-5 md:p-6">
            <Field label="Title">
              <Input
                value={s.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Genetics Weekly Test"
              />
            </Field>
            <Field label="Course">
              <select
                value={s.courseSlug}
                onChange={(e) => set("courseSlug", e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm"
              >
                {admin.courses.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <Choice
                value={s.kind}
                onChange={(v) => {
                  set("kind", v as Settings["kind"]);
                  if (v === "live") set("availability", "window");
                }}
                options={[
                  { value: "practice", label: "Practice", hint: "Students take it any time" },
                  { value: "live", label: "Live", hint: "Starts at a set date & time" },
                ]}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Duration (minutes)">
                <Input
                  type="number"
                  min={1}
                  value={s.minutes}
                  onChange={(e) => set("minutes", Number(e.target.value))}
                />
              </Field>
              <Field label="Number of questions" hint="You'll write them in the next step">
                <Input
                  type="number"
                  min={1}
                  value={s.questionCount}
                  onChange={(e) => set("questionCount", Number(e.target.value))}
                />
              </Field>
            </div>
            {s.kind === "live" && (
              <Field label="Starts at">
                <Input
                  type="datetime-local"
                  value={s.scheduledFor}
                  onChange={(e) => set("scheduledFor", e.target.value)}
                />
              </Field>
            )}
            {s.kind === "live" ? (
              <Field label="Live window (hours)">
                <Input
                  type="number"
                  min={1}
                  value={s.windowHours}
                  onChange={(e) => set("windowHours", Number(e.target.value))}
                />
              </Field>
            ) : (
              <>
                <Field label="How long is it open?">
                  <Choice
                    value={s.availability}
                    onChange={(v) => set("availability", v as Settings["availability"])}
                    options={[
                      { value: "forever", label: "Always open", hint: "No closing time" },
                      { value: "window", label: "Limited window", hint: "Closes after a few hours" },
                    ]}
                  />
                </Field>
                {s.availability === "window" && (
                  <Field label="Open for (hours)">
                    <Input
                      type="number"
                      min={1}
                      value={s.windowHours}
                      onChange={(e) => set("windowHours", Number(e.target.value))}
                    />
                  </Field>
                )}
              </>
            )}
          </Panel>
          <div className="space-y-4">
            <Panel className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Paid CBT</p>
                  <p className="text-xs text-text-muted">Students pay to unlock</p>
                </div>
                <Switch checked={s.paid} onCheckedChange={(v) => set("paid", v)} />
              </div>
              {s.paid && (
                <Field label="Price (₦)">
                  <Input
                    type="number"
                    value={s.price}
                    onChange={(e) => set("price", Number(e.target.value))}
                  />
                </Field>
              )}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-sm font-medium">Show results</p>
                  <p className="text-xs text-text-muted">Right after submission</p>
                </div>
                <Switch checked={s.reveal} onCheckedChange={(v) => set("reveal", v)} />
              </div>
              {s.kind === "practice" && (
                <Field label="Retakes">
                  <select
                    value={s.retake}
                    onChange={(e) => set("retake", e.target.value)}
                    className="h-9 w-full rounded-md border border-input bg-surface px-3 text-sm"
                  >
                    {["Unlimited retakes", "3 attempts", "2 attempts", "Single attempt"].map(
                      (r) => (
                        <option key={r}>{r}</option>
                      ),
                    )}
                  </select>
                </Field>
              )}
            </Panel>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-text-secondary">
              <span className="font-medium text-foreground">{qs.length}</span> of {s.questionCount}{" "}
              questions written
            </p>
            <Button variant="outline" onClick={() => setQs((p) => [...p, blankQ(s.courseSlug)])}>
              <Plus />
              Add question
            </Button>
          </div>
          {qs.map((q, qi) => (
            <Panel key={q.id} className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs font-medium">
                  Question {qi + 1}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete question"
                  disabled={qs.length === 1}
                  onClick={() => setQs((p) => p.filter((x) => x.id !== q.id))}
                >
                  <Trash2 />
                </Button>
              </div>
              <Textarea
                value={q.text}
                onChange={(e) => updateQ(q.id, { text: e.target.value })}
                placeholder="Type the question…"
                className="min-h-20"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => (
                  <div
                    key={oi}
                    className={cn(
                      "flex items-center gap-2 rounded-md border p-1.5 pl-2",
                      q.answerIndex === oi ? "border-success bg-success-bg" : "border-border",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => updateQ(q.id, { answerIndex: oi })}
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-sm text-xs font-semibold",
                        q.answerIndex === oi
                          ? "bg-success text-primary-foreground"
                          : "bg-surface-subtle text-text-secondary",
                      )}
                      aria-label={`Mark ${letters[oi]} correct`}
                    >
                      {q.answerIndex === oi ? <Check className="size-3.5" /> : letters[oi]}
                    </button>
                    <input
                      value={o}
                      onChange={(e) =>
                        updateQ(q.id, {
                          options: q.options.map((x, i) => (i === oi ? e.target.value : x)),
                        })
                      }
                      placeholder={`Option ${letters[oi]}`}
                      className="h-8 min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-text-muted">
                Tap a letter to mark the correct answer.
              </p>
            </Panel>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader
                title="Settings"
                aside={
                  <Button size="sm" variant="ghost" onClick={() => setStep(0)}>
                    Edit
                  </Button>
                }
              />
              <div className="grid gap-x-8 px-5 py-2 sm:grid-cols-2">
                <KV k="Title" v={s.title} />
                <KV k="Course" v={course?.code} />
                <KV k="Type" v={<span className="capitalize">{s.kind}</span>} />
                <KV k="Duration" v={`${s.minutes} min`} />
                <KV k="Questions" v={qs.length} />
                <KV
                  k="Open"
                  v={s.availability === "forever" ? "Always" : `${s.windowHours} hours`}
                />
                <KV
                  k="Price"
                  v={
                    s.paid ? <span className="text-gold-text">{formatNaira(s.price)}</span> : "Free"
                  }
                />
                <KV k="Results" v={s.reveal ? "Shown" : "Held"} />
              </div>
            </Panel>
            <Panel className="p-5">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Eye className="size-4 text-primary" />
                Student preview
              </p>
              <div className="mt-3 rounded-md border border-border bg-background p-4">
                {qs[previewIndex] && (
                  <QuestionCard
                    compact
                    index={previewIndex}
                    total={qs.length}
                    question={qs[previewIndex]!}
                    selected={undefined}
                    onSelect={() => {}}
                  />
                )}
              </div>
              <div className="mt-3 flex justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={previewIndex === 0}
                  onClick={() => setPreviewIndex((i) => i - 1)}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={previewIndex >= qs.length - 1}
                  onClick={() => setPreviewIndex((i) => i + 1)}
                >
                  Next
                </Button>
              </div>
            </Panel>
          </div>
          <Panel>
            <PanelHeader
              title={`Questions (${qs.length})`}
              aside={
                <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
                  <ListChecks />
                  Edit
                </Button>
              }
            />
            <ol className="divide-y divide-border">
              {qs.map((q, i) => (
                <li key={q.id} className="px-5 py-4">
                  <p className="text-sm font-medium">
                    {i + 1}. {q.text}
                  </p>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {q.options.map((o, oi) => (
                      <span
                        key={oi}
                        className={cn(
                          "rounded-sm px-2.5 py-1.5 text-sm",
                          oi === q.answerIndex
                            ? "bg-success-bg font-medium text-success"
                            : "bg-surface-subtle text-text-secondary",
                        )}
                      >
                        {letters[oi]}. {o}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      )}

      <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-lg border border-border bg-surface/90 p-3 shadow-md backdrop-blur">
        <Button variant="ghost" disabled={step === 0 || saving} onClick={() => setStep((x) => x - 1)}>
          <ArrowLeft />
          Back
        </Button>
        {step < 2 ? (
          <Button disabled={saving} onClick={next}>
            Continue
            <ArrowRight />
          </Button>
        ) : (
          <Button disabled={saving} onClick={create}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating CBT...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Create CBT
              </>
            )}
          </Button>
        )}
      </div>
    </AdminShell>
  );
}
