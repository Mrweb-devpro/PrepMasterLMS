import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";
import { verifyTransaction, paystackConfigured } from "@/lib/paystack";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get("reference");
  const examId = url.searchParams.get("exam");
  const packageId = url.searchParams.get("package");

  const user = await getUser();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const backTo = examId
    ? `${appUrl}/dashboard/cbt/${examId}`
    : packageId
      ? `${appUrl}/dashboard/packages`
      : `${appUrl}/dashboard/practice`;

  if (!reference || !user) {
    return NextResponse.redirect(`${backTo}?pay=error`);
  }

  if (!paystackConfigured()) {
    return NextResponse.redirect(`${backTo}?pay=not_configured`);
  }

  try {
    const result = await verifyTransaction(reference);
    const supabase = await createClient();

    if (result.success) {
      await supabase
        .from("payments")
        .update({ status: "success" })
        .eq("user_id", user.id)
        .eq("paystack_reference", reference)
        .eq("status", "pending");
      return NextResponse.redirect(`${backTo}?pay=success`);
    }
    await supabase
      .from("payments")
      .update({ status: result.status })
      .eq("user_id", user.id)
      .eq("paystack_reference", reference);
    return NextResponse.redirect(`${backTo}?pay=failed`);
  } catch {
    return NextResponse.redirect(`${backTo}?pay=error`);
  }
}
