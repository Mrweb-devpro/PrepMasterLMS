import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import type { Question } from "@/lib/mock-data";
import { cbtApi, type ResultResponse } from "../services/cbt.api";

/**
 * Real exam session: starts/resumes the attempt on the server, autosaves every
 * pick and follows the server's deadline (the on-screen timer is display only).
 */
export function useLiveAttempt(cbtId: string) {
  const [state, setState] = useState<{
    attemptId: string;
    questions: Question[];
    answers: Record<string, number>;
    deadline: number; // in local clock time
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(
    () => typeof navigator !== "undefined" && !navigator.onLine,
  );
  const started = useRef(false);
  const stateRef = useRef<typeof state>(null);
  const pendingAnswers = useRef(new Map<string, number>());
  const flushing = useRef(false);
  const onTimeUpRef = useRef<() => void>(() => {});

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const flushPendingAnswers = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.onLine ||
      !stateRef.current ||
      flushing.current
    )
      return;
    flushing.current = true;
    try {
      for (const [questionId, selectedIndex] of Array.from(pendingAnswers.current)) {
        try {
          await cbtApi.saveAnswer(stateRef.current.attemptId, questionId, selectedIndex);
          if (pendingAnswers.current.get(questionId) === selectedIndex) {
            pendingAnswers.current.delete(questionId);
          }
          setOffline(false);
        } catch (error) {
          if (error instanceof ApiError && (error.status === 403 || error.status === 409)) {
            pendingAnswers.current.clear();
            onTimeUpRef.current();
            return;
          }
          if (error instanceof ApiError && error.status === 0) {
            setOffline(true);
            return;
          }
          pendingAnswers.current.delete(questionId);
          toast.error("Answer not saved", { description: (error as Error).message });
        }
      }
    } finally {
      flushing.current = false;
    }
  }, []);

  useEffect(() => {
    if (!LIVE || started.current) return;
    started.current = true;
    cbtApi
      .start(cbtId)
      .then((r) => {
        const skew = Date.now() - new Date(r.serverNow).getTime();
        const answers: Record<string, number> = {};
        for (const a of r.answers) answers[a.question_id] = a.selected_index;
        setState({
          attemptId: r.attempt.id,
          questions: r.questions.map((q) => ({
            id: q.id,
            courseSlug: "",
            text: q.text,
            options: q.options,
            answerIndex: -1, // never sent before submitting
            topic: q.topic,
          })),
          answers,
          deadline: new Date(r.attempt.deadline).getTime() + skew,
        });
      })
      .catch((e: Error) => setError(e.message));
  }, [cbtId]);

  useEffect(() => {
    const handleOnline = () => {
      setOffline(false);
      void flushPendingAnswers();
    };
    const handleOffline = () => setOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushPendingAnswers]);

  const save = (questionId: string, index: number, onTimeUp: () => void) => {
    if (!state) return;
    onTimeUpRef.current = onTimeUp;
    pendingAnswers.current.set(questionId, index);
    void flushPendingAnswers();
  };

  const submit = (flaggedQuestionIds: string[] = []): Promise<ResultResponse> => {
    if (!state) return Promise.reject(new Error("Exam not started"));
    return cbtApi.submit(state.attemptId, flaggedQuestionIds);
  };

  return { state, error, offline, save, submit };
}
