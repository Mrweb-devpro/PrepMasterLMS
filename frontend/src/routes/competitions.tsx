import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "@/components/prep/StudentShell";
import { CompetitionsPage } from "@/features/competitions/pages/CompetitionsPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/competitions")({
  head: () => pageHead("Competitions", "Join PrepMaster’s scheduled student contest arenas."),
  component: () => <StudentShell><CompetitionsPage /></StudentShell>,
});
