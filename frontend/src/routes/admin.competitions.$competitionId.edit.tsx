import { createFileRoute } from "@tanstack/react-router";
import { CompetitionEditorPage } from "@/features/competitions/pages/CompetitionEditorPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/competitions/$competitionId/edit")({
  head: () => pageHead("Edit competition", "Update a PrepMaster competition and its questions.", "PrepMaster Admin"),
  component: () => <CompetitionEditorPage id={Route.useParams().competitionId} />,
});
