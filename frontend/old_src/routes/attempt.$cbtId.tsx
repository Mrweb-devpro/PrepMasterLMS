import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Flag, Lock, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getCbt, getCourse } from "@/lib/mock-data";
import { usePrep } from "@/lib/prep-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/attempt/$cbtId")({
  head: () => ({
    meta: [
      { title: "Exam in progress — PrepMaster" },
      { name: "description", content: "Answer questions, flag for review and submit your CBT." },
      { property: "og:title", content: "Exam in progress — PrepMaster" },
      { property: "og:description", content: "Answer questions, flag for review and submit your CBT." },
    ],
  }),
  component: AttemptPage,
});

const letters = ["A", "B", "C", "D", "E"];

function AttemptPage() {
  const { cbtId } = Route.useParams();
  const prep = usePrep();
  const navigate = useNavigate();
  const cbt = getCbt(cbtId);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState((cbt?.minutes ?? 0) * 60);

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [submitted]);

  if (!cbt) return <div className="p-10"><EmptyState title="CBT not found" /></div>;
  if (cbt.paid && !prep.ownsCbt(cbt.id)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-md">
          <Lock className="mx-auto size-8 text-gold" />
          <h1 className="mt-3 text-xl font-semibold">Unlock required</h1>
          <p className="mt-1 text-sm text-text-secondary">Purchase this CBT before starting it.</p>
          <Button className="mt-5" asChild><Link to="/cbts/$cbtId" params={{ cbtId: cbt.id }}>Go to CBT</Link></Button>
        </div>
      </div>
    );
  }

  const course = getCourse(cbt.courseSlug);
  const q = cbt.questions[index]!;
  const answeredCount = Object.keys(answers).length;
  const correct = cbt.questions.filter((x) => answers[x.id] === x.answerIndex).length;
  const score = Math.round((correct / cbt.questions.length) * 100);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const submit = () => {
    setSubmitted(true);
    prep.completeAttempt(cbt.id);
  };

  if (submitted) {
    const hidden = cbt.revealResults === false;
    return (
      <div className="min-h-screen bg-background px-5 py-10">
        <div className="mx-auto max-w-3xl animate-fade-in">
          <div className="relative overflow-hidden rounded-xl bg-ink-gradient p-8 text-center text-ink-foreground shadow-lg">
            <div className="dot-grid absolute inset-0 opacity-50" />
            <div className="relative">
              <p className="text-sm text-ink-muted">{course?.code} · {cbt.title}</p>
              {hidden ? (
                <>
                  <h1 className="mt-3 text-3xl font-semibold">Submitted successfully</h1>
                  <p className="mt-2 text-sm text-ink-muted">Your instructor will release results soon.</p>
                </>
              ) : (
                <>
                  <p className="mt-4 font-display text-7xl font-semibold">{score}%</p>
                  <p className="mt-2 text-sm text-ink-muted">{correct} of {cbt.questions.length} correct</p>
                </>
              )}
              <div className="mt-6 flex justify-center gap-2">
                <Button asChild variant="secondary"><Link to="/cbts">Back to CBTs</Link></Button>
                <Button asChild><Link to="/">Go home</Link></Button>
              </div>
            </div>
          </div>
          {!hidden && (
            <div className="mt-8 space-y-3">
              <h2 className="text-lg font-semibold">Review answers</h2>
              {cbt.questions.map((x, i) => {
                const ok = answers[x.id] === x.answerIndex;
                return (
                  <div key={x.id} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
                    <div className="flex gap-3">
                      {ok ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <XCircle className="size-5 shrink-0 text-error" />}
                      <div>
                        <p className="font-medium">{i + 1}. {x.text}</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          Correct answer: <span className="font-medium text-success">{x.options[x.answerIndex]}</span>
                          {!ok && answers[x.id] !== undefined && <> · You chose: <span className="text-error">{x.options[answers[x.id]!]}</span></>}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center gap-4 bg-ink px-5 py-3 text-ink-foreground md:px-8">
        <button onClick={() => navigate({ to: "/cbts" })} className="rounded-md p-1.5 text-ink-muted hover:bg-ink-foreground/10 hover:text-ink-foreground" aria-label="Exit">
          <X className="size-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">{course?.code}</p>
          <p className="truncate font-display font-semibold">{cbt.title}</p>
        </div>
        <div className={cn("ml-auto flex items-center gap-2 rounded-md px-3 py-1.5 font-display text-lg font-semibold tabular-nums", secondsLeft < 60 ? "bg-error text-destructive-foreground" : "bg-ink-foreground/10")}>
          <Clock3 className="size-4" />{mm}:{ss}
        </div>
      </header>
      <div className="h-1 bg-border">
        <div className="h-full bg-primary transition-all" style={{ width: `${(answeredCount / cbt.questions.length) * 100}%` }} />
      </div>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-5 py-8 md:px-8 lg:grid-cols-[1fr_280px]">
        <div key={q.id} className="animate-fade-in">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-text-secondary">Question {index + 1} of {cbt.questions.length}</p>
            <button
              onClick={() => setFlagged((f) => (f.includes(q.id) ? f.filter((x) => x !== q.id) : [...f, q.id]))}
              className={cn("flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm", flagged.includes(q.id) ? "border-warning bg-warning-bg text-warning" : "border-border bg-surface text-text-secondary")}
            >
              <Flag className="size-3.5" />{flagged.includes(q.id) ? "Flagged" : "Flag for review"}
            </button>
          </div>
          <h2 className="text-2xl font-semibold leading-snug">{q.text}</h2>
          <div className="mt-6 space-y-3">
            {q.options.map((opt, i) => {
              const selected = answers[q.id] === i;
              return (
                <button
                  key={opt}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: i }))}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-lg border bg-surface p-4 text-left shadow-sm transition-all",
                    selected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-border-strong",
                  )}
                >
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-md font-display text-sm font-semibold", selected ? "bg-primary text-primary-foreground" : "bg-surface-subtle text-text-secondary")}>
                    {letters[i]}
                  </span>
                  <span className="text-sm md:text-base">{opt}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}><ChevronLeft className="size-4" />Previous</Button>
            {index < cbt.questions.length - 1 ? (
              <Button onClick={() => setIndex((i) => i + 1)}>Next<ChevronRight className="size-4" /></Button>
            ) : (
              <Button onClick={() => setConfirm(true)}>Finish</Button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-surface p-5 shadow-sm lg:sticky lg:top-6">
          <p className="font-semibold">Question map</p>
          <p className="mt-1 text-xs text-text-muted">{answeredCount} answered · {flagged.length} flagged</p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {cbt.questions.map((x, i) => (
              <button
                key={x.id}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative aspect-square rounded-sm border font-display text-sm font-medium transition-colors",
                  i === index && "ring-2 ring-primary ring-offset-1",
                  answers[x.id] !== undefined ? "border-ink bg-ink text-ink-foreground" : "border-border bg-surface-subtle text-text-secondary",
                )}
              >
                {i + 1}
                {flagged.includes(x.id) && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-warning" />}
              </button>
            ))}
          </div>
          <Button className="mt-5 w-full" onClick={() => setConfirm(true)}>Submit exam</Button>
        </aside>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your answers?</AlertDialogTitle>
            <AlertDialogDescription>
              You've answered {answeredCount} of {cbt.questions.length} questions.
              {answeredCount < cbt.questions.length && " Unanswered questions will be marked wrong."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <AlertDialogAction onClick={submit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
