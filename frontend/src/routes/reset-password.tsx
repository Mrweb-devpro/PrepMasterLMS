import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/reset-password")({
  head: () => pageHead("Set new password", "Choose a new password for your PrepMaster account."),
  component: ResetPasswordPage,
});
