import { createClient } from "@/lib/supabase/server";

export async function hasPremiumSubscription(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payments")
    .select("id")
    .not("package_id", "is", null)
    .eq("user_id", userId)
    .eq("status", "success")
    .maybeSingle();
  return Boolean(data);
}

export async function hasExamAccess(
  userId: string,
  examId: string
): Promise<{ paid: boolean; unlocked: boolean }> {
  const supabase = await createClient();

  const { data: exam } = await supabase
    .from("exams")
    .select("free, is_premium, price")
    .eq("id", examId)
    .single();
  if (!exam) return { paid: true, unlocked: true };

  if (exam.free) return { paid: true, unlocked: true };

  const { data: pay } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .eq("exam_id", examId)
    .eq("status", "success")
    .maybeSingle();

  // A premium exam is unlocked either by a direct purchase or by a package subscription
  const unlocked = Boolean(pay) || (exam.is_premium && (await hasPremiumSubscription(userId)));

  return {
    paid: unlocked,
    unlocked,
  };
}
