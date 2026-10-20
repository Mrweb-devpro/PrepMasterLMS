import { createFileRoute } from "@tanstack/react-router";
import { SignupPage } from "@/features/auth/pages/SignupPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/signup")({
  head: () =>
    pageHead(
      "Sign up",
      "Create a free PrepMaster account to access study materials and CBTs.",
    ),
  component: SignupPage,
});
