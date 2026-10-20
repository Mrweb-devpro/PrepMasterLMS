import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/forgot-password")({
  head: () => pageHead("Forgot password", "Recover your PrepMaster account password."),
  component: ForgotPasswordPage,
});
