import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "@/components/prep/StudentShell";
import { CompetitionResultsPage } from "@/features/competitions/pages/CompetitionResultsPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/competitions/$competitionId/results")({
  head: () => pageHead("Competition results", "Final rankings from a PrepMaster competition."),
  component: () => <StudentShell><CompetitionResultsPage id={Route.useParams().competitionId} /></StudentShell>,
});
