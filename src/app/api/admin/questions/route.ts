import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/session";

export async function GET(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const bankId = url.searchParams.get("bank");
  if (!bankId) return NextResponse.json({ questions: [] });

  const supabase = await createClient();
  const { data: links } = await supabase
    .from("bank_questions")
    .select("question_id")
    .eq("bank_id", bankId);
  const ids = (links ?? []).map((l) => l.question_id);
  if (!ids.length) return NextResponse.json({ questions: [] });

  const { data } = await supabase.from("questions").select("*").in("id", ids);
  const questions = (data ?? []).map((q) => ({
    ...q,
    options:
      typeof q.options === "string"
        ? JSON.parse(q.options)
        : Array.isArray(q.options)
          ? q.options
          : [],
  }));
  return NextResponse.json({ questions });
}
