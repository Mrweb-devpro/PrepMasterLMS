import { must } from "../lib/errors.js";
import { db } from "../lib/supabase.js";
import type { Profile } from "../models/types.js";

/** Public sign-up check. The caller has already validated the email shape. */
export async function isEmailAvailable(email: string) {
  const { data, error } = await db
    .from("profiles")
    .select("id")
    .ilike("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !data;
}

export async function me(userId: string) {
  const [profile, warnings] = await Promise.all([
    must<Profile>(
      await db.from("profiles").select("*").eq("id", userId).maybeSingle(),
      "Profile not found.",
    ),
    must(
      await db
        .from("warnings")
        .select("id, reason, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ),
  ]);
  return { profile, warnings };
}

export interface ProfilePatch {
  gender?: "male" | "female" | null | undefined;
  avatarUrl?: string | null | undefined;
  firstName?: string | undefined;
  lastName?: string | undefined;
  faculty?: string | null | undefined;
  department?: string | null | undefined;
  level?: string | null | undefined;
  dob?: string | null | undefined;
  heard?: string | null | undefined;
  userType?: "student" | "freelancer" | null | undefined;
}

const COLUMNS: Record<keyof ProfilePatch, string> = {
  gender: "gender",
  avatarUrl: "avatar_url",
  firstName: "first_name",
  lastName: "last_name",
  faculty: "faculty",
  department: "department",
  level: "level",
  dob: "dob",
  heard: "heard",
  userType: "user_type",
};

export async function updateMe(userId: string, patch: ProfilePatch) {
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch))
    if (v !== undefined) row[COLUMNS[k as keyof ProfilePatch]] = v;
  return must<Profile>(
    await db.from("profiles").update(row).eq("id", userId).select().single(),
  );
}

/** Joins the SolidWorks programme. Safe to call twice. */
export async function swRegister(
  userId: string,
  userType: "student" | "freelancer",
  heard?: string | null,
) {
  const current = must<Profile>(
    await db.from("profiles").select("*").eq("id", userId).single(),
  );
  return must<Profile>(
    await db
      .from("profiles")
      .update({
        sw_registered: true,
        sw_joined_at: current.sw_joined_at ?? new Date().toISOString(),
        user_type: current.user_type ?? userType,
        heard: current.heard ?? heard ?? null,
      })
      .eq("id", userId)
      .select()
      .single(),
  );
}

/** Ids of every paid item the student owns, plus their payment history. */
export async function library(userId: string) {
  const rows = must<{ item_type: string; item_id: string }[]>(
    await db
      .from("payments")
      .select("item_type, item_id")
      .eq("user_id", userId)
      .eq("status", "success"),
  );
  return {
    materialIds: rows
      .filter((r) => r.item_type === "material")
      .map((r) => r.item_id),
    cbtIds: rows.filter((r) => r.item_type === "cbt").map((r) => r.item_id),
  };
}

export async function myPayments(userId: string) {
  return must(
    await db
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}

// ---------- Admin ----------

export async function listStudents(search?: string) {
  let q = db
    .from("profiles")
    .select("*, warnings!user_id(reason, created_at)")
    .order("created_at", { ascending: false });
  if (search) {
    const s = search.replace(/[%,()]/g, "");
    q = q.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`,
    );
  }
  return must(await q);
}

export async function getStudent(id: string) {
  const [profile, warnings, attempts, payments] = await Promise.all([
    must(
      await db.from("profiles").select("*").eq("id", id).maybeSingle(),
      "Student not found.",
    ),
    must(
      await db
        .from("warnings")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ),
    must(
      await db
        .from("cbt_attempts")
        .select("*, cbts(title)")
        .eq("user_id", id)
        .order("started_at", { ascending: false }),
    ),
    must(
      await db
        .from("payments")
        .select("*")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ),
  ]);
  return { profile, warnings, attempts, payments };
}

export async function suspend(ids: string[], reason: string) {
  return must(
    await db
      .from("profiles")
      .update({
        suspended_at: new Date().toISOString(),
        suspend_reason: reason,
      })
      .in("id", ids)
      .select("id"),
  );
}

export async function restore(ids: string[]) {
  return must(
    await db
      .from("profiles")
      .update({ suspended_at: null, suspend_reason: null })
      .in("id", ids)
      .select("id"),
  );
}

export async function warn(ids: string[], reason: string, adminId: string) {
  return must(
    await db
      .from("warnings")
      .insert(ids.map((user_id) => ({ user_id, reason, issued_by: adminId })))
      .select(),
  );
}

/** Numbers for the admin home page. */
export async function stats() {
  const count = async (table: string) =>
    (await db.from(table).select("id", { count: "exact", head: true })).count ??
    0;
  const [students, materials, cbts, courses, paid] = await Promise.all([
    count("profiles"),
    count("course_materials"),
    count("cbts"),
    count("courses"),
    db.from("payments").select("amount_kobo").eq("status", "success"),
  ]);
  const revenueKobo = (paid.data ?? []).reduce(
    (s, p) => s + (p.amount_kobo as number),
    0,
  );
  return { students, materials, cbts, courses, revenueKobo };
}
