import { createClient } from "@/lib/supabase/server";
import { CreateExamForm } from "./create-exam-form";

export default async function NewExamPage() {
  const supabase = await createClient();
  const [{ data: tracks }, { data: subjects }, { data: courses }, { data: banks }] =
    await Promise.all([
      supabase.from("tracks").select("id, name"),
      supabase.from("subjects").select("id, name"),
      supabase.from("courses").select("id, code, name, track_id"),
      supabase.from("question_banks").select("id, name, subject_id, course_id"),
    ]);

  return (
    <div className="mx-auto max-w-4xl">
      <CreateExamForm
        tracks={tracks ?? []}
        subjects={subjects ?? []}
        courses={courses ?? []}
        banks={banks ?? []}
      />
    </div>
  );
}
