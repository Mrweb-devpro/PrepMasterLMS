"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/session";
import { hasExamAccess, hasPremiumSubscription } from "@/lib/access";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";

export async function checkPremiumStatus() {
  const user = await getUser();
  if (!user) return { premium: false };
  return { premium: await hasPremiumSubscription(user.id) };
}

export async function initializePackagePayment(packageId: string) {
  const user = await getUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = await createClient();
  const { data: pkg } = await supabase
    .from("packages")
    .select("id, name, price, is_active")
    .eq("id", packageId)
    .eq("is_active", true)
    .single();
  if (!pkg) return { error: "Package not found or inactive." };

  if (await hasPremiumSubscription(user.id)) {
    return { error: "You already have an active subscription." };
  }

  if (!paystackConfigured()) {
    return {
      error:
        "Payments are not configured yet. Please set your Paystack keys in .env.local.",
    };
  }

  const amount = Number(pkg.price) || 0;
  if (amount <= 0) return { error: "This package has no price." };

  const reference = `pkg-${randomUUID()}`;
  const email = user.email ?? "";

  const { error: insErr } = await supabase.from("payments").insert({
    user_id: user.id,
    package_id: packageId,
    paystack_reference: reference,
    amount,
    status: "pending",
  });
  if (insErr) return { error: insErr.message };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const txn = await initializeTransaction({
      email,
      amountKobo: Math.round(amount * 100),
      reference,
      callback_url: `${appUrl}/api/paystack/verify?reference=${reference}&package=${packageId}`,
      metadata: { user_id: user.id, package_id: packageId, package_name: pkg.name },
    });
    return { authorization_url: txn.authorization_url };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Could not start payment." };
  }
}

export async function checkExamAccess(examId: string) {
  const user = await getUser();
  if (!user) return { hasAccess: false, free: true, locked: false };
  const res = await hasExamAccess(user.id, examId);
  return { hasAccess: res.unlocked, free: res.paid === false, locked: !res.unlocked };
}

export async function initializeExamPayment(examId: string) {
  const user = await getUser();
  if (!user) return { error: "You must be signed in." };

  const supabase = await createClient();
  const { data: exam } = await supabase
    .from("exams")
    .select("title, free, price, is_premium")
    .eq("id", examId)
    .single();
  if (!exam) return { error: "Exam not found." };

  if (exam.free) return { error: "This exam is free." };

  const access = await hasExamAccess(user.id, examId);
  if (access.unlocked) return { error: "You already have access to this exam." };

  if (!paystackConfigured()) {
    return {
      error:
        "Payments are not configured yet. Please set your Paystack keys in .env.local.",
    };
  }

  const amount: number = exam.is_premium ? 0 : exam.price ?? 0;
  if (exam.is_premium || amount <= 0) {
    return {
      error: "This exam requires a subscription/package. Contact support to unlock.",
    };
  }

  const reference = `pm-${randomUUID()}`;
  const email = user.email ?? "";

  const { error: insErr } = await supabase.from("payments").insert({
    user_id: user.id,
    exam_id: examId,
    paystack_reference: reference,
    amount,
    status: "pending",
  });
  if (insErr) return { error: insErr.message };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  try {
    const txn = await initializeTransaction({
      email,
      amountKobo: Math.round(amount * 100),
      reference,
      callback_url: `${appUrl}/api/paystack/verify?reference=${reference}&exam=${examId}`,
      metadata: { user_id: user.id, exam_id: examId, exam_title: exam.title },
    });
    return { authorization_url: txn.authorization_url };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Could not start payment." };
  }
}
