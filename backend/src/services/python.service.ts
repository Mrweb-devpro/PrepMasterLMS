import { must } from "../lib/errors.js";
import { db } from "../lib/supabase.js";

export interface PythonWaitlistStatus {
  joined: boolean;
}

export interface PythonWaitlistJoinResult extends PythonWaitlistStatus {
  alreadyJoined: boolean;
}

/** Adds a student to the Python Web Book waitlist without creating duplicate records. */
export async function joinWaitlist(userId: string): Promise<PythonWaitlistJoinResult> {
  const profile = must<{ email: string; first_name: string; last_name: string }>(
    await db
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", userId)
      .maybeSingle(),
    "Profile not found.",
  );
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null;
  const { data, error } = await db
    .from("python_waitlist")
    .upsert(
      { user_id: userId, email: profile.email, full_name: fullName },
      { onConflict: "user_id", ignoreDuplicates: true },
    )
    .select("id");
  if (error) throw new Error(error.message);

  return { joined: true, alreadyJoined: (data ?? []).length === 0 };
}

/** Returns whether a student has already asked for Python Web Book early access. */
export async function getWaitlistStatus(userId: string): Promise<PythonWaitlistStatus> {
  const { data, error } = await db
    .from("python_waitlist")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { joined: Boolean(data) };
}
