import { randomUUID } from "node:crypto";
import { badRequest, forbidden, must } from "../lib/errors.js";
import { downloadUrl, uploadUrl } from "../lib/r2.js";
import { db } from "../lib/supabase.js";
import type { Material } from "../models/types.js";
import { hasAccess } from "./access.service.js";
import { library } from "./student.service.js";

/**
 * Everything the student app browses, in one call: courses + folders, files
 * (without storage keys) and published CBTs (without questions).
 */
export async function catalog(userId: string, isAdmin: boolean) {
  const cbtQuery = db.from("cbts").select("*, cbt_questions(count)").order("opens_at");
  const [courses, subfolders, materials, cbts, owned, attempts] = await Promise.all([
    must(await db.from("courses").select("*").order("title")),
    must(await db.from("course_subfolders").select("*").order("name")),
    must<Material[]>(await db.from("course_materials").select("*").order("created_at", { ascending: false })),
    must(await (isAdmin ? cbtQuery : cbtQuery.eq("published", true))),
    library(userId),
    must<{ cbt_id: string }[]>(await db.from("cbt_attempts").select("cbt_id").eq("user_id", userId)),
  ]);
  subfolders.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );
  const used = new Map<string, number>();
  for (const a of attempts) used.set(a.cbt_id, (used.get(a.cbt_id) ?? 0) + 1);
  return {
    courses,
    subfolders,
    materials: materials.map(({ r2_key: _key, ...m }) => m),
    cbts: cbts.map(({ cbt_questions, ...c }) => ({
      ...c,
      question_count: (cbt_questions as { count: number }[])[0]?.count ?? 0,
      my_attempts: used.get(c.id as string) ?? 0,
    })),
    owned,
  };
}

/** Short-lived link to view/download a file. Paid files need a successful payment. */
export async function getDownloadLink(materialId: string, userId: string, isAdmin: boolean) {
  const m = must<Material>(await db.from("course_materials").select("*").eq("id", materialId).maybeSingle(), "File not found.");
  if (!isAdmin && !(await hasAccess(userId, "material", m.id, m.price_kobo))) throw forbidden("Buy this file to open it.");
  return { url: await downloadUrl(m.r2_key, 900), expiresInSeconds: 900 };
}

// ---------- Admin ----------

export async function createCourse(input: {
  slug: string; code: string; title: string; color: string; description: string;
  subfolders: { category: string; slug: string; name: string }[];
}) {
  const { subfolders, ...course } = input;
  const row = must<{ id: string }>(await db.from("courses").insert(course).select().single());
  if (subfolders.length) {
    const { error } = await db.from("course_subfolders").insert(subfolders.map((s) => ({ ...s, course_id: row.id })));
    if (error) {
      await db.from("courses").delete().eq("id", row.id);
      throw badRequest(error.message);
    }
  }
  return row;
}

export async function addSubfolder(courseId: string, s: { category: string; slug: string; name: string }) {
  return must(await db.from("course_subfolders").insert({ ...s, course_id: courseId }).select().single());
}

export async function updateCourse(
  courseId: string,
  input: {
    code?: string;
    title?: string;
    color?: string;
    description?: string;
    subfolders?: { category: string; slug: string; name: string }[];
  },
) {
  const { subfolders, ...courseFields } = input;
  must<{ id: string }>(
    await db.from("courses").select("id").eq("id", courseId).maybeSingle(),
    "Course not found.",
  );

  if (Object.keys(courseFields).length > 0) {
    must(
      await db.from("courses").update(courseFields).eq("id", courseId).select("id").single(),
      "Course not found.",
    );
  }

  if (subfolders) {
    const existing = must<{ id: string; category: string; slug: string }[]>(
      await db.from("course_subfolders").select("id, category, slug").eq("course_id", courseId),
    );
    const requested = new Set(subfolders.map((folder) => `${folder.category}:${folder.slug}`));
    const removed = existing.filter((folder) => !requested.has(`${folder.category}:${folder.slug}`));

    for (const folder of removed) {
      const materials = must<{ id: string }[]>(
        await db
          .from("course_materials")
          .select("id")
          .eq("course_id", courseId)
          .eq("category", folder.category)
          .eq("subfolder", folder.slug)
          .limit(1),
      );
      if (materials.length > 0) {
        throw badRequest("Move materials out of a folder before removing it.");
      }
    }

    if (subfolders.length > 0) {
      const { error } = await db.from("course_subfolders").upsert(
        subfolders.map((folder) => ({ ...folder, course_id: courseId })),
        { onConflict: "course_id,category,slug" },
      );
      if (error) throw badRequest(error.message);
    }

    if (removed.length > 0) {
      const { error } = await db.from("course_subfolders").delete().in("id", removed.map((folder) => folder.id));
      if (error) throw badRequest(error.message);
    }
  }

  return { success: true };
}

export async function deleteCourse(courseId: string) {
  must(await db.from("courses").delete().eq("id", courseId).select("id"));
  return { deleted: true };
}

/** Step 1 of an upload: returns a signed R2 link; the browser PUTs the file there. */
export async function prepareUpload(courseId: string, fileName: string, contentType: string) {
  const key = `courses/${courseId}/${randomUUID()}-${fileName.replace(/[^\w.-]/g, "_")}`;
  return { key, uploadUrl: await uploadUrl(key, contentType) };
}

/** Step 2: save the file's details once the upload has finished. */
export async function addMaterial(input: {
  courseId: string; category: string; subfolder: string; title: string; fileType: string;
  r2Key: string; sizeBytes: number; priceKobo: number;
}) {
  if (!input.r2Key.startsWith(`courses/${input.courseId}/`)) throw badRequest("Upload the file first.");
  const { r2_key: _key, ...row } = must<Material>(
    await db.from("course_materials").insert({
      course_id: input.courseId, category: input.category, subfolder: input.subfolder, title: input.title,
      file_type: input.fileType, r2_key: input.r2Key, size_bytes: input.sizeBytes, price_kobo: input.priceKobo,
    }).select().single(),
  );
  return row;
}

export async function deleteMaterial(materialId: string) {
  must(await db.from("course_materials").delete().eq("id", materialId).select("id"));
  return { deleted: true };
}

export async function updateMaterial(
  materialId: string,
  patch: { title?: string; category?: string; subfolder?: string; priceKobo?: number },
) {
  const updateData: Record<string, unknown> = {};
  if (patch.title !== undefined) updateData.title = patch.title;
  if (patch.category !== undefined) updateData.category = patch.category;
  if (patch.subfolder !== undefined) updateData.subfolder = patch.subfolder;
  if (patch.priceKobo !== undefined) updateData.price_kobo = patch.priceKobo;

  const { r2_key: _key, ...row } = must<Material>(
    await db.from("course_materials").update(updateData).eq("id", materialId).select().single(),
    "File not found.",
  );
  return row;
}
