import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/solidworks/pages/SettingsPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/settings")({
  head: () => pageHead("Settings", "Manage your account details and preferences.", "SolidWorks"),
  component: SettingsPage,
});
