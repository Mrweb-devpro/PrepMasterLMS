// Real exam engine calls. The server owns the clock and the answer key.
import { api } from "@/lib/api/client";
import type { Question } from "@/lib/mock-data";

interface AttemptRow {
  id: string;
  cbt_id: string;
  started_at: string;
  deadline: string;
  submitted_at: string | null;
  status: "in_progress" | "submitted" | "expired";
  score: number | null;
  total: number | null;
  answered?: number;
}

export interface StartResponse {
  attempt: AttemptRow;
  serverNow: string;
  questions: { id: string; position: number; text: string; options: string[]; topic: string }[];
  answers: { question_id: string; selected_index: number }[];
}

export interface ResultResponse {
  attemptId: string;
  cbtId: string;
  status: AttemptRow["status"];
  revealed: boolean;
  score: number | null;
  total: number | null;
  startedAt: string;
  deadline: string;
  submittedAt: string | null;
  autoSubmitted: boolean;
  questions: {
    id: string;
    text: string;
    options: string[];
    answer_index: number;
    topic: string;
    selected_index: number | null;
  }[];
}

/** A finished (or in-progress) attempt in the app's shape. */
export interface AttemptSummary {
  id: string;
  cbtId: string;
  status: AttemptRow["status"];
  correct: number | null;
  total: number;
  answered: number;
  startedAt: string;
  submittedAt: string | null;
}

export const toSummary = (a: AttemptRow): AttemptSummary => ({
  id: a.id,
  cbtId: a.cbt_id,
  status: a.status,
  correct: a.score,
  total: a.total ?? 0,
  answered: a.answered ?? 0,
  startedAt: a.started_at,
  submittedAt: a.submitted_at,
});

/** Result -> the question/answer shapes AnswerReview expects. */
export function toReview(r: ResultResponse) {
  const questions: Question[] = r.questions.map((q) => ({
    id: q.id,
    courseSlug: "",
    text: q.text,
    options: q.options,
    answerIndex: q.answer_index,
    topic: q.topic,
  }));
  const answers: Record<string, number> = {};
  for (const q of r.questions) if (q.selected_index !== null) answers[q.id] = q.selected_index;
  return { questions, answers };
}

export const cbtApi = {
  start: (cbtId: string) => api.post<StartResponse>(`/cbts/${cbtId}/start`),
  saveAnswer: (attemptId: string, questionId: string, selectedIndex: number) =>
    api.put<{ saved: boolean; serverNow: string }>(`/attempts/${attemptId}/answers`, {
      questionId,
      selectedIndex,
    }),
  submit: (attemptId: string) => api.post<ResultResponse>(`/attempts/${attemptId}/submit`),
  result: (attemptId: string) => api.get<ResultResponse>(`/attempts/${attemptId}/result`),
  mine: async () => (await api.get<AttemptRow[]>("/attempts")).map(toSummary),
};
