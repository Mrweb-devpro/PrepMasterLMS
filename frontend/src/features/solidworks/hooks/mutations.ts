import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { swService } from "../services/sw.service";
import type {
  NewQuestion,
  NewSubmission,
  NewTask,
  SwGrade,
  SwQuestion,
  SwTask,
  SwUser,
} from "../types";
import { swKeys } from "./queries";

/**
 * Optimistic helper: patch a cached list immediately, roll back + error toast on failure,
 * success toast and refetch afterwards. Keeps every mutation below to a few lines.
 */
function useOptimistic<TVars, TItem>(opts: {
  mutationFn: (v: TVars) => Promise<unknown>;
  listKey: QueryKey;
  apply?: (list: TItem[], v: TVars) => TItem[];
  success: string | ((v: TVars) => string);
  invalidate?: QueryKey[];
}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: opts.mutationFn,
    onMutate: async (v: TVars) => {
      if (!opts.apply) return { prev: undefined };
      await qc.cancelQueries({ queryKey: opts.listKey });
      const prev = qc.getQueryData<TItem[]>(opts.listKey);
      if (prev) qc.setQueryData<TItem[]>(opts.listKey, opts.apply(prev, v));
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(opts.listKey, ctx.prev);
      toast.error(e.message || "Something went wrong");
    },
    onSuccess: (_d, v) => {
      toast.success(typeof opts.success === "function" ? opts.success(v) : opts.success);
    },
    onSettled: () => {
      [opts.listKey, ...(opts.invalidate ?? [swKeys.all])].forEach((queryKey) =>
        qc.invalidateQueries({ queryKey }),
      );
    },
  });
}

// Tasks (admin)
export const useCreateTask = () =>
  useOptimistic<NewTask, SwTask>({
    mutationFn: (v) => swService.createTask(v),
    listKey: swKeys.tasks(),
    apply: (l, v) => [
      {
        ...v,
        id: "optimistic",
        number: Math.max(0, ...l.map((t) => t.number)) + 1,
        createdAt: new Date().toISOString(),
      },
      ...l,
    ],
    success: (v) => `Task “${v.title}” created`,
  });

export const useUpdateTask = () =>
  useOptimistic<{ id: string; data: NewTask }, SwTask>({
    mutationFn: ({ id, data }) => swService.updateTask(id, data),
    listKey: swKeys.tasks(),
    apply: (l, { id, data }) => l.map((t) => (t.id === id ? { ...t, ...data } : t)),
    success: "Task updated",
  });

export const useDeleteTask = () =>
  useOptimistic<SwTask, SwTask>({
    mutationFn: (t) => swService.deleteTask(t.id),
    listKey: swKeys.tasks(),
    apply: (l, t) => l.filter((x) => x.id !== t.id),
    success: (t) => `“${t.title}” deleted`,
  });

// Submissions
export const useCreateSubmission = () =>
  useOptimistic<NewSubmission, never>({
    mutationFn: (v) => swService.createSubmission(v),
    listKey: swKeys.submissions(),
    success: "Work submitted — you'll be notified when it's graded",
  });

export const useGradeSubmission = () =>
  useOptimistic<{ id: string; grade: Omit<SwGrade, "total" | "gradedAt"> }, never>({
    mutationFn: ({ id, grade }) => swService.gradeSubmission(id, grade),
    listKey: swKeys.submissions(),
    success: "Grade saved and sent to the student",
  });

// Questions
export const useAskQuestion = (userId: string) =>
  useOptimistic<NewQuestion, SwQuestion>({
    mutationFn: (v) => swService.createQuestion(v),
    listKey: swKeys.questions(userId),
    apply: (l, v) => [
      {
        ...v,
        id: "optimistic",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [],
      },
      ...l,
    ],
    success: "Question sent",
  });

export const useEditQuestion = (userId?: string) =>
  useOptimistic<{ id: string; data: Pick<NewQuestion, "title" | "body" | "taskIds"> }, SwQuestion>({
    mutationFn: ({ id, data }) => swService.updateQuestion(id, data),
    listKey: swKeys.questions(userId),
    apply: (l, { id, data }) => l.map((q) => (q.id === id ? { ...q, ...data } : q)),
    success: "Question updated",
  });

export const useRespondToQuestion = () =>
  useOptimistic<{ id: string; body: string }, SwQuestion>({
    mutationFn: ({ id, body }) => swService.respondToQuestion(id, body),
    listKey: swKeys.questions(),
    apply: (l, { id, body }) =>
      l.map((q) =>
        q.id === id
          ? {
              ...q,
              responses: [...q.responses, { id: "optimistic", body, at: new Date().toISOString() }],
            }
          : q,
      ),
    success: "Response sent",
  });

// Membership
export const useRegisterSw = () =>
  useOptimistic<Omit<SwUser, "joinedAt">, never>({
    mutationFn: (v) => swService.register(v),
    listKey: swKeys.users(),
    success: "You're registered for SolidWorks",
  });
