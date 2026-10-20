// Real API calls for SolidWorks + mapping API rows to the app's types.
import { api, uploadToSignedUrl } from "@/lib/api/client";
import type {
  NewQuestion,
  NewSubmission,
  NewTask,
  QuestionUpdate,
  SwGrade,
  SwQuestion,
  SwSubmission,
  SwTask,
  SwUser,
} from "../types";

interface TaskRow {
  id: string;
  number: number;
  title: string;
  summary: string;
  description: string;
  steps: string[];
  video_url: string | null;
  thumbnail_url: string | null;
  created_at: string;
}
interface SubRow {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  files: { name: string; size: number; mime?: string; url?: string }[];
  mass: string;
  volume: string;
  difficulty: SwSubmission["difficulty"];
  challenge: string;
  score_mass: number | null;
  score_volume: number | null;
  score_model: number | null;
  verdict: SwGrade["verdict"] | null;
  remarks: string | null;
  graded_at: string | null;
  submitted_at: string;
}
interface QuestionRow {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  body: string;
  task_ids: string[];
  image_urls: string[] | null;
  image_keys?: string[] | null;
  created_at: string;
  updated_at: string;
  sw_responses: { id: string; body: string; created_at: string }[];
}
interface MemberRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: SwUser["gender"] | null;
  user_type: SwUser["userType"] | null;
  heard: string | null;
  sw_joined_at: string | null;
}

const toTask = (t: TaskRow): SwTask => ({
  id: t.id,
  number: t.number,
  title: t.title,
  summary: t.summary,
  description: t.description,
  steps: t.steps,
  createdAt: t.created_at,
  ...(t.video_url ? { videoUrl: t.video_url } : {}),
  ...(t.thumbnail_url ? { thumbnailUrl: t.thumbnail_url } : {}),
});

const toSubmission = (s: SubRow): SwSubmission => ({
  id: s.id,
  taskId: s.task_id,
  userId: s.user_id,
  userName: s.user_name,
  files: s.files.map((f) => ({
    name: f.name,
    size: f.size,
    ...(f.mime ? { mime: f.mime } : {}),
    ...(f.url ? { url: f.url } : {}),
  })),
  mass: s.mass,
  volume: s.volume,
  difficulty: s.difficulty,
  challenge: s.challenge,
  submittedAt: s.submitted_at,
  ...(s.verdict && s.graded_at
    ? {
        grade: {
          scores: { mass: s.score_mass ?? 0, volume: s.score_volume ?? 0, model: s.score_model ?? 0 },
          total: (s.score_mass ?? 0) + (s.score_volume ?? 0) + (s.score_model ?? 0),
          verdict: s.verdict,
          remarks: s.remarks ?? "",
          gradedAt: s.graded_at,
        },
      }
    : {}),
});

const toQuestion = (q: QuestionRow): SwQuestion => ({
  id: q.id,
  userId: q.user_id,
  userName: q.user_name,
  title: q.title,
  body: q.body,
  taskIds: q.task_ids,
  imageUrls: q.image_urls ?? [],
  ...(q.image_keys ? { imageKeys: q.image_keys } : {}),
  createdAt: q.created_at,
  updatedAt: q.updated_at,
  responses: [...(q.sw_responses ?? [])]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((r) => ({ id: r.id, body: r.body, at: r.created_at })),
});

const taskBody = (t: NewTask) => ({
  title: t.title,
  summary: t.summary,
  description: t.description,
  steps: t.steps,
  videoUrl: t.videoUrl ?? "",
  thumbnailUrl: t.thumbnailUrl ?? "",
});

/** userId given = "only mine" (students); admins list everything without it. */
const mine = (userId?: string) => (userId ? "?mine=true" : "");

async function uploadQuestionImage(file: File) {
  if (!new Set(["image/png", "image/jpeg", "image/webp"]).has(file.type)) {
    throw new Error("Attach a PNG, JPG, or WebP image");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("The screenshot must be 5 MB or smaller");
  }
  const { key, uploadUrl } = await api.post<{ key: string; uploadUrl: string }>("/solidworks/uploads", {
    fileName: file.name || "question-screenshot.png",
    contentType: file.type,
  });
  await uploadToSignedUrl(uploadUrl, file);
  return key;
}

