const SECRET = process.env.PAYSTACK_SECRET_KEY;
const BASE = "https://api.paystack.co";

export function paystackConfigured(): boolean {
  return Boolean(SECRET) && Boolean(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY);
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  metadata: Record<string, unknown>;
  callback_url?: string;
}) {
  if (!SECRET) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callback_url,
      metadata: params.metadata,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data?.message ?? "Could not initialize payment");
  }
  return data.data as { authorization_url: string; access_code: string; reference: string };
}

export async function verifyTransaction(
  reference: string
): Promise<{ success: boolean; amount: number; status: string }> {
  if (!SECRET) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
  });
  const data = await res.json();
  if (!res.ok || !data.status) {
    throw new Error(data?.message ?? "Could not verify payment");
  }
  return {
    success: data.data.status === "success",
    amount: data.data.amount,
    status: data.data.status,
  };
}
