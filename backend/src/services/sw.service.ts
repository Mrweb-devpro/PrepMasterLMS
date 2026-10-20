import { randomUUID } from "node:crypto";
import { badRequest, conflict, forbidden, must } from "../lib/errors.js";
import { downloadUrl, safeName, uploadUrl } from "../lib/r2.js";
import { db } from "../lib/supabase.js";
import type { AuthUser, SwFileRow } from "../models/types.js";

const MAX = { mass: 30, volume: 30, model: 40 };
const nameOf = (p?: { first_name: string; last_name: string } | null) => (p ? `${p.first_name} ${p.last_name}`.trim() : "");

async function requireMember(userId: string) {
  const { data } = await db.from("profiles").select("sw_registered").eq("id", userId).maybeSingle();
  if (!data?.sw_registered) throw forbidden("Join SolidWorks first.");
}

// ---------- Tasks ----------
export const listTasks = async () =>
  must(await db.from("sw_tasks").select("*").order("number", { ascending: false }));

export const getTask = async (id: string) =>
  must(await db.from("sw_tasks").select("*").eq("id", id).maybeSingle(), "Task not found.");

type TaskInput = { title: string; summary: string; description: string; steps: string[]; videoUrl?: string | undefined; thumbnailUrl?: string | undefined };
const taskRow = (t: TaskInput) => ({
  title: t.title, summary: t.summary, description: t.description, steps: t.steps,
  video_url: t.videoUrl || null, thumbnail_url: t.thumbnailUrl || null,
});

export const createTask = async (t: TaskInput) => must(await db.from("sw_tasks").insert(taskRow(t)).select().single());
export const updateTask = async (id: string, t: TaskInput) =>
  must(await db.from("sw_tasks").update(taskRow(t)).eq("id", id).select().maybeSingle(), "Task not found.");
export async function deleteTask(id: string) {
  must(await db.from("sw_tasks").delete().eq("id", id).select("id"));
  return { deleted: true };
}

// ---------- Submissions ----------
const SUB_SELECT = "*, profiles(first_name, last_name)";

/** Step 1: signed upload link for a SolidWorks file. */
export async function prepareUpload(
  userId: string,
  fileName: string,
  contentType: string,
  type: "submission" | "question" = "submission",
) {
  await requireMember(userId);
  const folder = type === "question" ? "questions" : "submissions";
  const key = `solidworks/${folder}/${userId}/${randomUUID()}-${safeName(fileName)}`;
  return { key, uploadUrl: await uploadUrl(key, contentType) };
}

export async function createSubmission(userId: string, input: {
  taskId: string; mass: string; volume: string; difficulty: string; challenge: string; files: SwFileRow[];
}) {
  await requireMember(userId);
  if (input.files.some((f) =>
    !f.r2Key.startsWith(`solidworks/submissions/${userId}/`) &&
    !f.r2Key.startsWith(`solidworks/${userId}/`),
  )) throw badRequest("Upload your files first.");
  const { data, error } = await db.from("sw_submissions").insert({
    task_id: input.taskId, user_id: userId, files: input.files, mass: input.mass, volume: input.volume,
    difficulty: input.difficulty, challenge: input.challenge,
  }).select(SUB_SELECT).single();
  if (error?.code === "23505") throw conflict("You've already submitted for this task.");
  if (error) throw badRequest(error.message);
  return withNames(data);
}

type Named = { profiles?: { first_name: string; last_name: string } | null } & Record<string, unknown>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withNames(row: any) {
  const { profiles, ...rest } = row as Named;
  return { ...rest, user_name: nameOf(profiles) };
}

export async function listSubmissions(user: AuthUser, mine: boolean) {
  let q = db.from("sw_submissions").select(SUB_SELECT).order("submitted_at", { ascending: false });
  if (mine || user.role !== "admin") q = q.eq("user_id", user.id);
  return must(await q).map(withNames);
}

/** One submission with short-lived links to each file (owner or admin only). */
export async function getSubmission(id: string, user: AuthUser) {
  const row = must<{ user_id: string; files: SwFileRow[]; profiles: { first_name: string; last_name: string } | null }>(
    await db.from("sw_submissions").select(SUB_SELECT).eq("id", id).maybeSingle(), "Submission not found.",
  );
  if (row.user_id !== user.id && user.role !== "admin") throw forbidden();
  const files = await Promise.all(row.files.map(async (f) => ({ ...f, url: await downloadUrl(f.r2Key, 900) })));
  return { ...withNames(row), files };
}

