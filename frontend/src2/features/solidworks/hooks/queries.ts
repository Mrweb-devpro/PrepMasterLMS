import { queryOptions } from "@tanstack/react-query";
import { swService } from "../services/sw.service";

/** Query keys + fetchers in one place so every page and mutation agrees on them. */
export const swKeys = {
  all: ["sw"] as const,
  tasks: () => [...swKeys.all, "tasks"] as const,
  task: (id: string) => [...swKeys.all, "task", id] as const,
  submissions: (userId?: string) => [...swKeys.all, "submissions", userId ?? "all"] as const,
  submission: (id: string) => [...swKeys.all, "submission", id] as const,
  questions: (userId?: string) => [...swKeys.all, "questions", userId ?? "all"] as const,
  question: (id: string) => [...swKeys.all, "question", id] as const,
  users: () => [...swKeys.all, "users"] as const,
};

export const swQueries = {
  tasks: () => queryOptions({ queryKey: swKeys.tasks(), queryFn: () => swService.listTasks() }),
  task: (id: string) =>
    queryOptions({ queryKey: swKeys.task(id), queryFn: () => swService.getTask(id) }),
  submissions: (userId?: string) =>
    queryOptions({
      queryKey: swKeys.submissions(userId),
      queryFn: () => swService.listSubmissions(userId),
    }),
  submission: (id: string) =>
    queryOptions({ queryKey: swKeys.submission(id), queryFn: () => swService.getSubmission(id) }),
  questions: (userId?: string) =>
    queryOptions({
      queryKey: swKeys.questions(userId),
      queryFn: () => swService.listQuestions(userId),
    }),
  question: (id: string) =>
    queryOptions({ queryKey: swKeys.question(id), queryFn: () => swService.getQuestion(id) }),
  users: () => queryOptions({ queryKey: swKeys.users(), queryFn: () => swService.listUsers() }),
};
