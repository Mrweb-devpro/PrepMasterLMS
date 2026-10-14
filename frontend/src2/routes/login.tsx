import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } =>
    typeof s["redirect"] === "string" && s["redirect"].startsWith("/")
      ? { redirect: s["redirect"] }
      : {},
  head: () => pageHead("Sign in", "Sign in to PrepMaster. Students and admins use the same page."),
  component: function RouteComponent() {
    return <LoginPage {...Route.useSearch()} />;
  },
});
