import { randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { badRequest, conflict, must } from "../lib/errors.js";
import { initializeTransaction, verifyTransaction } from "../lib/paystack.js";
import { db } from "../lib/supabase.js";
import type { ItemType } from "../models/types.js";
import { hasAccess } from "./access.service.js";

/** Price and title always come from the database, never from the browser. */
async function itemOf(itemType: ItemType, itemId: string) {
  if (itemType === "cbt") {
    const row = must<{
      price_kobo: number;
      title: string;
      mode: "practice" | "live";
      closes_at: string | null;
      published: boolean;
      paused: boolean;
    }>(
      await db
        .from("cbts")
        .select("price_kobo, title, mode, closes_at, published, paused")
        .eq("id", itemId)
        .maybeSingle(),
      "Item not found.",
    );
    if (!row.published || row.paused) throw badRequest("This CBT is currently unavailable.");
    if (row.mode === "live" && row.closes_at && new Date(row.closes_at).getTime() <= Date.now()) {
      throw badRequest("This live CBT has ended and can no longer be purchased.");
    }
    if (row.price_kobo <= 0) throw badRequest("This item is free.");
    return row;
  }

  const row = must<{ price_kobo: number; title: string }>(
    await db.from("course_materials").select("price_kobo, title").eq("id", itemId).maybeSingle(), "Item not found.",
  );
  if (row.price_kobo <= 0) throw badRequest("This item is free.");
  return row;
}

/** Only allow redirects back to our own frontend. */
function safeCallback(url?: string) {
  if (!url) return undefined;
  const allowed = env.CORS_ORIGINS.split(",").map((o) => o.trim());
  return allowed.includes(new URL(url).origin) ? url : undefined;
}

export async function checkout(user: { id: string; email: string }, itemType: ItemType, itemId: string, callbackUrl?: string) {
  const item = await itemOf(itemType, itemId);
  if (await hasAccess(user.id, itemType, itemId, item.price_kobo)) throw conflict("You already own this.");
  const reference = `pm_${randomUUID()}`;
  must(await db.from("payments").insert({
    user_id: user.id, item_type: itemType, item_id: itemId, item_title: item.title, amount_kobo: item.price_kobo, reference,
  }).select().single());
  const cb = safeCallback(callbackUrl);
  const tx = await initializeTransaction({ email: user.email, amountKobo: item.price_kobo, reference, ...(cb ? { callbackUrl: cb } : {}) });
  return { authorizationUrl: tx.authorization_url, reference };
}

/**
 * Confirms a payment by asking Paystack directly. Used by the webhook AND by the
 * "returned from Paystack" page, so it works even when webhooks can't reach you
 * (e.g. testing on localhost). Safe to call any number of times.
 */
export async function confirm(reference: string) {
  const payment = must<{ id: string; amount_kobo: number; status: string }>(
    await db.from("payments").select("id, amount_kobo, status").eq("reference", reference).maybeSingle(), "Payment not found.",
  );
  if (payment.status === "success") return "success";

  const tx = await verifyTransaction(reference);
  if (tx.status === "success" && tx.amount === payment.amount_kobo) {
    await db.from("payments").update({ status: "success", paid_at: new Date().toISOString() })
      .eq("id", payment.id).neq("status", "success");
    return "success";
  }
  // Paystack statuses: abandoned / ongoing / pending mean the student hasn't finished yet.
  if (["failed", "reversed"].includes(tx.status) || (tx.status === "success" && tx.amount !== payment.amount_kobo)) {
    await db.from("payments").update({ status: "failed" }).eq("id", payment.id).eq("status", "pending");
    return "failed";
  }
  return "pending";
}

export async function verify(reference: string, userId: string) {
  await status(reference, userId); // ownership check
  await confirm(reference).catch(() => undefined); // Paystack hiccup: report the stored status
  return status(reference, userId);
}

export async function status(reference: string, userId: string) {
  return must<{ status: string; item_type: ItemType; item_id: string; item_title: string; amount_kobo: number }>(
    await db.from("payments").select("status, item_type, item_id, item_title, amount_kobo")
      .eq("reference", reference).eq("user_id", userId).maybeSingle(),
    "Payment not found.",
  );
}

export async function listAll() {
  return must(await db.from("payments").select("*, profiles(first_name, last_name, email)").order("created_at", { ascending: false }).limit(500));
}
