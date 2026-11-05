import { createFileRoute } from "@tanstack/react-router";
import { AdminCompetitionsPage } from "@/features/competitions/pages/AdminCompetitionsPage";
import { pageHead } from "@/lib/seo";
export const Route = createFileRoute("/admin/competitions/")({ head: () => pageHead("Competitions", "Manage scheduled student competitions.", "PrepMaster Admin"), component: AdminCompetitionsPage });
