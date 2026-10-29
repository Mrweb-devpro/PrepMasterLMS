import { createFileRoute } from "@tanstack/react-router";
import { CompetitionEditorPage } from "@/features/competitions/pages/CompetitionEditorPage";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/admin/competitions/new")({ head: () => pageHead("New competition", "Schedule a PrepMaster student contest.", "PrepMaster Admin"), component: CompetitionEditorPage });
