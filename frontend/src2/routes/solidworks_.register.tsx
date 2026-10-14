import { createFileRoute } from "@tanstack/react-router";
import { parseHeard } from "@/features/auth/constants/options";
import { RegisterPage } from "@/features/solidworks/pages/RegisterPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks_/register")({
  validateSearch: (s: Record<string, unknown>): { heard?: string } => {
    const heard = parseHeard(s["heard"]);
    return heard ? { heard } : {};
  },
  head: () =>
    pageHead(
      "Join SolidWorks",
      "Register for SolidWorks with MrPrepMaster and get your drawings graded.",
    ),
  component: function RouteComponent() {
    return <RegisterPage {...Route.useSearch()} />;
  },
});
