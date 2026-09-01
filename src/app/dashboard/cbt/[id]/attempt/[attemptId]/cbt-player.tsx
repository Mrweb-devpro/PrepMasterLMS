"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Flag,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { submitAttempt, saveProgress } from "./actions";

export type QuestionData = {
  id: string;
  text: string;
  options: string[] | Record<string, string>;
  topic?: string | null;
};

const OPTION_KEYS = ["A", "B", "C", "D", "E"];

function getOptions(q: QuestionData): { key: string; value: string }[] {
  if (Array.isArray(q.options)) {
    return q.options.map((value, i) => ({
      key: OPTION_KEYS[i] ?? String(i + 1),
      value,
    }));
  }
  return Object.entries(q.options).map(([key, value]) => ({ key, value }));
}

function formatTime(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function CbtPlayer({
  exam,
  attemptId,
  attempt,
  questions,
}: {
  exam: { id: string; title: string; durationMinutes: number; showExplanations: boolean };
  attemptId: string;
  attempt: { startedAt: string; answers: Record<string, string>; flagged: string[] };
  questions: QuestionData[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(attempt.answers ?? {});
  const [flagged, setFlagged] = useState<string[]>(attempt.flagged ?? []);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const answersRef = useRef(answers);
  const flaggedRef = useRef(flagged);
  const timeLeftRef = useRef(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    flaggedRef.current = flagged;
  }, [flagged]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  const totalSeconds = exam.durationMinutes * 60;
  const startedAt = useMemo(() => {
    if (attempt.startedAt) return new Date(attempt.startedAt).getTime();
    return Date.now();
  }, [attempt.startedAt]);

  const handleSubmitNow = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    const elapsed = Math.max(
      0,
      Math.round(totalSeconds - Math.max(0, timeLeftRef.current))
    );
    const result = await submitAttempt({
      attemptId,
      answers: answersRef.current,
      flagged: flaggedRef.current,
      durationSeconds: elapsed,
    });
    submittingRef.current = false;
    setSubmitting(false);
    if (result.error) {
      setSubmitError(result.error);
      return;
    }
    localStorage.removeItem(`prepmaster:attempt:${attemptId}`);
    router.push(`/dashboard/cbt/${exam.id}/result/${attemptId}`);
    router.refresh();
  }, [attemptId, exam.id, router, totalSeconds]);

  // Initialize timer from elapsed time since the attempt started
  useEffect(() => {
    const elapsed = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
    setTimeLeft(Math.max(0, totalSeconds - elapsed));
  }, [startedAt, totalSeconds]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmitNow();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [handleSubmitNow]);

  // Persist to localStorage as a backup (reconnect support)
  useEffect(() => {
    const key = `prepmaster:attempt:${attemptId}`;
    localStorage.setItem(
      key,
      JSON.stringify({ current, answers, flagged, timeLeft })
    );
  }, [current, answers, flagged, timeLeft, attemptId]);

  // Debounced real-time persistence to the server
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProgress({ attemptId, answers, flagged }).catch(() => {});
    }, 800);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [attemptId, answers, flagged]);

  // Real-time answer sync across tabs / proctor view
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`attempt:${attemptId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "attempts",
          filter: `id=eq.${attemptId}`,
        },
        (payload) => {
          const row = payload.new as {
            answers?: Record<string, string>;
            flagged?: string[];
          };
          if (row.answers) setAnswers((prev) => ({ ...prev, ...row.answers! }));
          if (Array.isArray(row.flagged)) setFlagged(row.flagged);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [attemptId]);

  const question = questions[current];
  const options = question ? getOptions(question) : [];
  const answeredCount = questions.filter((q) => answers[q.id]).length;

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-muted-foreground">This exam has no questions.</p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push("/dashboard/practice")}
        >
          Back to practice
        </Button>
      </div>
    );
  }

  const paletteStatus = (index: number) => {
    const q = questions[index];
    if (answers[q.id]) return "answered";
    if (flagged.includes(q.id)) return "flagged";
    return "unanswered";
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 py-6 lg:flex-row">
      {/* Question panel */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">{exam.title}</h1>
          <div
            className="flex items-center gap-2 rounded-lg border-2 border-destructive px-3 py-1.5 font-mono text-lg font-bold text-destructive"
            data-testid="timer"
          >
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="rounded-xl bg-[#E4EFF9] p-5 dark:bg-accent/30">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold">
                Question {current + 1} of {questions.length}
              </span>
              {question.topic && (
                <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {question.topic}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {answers[question.id] ? (
                <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Answered
                </span>
              ) : (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Not answered
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  flagged.includes(question.id) && "text-primary"
                )}
                onClick={() =>
                  setFlagged((f) =>
                    f.includes(question.id)
                      ? f.filter((x) => x !== question.id)
                      : [...f, question.id]
                  )
                }
              >
                <Flag
                  className={cn(
                    "mr-1 h-4 w-4",
                    flagged.includes(question.id) && "fill-primary text-primary"
                  )}
                />
                Flag
              </Button>
            </div>
          </div>

          <p className="text-lg font-medium leading-relaxed">{question.text}</p>

          <div className="mt-6 space-y-3">
            {options.map((opt) => {
              const selected = answers[question.id] === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    setAnswers((a) => ({ ...a, [question.id]: opt.key }))
                  }
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border-2 bg-card p-3 text-left transition-all",
                    selected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-transparent hover:border-primary/30"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm font-bold",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {opt.key}
                  </span>
                  <span className="pt-0.5 text-sm leading-relaxed">
                    {opt.value}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={current === 0}
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            Previous
          </Button>
          {current < questions.length - 1 ? (
            <Button
              onClick={() =>
                setCurrent((c) => Math.min(questions.length - 1, c + 1))
              }
            >
              Save &amp; Next
            </Button>
          ) : (
            <Button variant="default" onClick={() => setShowConfirm(true)}>
              Submit exam
            </Button>
          )}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Save className="h-3.5 w-3.5" />
          Your answers are saved automatically as you go.
        </p>
      </div>

      {/* Palette sidebar */}
      <aside className="shrink-0 lg:w-64 lg:border-l lg:pl-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Summary</h3>
        <div className="mt-3 grid grid-cols-5 gap-1.5 lg:grid-cols-4">
          {questions.map((q, i) => (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold transition-colors",
                i === current
                  ? "outline outline-2 outline-offset-1 outline-primary"
                  : "",
                paletteStatus(i) === "answered" &&
                  "bg-primary text-primary-foreground",
                paletteStatus(i) === "flagged" &&
                  "bg-amber-400/90 text-amber-950",
                paletteStatus(i) === "unanswered" &&
                  i !== current &&
                  "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-primary" /> Answered
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-amber-400" /> Flagged
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-muted" /> Unanswered
          </div>
        </div>

        <Button className="mt-4 w-full" onClick={() => setShowConfirm(true)}>
          Submit exam
        </Button>
      </aside>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Submit exam?
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              You have answered {answeredCount} of {questions.length} questions.
              {questions.length - answeredCount > 0 && (
                <span className="mt-1 block font-medium text-destructive">
                  {questions.length - answeredCount} unanswered question
                  {questions.length - answeredCount > 1 ? "s" : ""}. You can no
                  longer change your answers after submitting.
                </span>
              )}
            </p>
            {submitError && (
              <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {submitError}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Keep working
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmitNow}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit now"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
