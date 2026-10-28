import { createFileRoute } from "@tanstack/react-router";
import { CompetitionArenaPage } from "@/features/competitions/pages/CompetitionArenaPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/competitions/$competitionId/arena")({
  head: () => pageHead("Competition Arena", "Take part in a live PrepMaster student competition."),
  component: () => <CompetitionArenaPage competitionId={Route.useParams().competitionId} />,
});
