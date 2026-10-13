// SolidWorks service — the only layer that touches data. Uses the real API
// when the backend is configured (LIVE), otherwise the in-memory dummy data.
import { LIVE } from "@/lib/api/config";
import { clone, delay, nowIso, uid } from "@/lib/mock-api";
import { MAX_SCORES } from "../constants";
import type { NewQuestion, NewSubmission, NewTask, SwGrade, SwQuestion, SwUser } from "../types";
import { db } from "./mock-db";
import { swApi } from "./sw.api";

const notFound = (what: string) => new Error(`${what} not found`);
const byNewest = <T extends { createdAt?: string; submittedAt?: string }>(a: T, b: T) =>
  (b.createdAt ?? b.submittedAt ?? "").localeCompare(a.createdAt ?? a.submittedAt ?? "");

const mockSwService = {
  // Tasks
  async listTasks() {
    await delay();
    return clone([...db.tasks].sort(byNewest));
  },
  async getTask(id: string) {
    await delay(200);
    const t = db.tasks.find((x) => x.id === id);
    if (!t) throw notFound("Task");
    return clone(t);
  },
  async createTask(input: NewTask) {
    await delay();
    const number = Math.max(0, ...db.tasks.map((x) => x.number)) + 1;
    const t = { ...input, id: uid("task"), number, createdAt: nowIso() };
    db.tasks.unshift(t);
    return clone(t);
  },
  async updateTask(id: string, input: NewTask) {
    await delay();
    const t = db.tasks.find((x) => x.id === id);
    if (!t) throw notFound("Task");
    Object.assign(t, input);
    return clone(t);
  },
  async deleteTask(id: string) {
    await delay();
    db.tasks = db.tasks.filter((x) => x.id !== id);
  },

  // Submissions
  async listSubmissions(userId?: string) {
    await delay();
    return clone(db.submissions.filter((s) => !userId || s.userId === userId).sort(byNewest));
  },
  async getSubmission(id: string) {
    await delay(200);
    const s = db.submissions.find((x) => x.id === id);
    if (!s) throw notFound("Submission");
    return clone(s);
  },
  async createSubmission(input: NewSubmission) {
    await delay(700);
    if (db.submissions.some((s) => s.taskId === input.taskId && s.userId === input.userId)) {
      throw new Error("You've already submitted for this task");
    }
    const s = { ...input, id: uid("sub"), submittedAt: nowIso() };
    db.submissions.unshift(s);
    return clone(s);
  },
  async gradeSubmission(id: string, grade: Omit<SwGrade, "total" | "gradedAt">) {
    await delay();
    const s = db.submissions.find((x) => x.id === id);
    if (!s) throw notFound("Submission");
    const { mass, volume, model } = grade.scores;
    if (mass > MAX_SCORES.mass || volume > MAX_SCORES.volume || model > MAX_SCORES.model)
      throw new Error("A score is above its maximum");
    s.grade = { ...grade, total: mass + volume + model, gradedAt: nowIso() };
    return clone(s);
  },

  // Questions
  async listQuestions(userId?: string) {
    await delay();
    return clone(db.questions.filter((q) => !userId || q.userId === userId).sort(byNewest));
  },
  async getQuestion(id: string) {
    await delay(200);
    const q = db.questions.find((x) => x.id === id);
    if (!q) throw notFound("Question");
    return clone(q);
  },
  async createQuestion(input: NewQuestion) {
    await delay();
    const q: SwQuestion = { ...input, id: uid("q"), createdAt: nowIso(), updatedAt: nowIso(), responses: [] };
    db.questions.unshift(q);
    return clone(q);
  },
  async updateQuestion(id: string, patch: Pick<NewQuestion, "title" | "body" | "taskIds">) {
    await delay();
    const q = db.questions.find((x) => x.id === id);
    if (!q) throw notFound("Question");
    Object.assign(q, patch, { updatedAt: nowIso() });
    return clone(q);
  },
  async respondToQuestion(id: string, body: string) {
    await delay();
    const q = db.questions.find((x) => x.id === id);
    if (!q) throw notFound("Question");
    q.responses.push({ id: uid("r"), body, at: nowIso() });
    return clone(q);
  },

  // SolidWorks members (reference list)
  async listUsers() {
    await delay();
    return clone([...db.users].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)));
  },
  async register(user: Omit<SwUser, "joinedAt">) {
    await delay(500);
    if (!db.users.some((u) => u.userId === user.userId))
      db.users.unshift({ ...user, joinedAt: nowIso() });
  },
};

export const swService: typeof mockSwService = LIVE ? swApi : mockSwService;
