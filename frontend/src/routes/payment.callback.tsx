import { createFileRoute } from "@tanstack/react-router";
import { PaymentCallbackPage } from "@/features/payments/pages/PaymentCallbackPage";

export const Route = createFileRoute("/payment/callback")({
  validateSearch: (s: Record<string, unknown>): { reference?: string } => {
    const r = s["reference"] ?? s["trxref"];
    return typeof r === "string" ? { reference: r } : {};
  },
  head: () => ({
    meta: [
      { title: "Payment status — PrepMaster" },
      { name: "description", content: "Confirming your PrepMaster payment." },
      { property: "og:title", content: "Payment status — PrepMaster" },
      { property: "og:description", content: "Confirming your PrepMaster payment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: function PaymentCallback() {
    const { reference } = Route.useSearch();
    return <PaymentCallbackPage {...(reference ? { reference } : {})} />;
  },
});
