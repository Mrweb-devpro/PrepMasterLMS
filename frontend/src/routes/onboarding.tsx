import { createFileRoute } from "@tanstack/react-router";
import { OnboardingPage } from "@/features/auth/pages/OnboardingPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/onboarding")({
  head: () =>
    pageHead("Onboarding", "Complete your PrepMaster profile to open your dashboard."),
  component: OnboardingPage,
});
