// Paystack checkout through our API. The price is always decided by the server.
import { api, toNaira } from "@/lib/api/client";

export type ItemType = "material" | "cbt";

export interface PaymentStatus {
  status: "pending" | "success" | "failed";
  item_type: ItemType;
  item_id: string;
  item_title: string;
  amount_kobo: number;
}

export interface PaymentRow {
  id: string;
  user_id: string;
  item_type: ItemType;
  item_id: string;
  item_title: string;
  amount_kobo: number;
  reference: string;
  status: "pending" | "success" | "failed";
  paid_at: string | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string; email: string } | null;
}

/** Shape used by the Account + admin Payments tables. */
export interface Transaction {
  id: string;
  student: string;
  item: string;
  amount: number;
  status: "verified" | "initiated" | "failed";
  date: string;
}

const STATUS = { success: "verified", pending: "initiated", failed: "failed" } as const;

export const toTransaction = (p: PaymentRow): Transaction => ({
  id: p.reference,
  student: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}`.trim() || p.profiles.email : "",
  item: p.item_title || (p.item_type === "cbt" ? "CBT" : "File"),
  amount: toNaira(p.amount_kobo),
  status: STATUS[p.status],
  date: (p.paid_at ?? p.created_at).slice(0, 10),
});

/** Remember where to send the student back after paying. */
const RETURN_KEY = "prepmaster-pay-return";

export const paymentsApi = {
  /** Creates the payment and sends the browser to Paystack's checkout page. */
  async startCheckout(itemType: ItemType, itemId: string) {
    sessionStorage.setItem(RETURN_KEY, window.location.pathname);
    const { authorizationUrl } = await api.post<{ authorizationUrl: string; reference: string }>(
      "/payments/checkout",
      { itemType, itemId, callbackUrl: `${window.location.origin}/payment/callback` },
    );
    window.location.assign(authorizationUrl);
  },
  /** Asks the server to confirm with Paystack (works even without webhooks). */
  verify: (reference: string) =>
    api.post<PaymentStatus>(`/payments/${encodeURIComponent(reference)}/verify`),
  returnPath() {
    const p = sessionStorage.getItem(RETURN_KEY);
    return p && p.startsWith("/") && !p.startsWith("//") ? p : "/library";
  },
  mine: async () => (await api.get<PaymentRow[]>("/me/payments")).map(toTransaction),
  all: async () => (await api.get<PaymentRow[]>("/payments/admin/all")).map(toTransaction),
};
