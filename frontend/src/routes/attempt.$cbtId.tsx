import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Lock,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/prep/bits";
import { QuestionCard } from "@/features/cbt/components/QuestionCard";
import { AnswerReview } from "@/features/cbt/components/AnswerReview";
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
import { useCatalog } from "@/features/catalog/useCatalog";
import { useLiveAttempt } from "@/features/cbt/hooks/useLiveAttempt";
import { LIVE } from "@/lib/api/config";
import { toast } from "sonner";
import { usePrep } from "@/lib/prep-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/attempt/$cbtId")({
  head: () => ({
    meta: [
      { title: "Exam in progress | PrepMaster" },
      { name: "description", content: "Answer questions, flag for review and submit your CBT." },
      { property: "og:title", content: "Exam in progress | PrepMaster" },
      {
        property: "og:description",
        content: "Answer questions, flag for review and submit your CBT.",
      },
    ],
  }),
  component: AttemptPage,
});

const letters = ["A", "B", "C", "D", "E"];

function AttemptPage() {
  const { cbtId } = Route.useParams();
  const prep = usePrep();
  const navigate = useNavigate();
  const { getCbt, getCourse, loading } = useCatalog();
  const cbt = getCbt(cbtId);
  const live = useLiveAttempt(cbtId);
  const [submitting, setSubmitting] = useState(false);
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

  // LIVE: restore saved answers and follow the server deadline.
  useEffect(() => {
    if (!live.state) return;
    setAnswers(live.state.answers);
    const tick = () =>
      setSecondsLeft(Math.max(0, Math.round((live.state!.deadline - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [live.state]);

  const liveSubmit = () => {
    if (submitting) return;
    setSubmitting(true);
    live
      .submit(flagged)
      .then((r) => {
        prep.completeAttempt(cbtId);
        if (r.autoSubmitted) toast.info("Time was up — your saved answers were submitted.");
        navigate({ to: "/attempts/$attemptId", params: { attemptId: r.attemptId }, replace: true });
      })
      .catch((e: Error) => {
        setSubmitting(false);
        toast.error("Couldn't submit", { description: e.message });
      });
  };

  // Auto-submit when the clock hits zero.
  useEffect(() => {
    if (LIVE && live.state && secondsLeft === 0) liveSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, live.state]);

  if (LIVE && (loading || (!live.state && !live.error)))
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-text-muted">
        {submitting ? "Submitting…" : "Loading exam…"}
      </div>
    );
  if (LIVE && live.error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-md">
          <Lock className="mx-auto size-8 text-text-muted" />
          <p className="mt-3 font-semibold">Can't start this CBT</p>
          <p className="mt-1 text-sm text-text-secondary">{live.error}</p>
          <Button className="mt-5" asChild>
            <Link to="/cbts/$cbtId" params={{ cbtId }}>Back</Link>
          </Button>
        </div>
      </div>
    );

  if (!cbt)
    return (
      <div className="p-10">
        <EmptyState title="CBT not found" />
      </div>
    );
  if (!LIVE && cbt.paid && !prep.ownsCbt(cbt.id)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-sm rounded-lg border border-border bg-surface p-8 text-center shadow-md">
          <Lock className="mx-auto size-8 text-gold" />
          <h1 className="mt-3 text-xl font-semibold">Unlock required</h1>
          <p className="mt-1 text-sm text-text-secondary">Purchase this CBT before starting it.</p>
          <Button className="mt-5" asChild>
            <Link to="/cbts/$cbtId" params={{ cbtId: cbt.id }}>
              Go to CBT
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const course = getCourse(cbt.courseSlug);
  const questions = LIVE && live.state ? live.state.questions : cbt.questions;
  const q = questions[index]!;
  const answeredCount = Object.keys(answers).length;
  const correct = questions.filter((x) => answers[x.id] === x.answerIndex).length;
  const score = Math.round((correct / questions.length) * 100);
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const submit = () => {
    if (LIVE) return liveSubmit();
    setSubmitted(true);
    prep.completeAttempt(cbt.id);
    prep.saveAttempt({ cbtId: cbt.id, answers, correct, total: questions.length });
  };

  if (submitted) {
    const hidden = cbt.revealResults === false;
    return (
      <div className="min-h-screen bg-background px-5 py-10">
        <div className="mx-auto max-w-3xl animate-fade-in">
          <div className="relative overflow-hidden rounded-xl bg-ink-gradient p-8 text-center text-ink-foreground shadow-lg">
            <div className="dot-grid absolute inset-0 opacity-50" />
            <div className="relative">
              <p className="text-sm text-ink-muted">
                {course?.code} · {cbt.title}
              </p>
              {hidden ? (
                <>
                  <h1 className="mt-3 text-3xl font-semibold">Submitted successfully</h1>
                  <p className="mt-2 text-sm text-ink-muted">
                    Your instructor will release results soon.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-4 font-display text-7xl font-semibold">{score}%</p>
                  <p className="mt-2 text-sm text-ink-muted">
                    {correct} of {questions.length} correct
                  </p>
                </>
              )}
              <div className="mt-6 flex justify-center gap-2">
                <Button asChild variant="secondary">
                  <Link to="/cbts">Back to CBTs</Link>
                </Button>
                <Button asChild>
                  <Link to="/attempts">My attempts</Link>
                </Button>
              </div>
            </div>
          </div>
          {!hidden && (
            <div className="mt-8">
              <AnswerReview questions={questions} answers={answers} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4 md:px-8">
        <button
          onClick={() => navigate({ to: "/cbts" })}
          className="rounded-md p-1.5 text-text-muted hover:bg-surface-hover hover:text-foreground"
          aria-label="Exit"
        >
          <X className="size-5" />
        </button>
        <div className="min-w-0">
          <p className="text-2xs text-text-muted">{course?.code}</p>
          <p className="truncate font-display font-semibold">{cbt.title}</p>
        </div>
        <div
          className={cn(
            "ml-auto flex items-center gap-2 rounded-full px-3 py-1 font-display text-base font-semibold tabular-nums",
            secondsLeft < 60 ? "bg-error-bg text-error" : "bg-surface-subtle",
          )}
        >
          <Clock3 className="size-4" />
          {mm}:{ss}
        </div>
      </header>
      <div className="h-1 bg-border">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${(answeredCount / questions.length) * 100}%` }}
        />
      </div>

      <div className="mx-auto grid w-full max-w-5xl flex-1 gap-8 px-4 py-8 sm:px-6 md:py-12 lg:grid-cols-[1fr_240px]">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-2 flex justify-end">
            <button
              onClick={() =>
                setFlagged((f) => (f.includes(q.id) ? f.filter((x) => x !== q.id) : [...f, q.id]))
              }
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs",
                flagged.includes(q.id)
                  ? "bg-warning-bg text-warning"
                  : "text-text-muted hover:bg-surface-hover",
              )}
              aria-label="Flag question"
            >
              <Flag className="size-3.5" />
              {flagged.includes(q.id) ? "Flagged" : "Flag"}
            </button>
          </div>
          <QuestionCard
            key={q.id}
            question={q}
            index={index}
            total={questions.length}
            selected={answers[q.id]}
            onSelect={(i) => {
              setAnswers((a) => ({ ...a, [q.id]: i }));
              if (LIVE) live.save(q.id, i, liveSubmit);
            }}
          />
          <div className="mt-8 flex justify-between">
            <Button variant="ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              <ChevronLeft />
              Back
            </Button>
            {index < questions.length - 1 ? (
              <Button onClick={() => setIndex((i) => i + 1)}>
                Next
                <ChevronRight />
              </Button>
            ) : (
              <Button onClick={() => setConfirm(true)}>Finish</Button>
            )}
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-border bg-surface p-4 shadow-sm lg:sticky lg:top-6">
          <p className="text-xs text-text-muted">
            {answeredCount}/{questions.length} answered
          </p>
          <div className="mt-3 grid grid-cols-6 gap-1.5 lg:grid-cols-5">
            {questions.map((x, i) => (
              <button
                key={x.id}
                onClick={() => setIndex(i)}
                className={cn(
                  "relative aspect-square rounded-sm text-xs font-medium tabular-nums transition-colors",
                  i === index && "ring-2 ring-primary ring-offset-1 ring-offset-surface",
                  answers[x.id] !== undefined
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-subtle text-text-secondary hover:bg-surface-hover",
                )}
              >
                {i + 1}
                {flagged.includes(x.id) && (
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-warning" />
                )}
              </button>
            ))}
          </div>
          <Button variant="outline" className="mt-4 w-full" onClick={() => setConfirm(true)}>
            Submit
          </Button>
        </aside>
      </div>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit your answers?</AlertDialogTitle>
            <AlertDialogDescription>
              You've answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length &&
                " Unanswered questions will be marked wrong."}
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