export async function gradeSubmission(id: string, g: { scores: { mass: number; volume: number; model: number }; verdict: string; remarks: string }) {
  if (g.scores.mass > MAX.mass || g.scores.volume > MAX.volume || g.scores.model > MAX.model) {
    throw badRequest("A score is above its maximum.");
  }
  return withNames(must(
    await db.from("sw_submissions").update({
      score_mass: g.scores.mass, score_volume: g.scores.volume, score_model: g.scores.model,
      verdict: g.verdict, remarks: g.remarks, graded_at: new Date().toISOString(),
    }).eq("id", id).select(SUB_SELECT).maybeSingle(),
    "Submission not found.",
  ));
}

// ---------- Questions ----------
const Q_SELECT = "*, profiles(first_name, last_name), sw_responses(id, body, created_at)";

async function attachImageUrls(row: Record<string, unknown>) {
  const imageUrls = Array.isArray(row.image_urls)
    ? row.image_urls.filter((url): url is string => typeof url === "string")
    : typeof row.image_url === "string"
      ? [row.image_url]
      : [];
  return {
    ...withNames(row),
    image_keys: imageUrls,
    image_urls: await Promise.all(
      imageUrls.map((url) => (/^https?:\/\//i.test(url) ? url : downloadUrl(url, 86_400))),
    ),
  };
}

export async function listQuestions(user: AuthUser, mine: boolean) {
  let q = db.from("sw_questions").select(Q_SELECT).order("created_at", { ascending: false });
  if (mine || user.role !== "admin") q = q.eq("user_id", user.id);
  return Promise.all(must(await q).map(attachImageUrls));
}

async function ownQuestion(id: string, user: AuthUser) {
  const row = must<{ user_id: string }>(await db.from("sw_questions").select(Q_SELECT).eq("id", id).maybeSingle(), "Question not found.");
  if (row.user_id !== user.id && user.role !== "admin") throw forbidden();
  return row;
}

export const getQuestion = async (id: string, user: AuthUser) => attachImageUrls(await ownQuestion(id, user));

function hasInvalidQuestionImagePath(imageUrls: string[], userId: string) {
  return imageUrls.some((key) => key.startsWith("solidworks/") &&
    !key.startsWith(`solidworks/questions/${userId}/`) &&
    !key.startsWith(`solidworks/${userId}/`));
}

export async function createQuestion(userId: string, q: { title: string; body: string; taskIds: string[]; imageUrls?: string[] }) {
  await requireMember(userId);
  const imageUrls = q.imageUrls ?? [];
  if (hasInvalidQuestionImagePath(imageUrls, userId)) {
    throw badRequest("Invalid image upload path.");
  }
  return attachImageUrls(must(
    await db.from("sw_questions").insert({
      user_id: userId, title: q.title, body: q.body, task_ids: q.taskIds, image_urls: imageUrls,
    }).select(Q_SELECT).single(),
  ));
}

export async function updateQuestion(id: string, user: AuthUser, q: {
  title?: string | undefined; body?: string | undefined; taskIds?: string[] | undefined; imageUrls?: string[] | undefined;
}) {
  const row = await ownQuestion(id, user);
  if (row.user_id !== user.id) throw forbidden("Only the author can edit this question.");
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (q.title !== undefined) patch.title = q.title;
  if (q.body !== undefined) patch.body = q.body;
  if (q.taskIds !== undefined) patch.task_ids = q.taskIds;
  if (q.imageUrls !== undefined) {
    if (hasInvalidQuestionImagePath(q.imageUrls, user.id)) {
      throw badRequest("Invalid image upload path.");
    }
    patch.image_urls = q.imageUrls;
  }
  return attachImageUrls(must(await db.from("sw_questions").update(patch).eq("id", id).select(Q_SELECT).single()));
}

export async function respond(id: string, adminId: string, body: string) {
  must(await db.from("sw_responses").insert({ question_id: id, body, responder_id: adminId }).select().single());
  await db.from("sw_questions").update({ updated_at: new Date().toISOString() }).eq("id", id);
  return attachImageUrls(must(await db.from("sw_questions").select(Q_SELECT).eq("id", id).single()));
}

// ---------- Members ----------
export const listMembers = async () =>
  must(await db.from("profiles").select("id, first_name, last_name, email, gender, user_type, heard, sw_joined_at")
    .eq("sw_registered", true).order("sw_joined_at", { ascending: false }));
