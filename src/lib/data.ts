import { createClient } from "@/lib/supabase/server";
import { ProfileWithTrack } from "@/lib/session";

type ExamWithSubject = {
  id: string;
  title: string;
  type: string;
  tag: string;
  duration_minutes: number;
  question_count: number;
  free: boolean;
  is_premium: boolean;
  status: string;
  year: number | null;
  subjects: { name: string } | null;
};

function isUniversity(p?: ProfileWithTrack | null) {
  return p?.tracks?.type === "university";
}

export async function getSubjects(profile: ProfileWithTrack | null) {
  const supabase = await createClient();
  if (isUniversity(profile)) return [];

  const { data } = await supabase
    .from("subjects")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function getCourses(profile: ProfileWithTrack | null) {
  const supabase = await createClient();
  if (!isUniversity(profile) || !profile?.level_id) return [];

  let query = supabase
    .from("courses")
    .select("*")
    .eq("level_id", profile.level_id)
    .eq("is_active", true);

  if (profile.department_id) {
    query = query.or(
      `department_id.is.null,department_id.eq.${profile.department_id}`
    );
  } else {
    query = query.is("department_id", null);
  }

  const { data } = await query.order("code");
  return data ?? [];
}

export async function getExamsForSubject(subjectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exams")
    .select("*, subjects(name)")
    .eq("subject_id", subjectId)
    .in("status", ["live", "scheduled"])
    .order("created_at", { ascending: false });

  return (data ?? []) as ExamWithSubject[];
}

export async function getExamsForCourse(courseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exams")
    .select("*, subjects(name)")
    .eq("course_id", courseId)
    .in("status", ["live", "scheduled"])
    .order("created_at", { ascending: false });

  return (data ?? []) as ExamWithSubject[];
}

export async function getAllAvailableExams(profile: ProfileWithTrack | null) {
  const supabase = await createClient();

  if (isUniversity(profile)) {
    const courses = await getCourses(profile);
    const courseIds = courses.map((c) => c.id);
    if (courseIds.length === 0) return [];
    const { data } = await supabase
      .from("exams")
      .select("*, courses(code, name)")
      .in("course_id", courseIds)
      .in("status", ["live", "scheduled"])
      .order("created_at", { ascending: false });
    return data ?? [];
  }

  const { data } = await supabase
    .from("exams")
    .select("*, subjects(name)")
    .in("status", ["live", "scheduled"])
    .order("created_at", { ascending: false });
  return data ?? [];
}
