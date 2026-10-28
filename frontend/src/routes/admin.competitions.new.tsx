import { createFileRoute } from "@tanstack/react-router";
import { NewCompetitionPage } from "@/features/competitions/pages/NewCompetitionPage";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/admin/competitions/new")({ head: () => pageHead("New competition", "Schedule a PrepMaster student contest.", "PrepMaster Admin"), component: NewCompetitionPage });
