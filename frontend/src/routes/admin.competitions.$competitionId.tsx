import { createFileRoute } from "@tanstack/react-router";
import { AdminCompetitionDetailPage } from "@/features/competitions/pages/AdminCompetitionDetailPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/competitions/$competitionId")({
  head: () => pageHead("Competition settings", "Manage competition settings and results.", "PrepMaster Admin"),
  component: () => <AdminCompetitionDetailPage id={Route.useParams().competitionId} />,
});
