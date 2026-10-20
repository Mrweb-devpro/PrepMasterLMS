import { useEffect, useRef, useState } from "react";
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
  const started = useRef(false);

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

  const save = (questionId: string, index: number, onTimeUp: () => void) => {
    if (!state) return;
    cbtApi.saveAnswer(state.attemptId, questionId, index).catch((e: Error) => {
      if (e instanceof ApiError && e.status === 409) onTimeUp();
      else toast.error("Answer not saved — check your connection", { description: e.message });
    });
  };

  const submit = (flaggedQuestionIds: string[] = []): Promise<ResultResponse> => {
    if (!state) return Promise.reject(new Error("Exam not started"));
    return cbtApi.submit(state.attemptId, flaggedQuestionIds);
  };

  return { state, error, save, submit };
}
