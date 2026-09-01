"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/session";

export async function updateLevel(input: {
  id: string;
  is_active?: boolean;
  registration_type?: "free" | "paid";
  registration_price?: number | null;
  telegram_invite_link?: string | null;
}) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();

  const update = {
    is_active: input.is_active,
    registration_type: input.registration_type,
    registration_price: input.registration_price,
    telegram_invite_link: input.telegram_invite_link,
  };

  const { error } = await supabase.from("levels").update(update).eq("id", input.id);
  if (error) return { error: error.message };
  revalidatePath("/admin/levels");
  revalidatePath("/register");
  return { ok: true };
}

export async function createSubject(name: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("subjects")
    .insert({ name: name.trim() })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/subjects");
  return { ok: true };
}

export async function toggleSubject(id: string, isActive: boolean) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("subjects")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/subjects");
  return { ok: true };
}

export async function createCourse(input: {
  code: string;
  name: string;
  track_id: string;
  level_id: string;
  faculty_id?: string | null;
  department_id?: string | null;
  semester_id?: string | null;
}) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .insert({
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      track_id: input.track_id,
      level_id: input.level_id,
      faculty_id: input.faculty_id || null,
      department_id: input.department_id || null,
      semester_id: input.semester_id || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return { ok: true };
}

export async function toggleCourse(id: string, isActive: boolean) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("courses")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return { ok: true };
}

