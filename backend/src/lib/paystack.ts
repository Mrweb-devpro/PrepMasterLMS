import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

const BASE = "https://api.paystack.co";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
  });
  const body = (await res.json()) as { status: boolean; message: string; data: T };
  if (!res.ok || !body.status) throw new AppError(500, `Paystack: ${body.message}`);
  return body.data;
}

export const initializeTransaction = (p: { email: string; amountKobo: number; reference: string; callbackUrl?: string }) =>
  call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email: p.email, amount: p.amountKobo, reference: p.reference, callback_url: p.callbackUrl }),
  });

export const verifyTransaction = (reference: string) =>
  call<{ status: string; amount: number; reference: string }>(`/transaction/verify/${encodeURIComponent(reference)}`);

export function isValidSignature(rawBody: string, signature: string | undefined) {
  if (!signature) return false;
  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