export const swApi = {
  listTasks: async () => (await api.get<TaskRow[]>("/solidworks/tasks")).map(toTask),
  getTask: async (id: string) => toTask(await api.get<TaskRow>(`/solidworks/tasks/${id}`)),
  createTask: async (t: NewTask) => toTask(await api.post<TaskRow>("/solidworks/tasks", taskBody(t))),
  updateTask: async (id: string, t: NewTask) =>
    toTask(await api.put<TaskRow>(`/solidworks/tasks/${id}`, taskBody(t))),
  deleteTask: async (id: string) => {
    await api.delete(`/solidworks/tasks/${id}`);
  },

  listSubmissions: async (userId?: string) =>
    (await api.get<SubRow[]>(`/solidworks/submissions${mine(userId)}`)).map(toSubmission),
  getSubmission: async (id: string) => toSubmission(await api.get<SubRow>(`/solidworks/submissions/${id}`)),
  /** Uploads each picked file to storage first, then saves the submission. */
  async createSubmission(input: NewSubmission) {
    const files = await Promise.all(
      input.files.map(async (f) => {
        if (!f.file) throw new Error(`Pick ${f.name} again before submitting`);
        const contentType = f.file.type || "application/octet-stream";
        const { key, uploadUrl } = await api.post<{ key: string; uploadUrl: string }>(
          "/solidworks/uploads",
          { fileName: f.name, contentType },
        );
        await uploadToSignedUrl(uploadUrl, f.file);
        return { name: f.name, size: f.size, mime: contentType, r2Key: key };
      }),
    );
    return toSubmission(
      await api.post<SubRow>("/solidworks/submissions", {
        taskId: input.taskId,
        mass: input.mass,
        volume: input.volume,
        difficulty: input.difficulty,
        challenge: input.challenge,
        files,
      }),
    );
  },
  gradeSubmission: async (id: string, g: Omit<SwGrade, "total" | "gradedAt">) =>
    toSubmission(await api.post<SubRow>(`/solidworks/submissions/${id}/grade`, g)),

  listQuestions: async (userId?: string) =>
    (await api.get<QuestionRow[]>(`/solidworks/questions${mine(userId)}`)).map(toQuestion),
  getQuestion: async (id: string) => toQuestion(await api.get<QuestionRow>(`/solidworks/questions/${id}`)),
  async createQuestion(q: NewQuestion) {
    const imageUrls = q.imageFiles
      ? await Promise.all(q.imageFiles.map(uploadQuestionImage))
      : q.imageUrls ?? [];
    return toQuestion(await api.post<QuestionRow>("/solidworks/questions", {
      title: q.title,
      body: q.body,
      taskIds: q.taskIds,
      imageUrls,
    }));
  },
  async updateQuestion(id: string, p: QuestionUpdate) {
    const uploadedKeys = p.imageFiles ? await Promise.all(p.imageFiles.map(uploadQuestionImage)) : [];
    const imageUrls = p.imageUrls === undefined && p.imageFiles === undefined
      ? undefined
      : [...(p.imageKeys ?? p.imageUrls ?? []), ...uploadedKeys];
    return toQuestion(await api.patch<QuestionRow>(`/solidworks/questions/${id}`, {
      title: p.title,
      body: p.body,
      taskIds: p.taskIds,
      ...(imageUrls !== undefined ? { imageUrls } : {}),
    }));
  },
  respondToQuestion: async (id: string, body: string) =>
    toQuestion(await api.post<QuestionRow>(`/solidworks/questions/${id}/responses`, { body })),

  listUsers: async (): Promise<SwUser[]> =>
    (await api.get<MemberRow[]>("/solidworks/members")).map((m) => ({
      userId: m.id,
      name: `${m.first_name} ${m.last_name}`.trim(),
      email: m.email,
      userType: m.user_type ?? "student",
      ...(m.gender ? { gender: m.gender } : {}),
      joinedAt: m.sw_joined_at ?? "",
      ...(m.heard ? { heard: m.heard } : {}),
    })),
  register: async (u: Omit<SwUser, "joinedAt">) => {
    await api.post("/me/solidworks", { userType: u.userType, heard: u.heard ?? null });
  },
};