export async function createQuestionBank(input: {
  name: string;
  subject_id?: string | null;
  course_id?: string | null;
}) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("question_banks")
    .insert({
      name: input.name.trim(),
      subject_id: input.subject_id || null,
      course_id: input.course_id || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/question-banks");
  return { bankId: data.id };
}

export async function createQuestion(input: {
  text: string;
  options: string[];
  correct_answer: string;
  explanation?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  subject_id?: string | null;
  course_id?: string | null;
  is_premium?: boolean;
}) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .insert({
      text: input.text,
      options: input.options,
      correct_answer: input.correct_answer,
      explanation: input.explanation || null,
      topic: input.topic || null,
      difficulty: input.difficulty || null,
      subject_id: input.subject_id || null,
      course_id: input.course_id || null,
      is_premium: !!input.is_premium,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/question-banks");
  return { questionId: data.id };
}

export async function addQuestionToBank(
  bankId: string,
  questionId: string,
  topic?: string | null
) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase.from("bank_questions").insert({
    bank_id: bankId,
    question_id: questionId,
    topic: topic || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/question-banks");
  revalidatePath(`/admin/question-banks/${bankId}`);
  return { ok: true };
}

export async function removeQuestionFromBank(bankId: string, questionId: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("bank_questions")
    .delete()
    .eq("bank_id", bankId)
    .eq("question_id", questionId);
  if (error) return { error: error.message };
  revalidatePath("/admin/question-banks");
  revalidatePath(`/admin/question-banks/${bankId}`);
  return { ok: true };
}

type CreateExamInput = {
  title: string;
  type: string;
  tag: string;
  subject_id?: string | null;
  course_id?: string | null;
  duration_minutes: number;
  review_enabled: boolean;
  re_attempts_enabled: boolean;
  show_explanations: boolean;
  free: boolean;
  is_premium: boolean;
  price?: number | null;
  year?: number | null;
  status?: "draft" | "scheduled" | "live" | "paused" | "ended";
  schedule_start?: string | null;
  schedule_end?: string | null;
};

export async function createExam(input: CreateExamInput) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exams")
    .insert({
      title: input.title.trim(),
      type: input.type as never,
      tag: input.tag as never,
      subject_id: input.subject_id || null,
      course_id: input.course_id || null,
      duration_minutes: input.duration_minutes,
      question_count: 0,
      review_enabled: input.review_enabled,
      re_attempts_enabled: input.re_attempts_enabled,
      show_explanations: input.show_explanations,
      free: input.free,
      is_premium: input.is_premium,
      price: input.price ?? null,
      year: input.year ?? null,
      status: (input.status ?? "draft") as never,
      schedule_start: input.schedule_start || null,
      schedule_end: input.schedule_end || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/admin/exams");
  return { examId: data.id };
}

export async function updateExamStatus(id: string, status: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("exams")
    .update({ status: status as never })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/exams");
  revalidatePath("/dashboard/practice");
  return { ok: true };
}
export async function createFaculty(name: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase.from("faculties").insert({ name: name.trim() });
  if (error) return { error: error.message };
  revalidatePath("/admin/faculties");
  return { ok: true };
}

export async function toggleFaculty(id: string, isActive: boolean) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("faculties")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/faculties");
  return { ok: true };
}

export async function createDepartment(facultyId: string, name: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("departments")
    .insert({ faculty_id: facultyId, name: name.trim() });
  if (error) return { error: error.message };
  revalidatePath("/admin/faculties");
  return { ok: true };
}

export async function deleteDepartment(id: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/faculties");
  return { ok: true };
}

export async function createPastPaper(input: {
  subject_id: string;
  exam_type: string;
  year: number;
  file_url?: string | null;
}) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase.from("past_papers").insert({
    subject_id: input.subject_id,
    exam_type: input.exam_type,
    year: input.year,
    file_url: input.file_url || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/past-papers");
  return { ok: true };
}

export async function deletePastPaper(id: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase.from("past_papers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/past-papers");
  return { ok: true };
}

export async function createPackage(input: {
  name: string;
  description?: string | null;
  price: number;
}) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase.from("packages").insert({
    name: input.name.trim(),
    description: input.description || null,
    price: input.price,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/packages");
  return { ok: true };
}

export async function togglePackage(id: string, isActive: boolean) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("packages")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/packages");
  return { ok: true };
}

export async function deletePackage(id: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/packages");
  return { ok: true };
}

export async function updatePackage(
  id: string,
  input: { name?: string; description?: string | null; price?: number; is_active?: boolean }
) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("packages")
    .update({
      name: input.name?.trim(),
      description: input.description === undefined ? undefined : input.description,
      price: input.price,
      is_active: input.is_active,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/packages");
  return { ok: true };
}

export async function updateProfileRole(id: string, role: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ role: role as never })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateExamSettings(
  id: string,
  input: {
    review_enabled?: boolean;
    re_attempts_enabled?: boolean;
    show_explanations?: boolean;
    free?: boolean;
    is_premium?: boolean;
    price?: number | null;
    duration_minutes?: number;
  }
) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const update: Partial<{
    review_enabled: boolean;
    re_attempts_enabled: boolean;
    show_explanations: boolean;
    free: boolean;
    is_premium: boolean;
    price: number | null;
    duration_minutes: number;
  }> = {
    review_enabled: input.review_enabled,
    re_attempts_enabled: input.re_attempts_enabled,
    show_explanations: input.show_explanations,
    free: input.free,
    is_premium: input.is_premium,
    price: input.price ?? null,
    duration_minutes: input.duration_minutes,
  };
  const { error } = await supabase.from("exams").update(update).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/exams");
  revalidatePath("/admin/exams/[id]");
  return { ok: true };
}

export async function deleteExam(id: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/exams");
  return { ok: true };
}

export async function addQuestionsToExam(
  examId: string,
  questionIds: string[]
) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("exam_questions")
    .select("position")
    .eq("exam_id", examId)
    .order("position", { ascending: false })
    .limit(1);
  const start = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const rows = questionIds.map((qid, i) => ({
    exam_id: examId,
    question_id: qid,
    position: start + i,
  }));
  const { error } = await supabase.from("exam_questions").insert(rows);
  if (error) return { error: error.message };

  const { count } = await supabase
    .from("exam_questions")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", examId);

  await supabase
    .from("exams")
    .update({ question_count: count ?? 0 })
    .eq("id", examId);

  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${examId}`);
  return { ok: true };
}

export async function removeQuestionFromExam(examId: string, questionId: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_questions")
    .delete()
    .eq("exam_id", examId)
    .eq("question_id", questionId);
  if (error) return { error: error.message };

  const { count } = await supabase
    .from("exam_questions")
    .select("id", { count: "exact", head: true })
    .eq("exam_id", examId);
  await supabase
    .from("exams")
    .update({ question_count: count ?? 0 })
    .eq("id", examId);

  revalidatePath("/admin/exams");
  revalidatePath(`/admin/exams/${examId}`);
  return { ok: true };
}

// ─── Materials ───────────────────────────────────────────────────────────
async function getServiceSupabase() {
  const { createClient: createAdminClient } = await import("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createAdminClient(url, key);
}

async function uploadMaterialFile(file: File): Promise<{ url: string | null; error?: string }> {
  try {
    const service = await getServiceSupabase();
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const { error } = await service.storage.from("materials").upload(path, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (error) return { url: null, error: error.message };
    const { data } = service.storage.from("materials").getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e: unknown) {
    return { url: null, error: e instanceof Error ? e.message : "Upload failed" };
  }
}

export async function createMaterial(formData: FormData) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const title = String(formData.get("title") ?? "").trim();
  const subject_id = (formData.get("subject_id") as string) || null;
  const course_id = (formData.get("course_id") as string) || null;
  const is_premium = formData.get("is_premium") === "true" || formData.get("is_premium") === "on";
  const file = formData.get("file") as File | null;
  const file_url_input = String(formData.get("file_url") ?? "").trim();

  if (!title) return { error: "Title is required" };
  if (!subject_id && !course_id) return { error: "Select a subject or course" };

  let file_url = file_url_input || null;
  if (file && file.size > 0) {
    const up = await uploadMaterialFile(file);
    if (up.error || !up.url) return { error: up.error ?? "Upload failed" };
    file_url = up.url;
  }
  if (!file_url) return { error: "Provide a file or file URL" };

  const supabase = await createClient();
  const { error } = await supabase.from("materials").insert({
    title,
    subject_id: subject_id || null,
    course_id: course_id || null,
    file_url,
    is_premium,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/materials");
  revalidatePath("/dashboard/materials");
  return { ok: true };
}

export async function updateMaterial(
  id: string,
  input: { title?: string; is_premium?: boolean; file_url?: string | null }
) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  const update: { title?: string; is_premium?: boolean; file_url?: string } = {};
  if (input.title !== undefined) update.title = input.title.trim();
  if (input.is_premium !== undefined) update.is_premium = input.is_premium;
  if (input.file_url !== undefined && input.file_url !== null) update.file_url = input.file_url;
  const { error } = await supabase.from("materials").update(update as never).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/materials");
  revalidatePath("/dashboard/materials");
  return { ok: true };
}

export async function deleteMaterial(id: string) {
  if (!(await isAdmin())) return { error: "Unauthorized" };
  const supabase = await createClient();
  // best-effort: try to remove storage object if path can be inferred
  const { data: mat } = await supabase.from("materials").select("file_url").eq("id", id).single();
  if (mat?.file_url) {
    try {
      const service = await getServiceSupabase();
      const url = new URL(mat.file_url);
      const parts = url.pathname.split("/materials/");
      if (parts[1]) await service.storage.from("materials").remove([decodeURIComponent(parts[1])]);
    } catch {}
  }
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/materials");
  revalidatePath("/dashboard/materials");
  return { ok: true };
}
