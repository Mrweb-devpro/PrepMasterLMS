import { createFileRoute } from "@tanstack/react-router";
import { PremiumPage } from "@/features/solidworks/pages/PremiumPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/premium")({
  head: () =>
    pageHead("SolidWorks Premium", "One-on-one sessions and priority reviews — coming soon."),
  component: PremiumPage,
});
