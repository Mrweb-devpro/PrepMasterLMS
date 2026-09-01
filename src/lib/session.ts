import { createClient } from "@/lib/supabase/server";

export type ProfileWithTrack = {
  id: string;
  full_name: string;
  role?: string;
  track_id: string | null;
  faculty_id: string | null;
  department_id: string | null;
  level_id: string | null;
  semester_id: string | null;
  theme_preference?: string | null;
  tracks?: { type: string } | null;
};

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function isAdmin() {
  const user = await getUser();
  if (!user) return false;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin";
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*, tracks(type)")
    .eq("id", user.id)
    .single();
  return data as ProfileWithTrack | null;
}
