import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/solidworks/pages/SettingsPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/solidworks/settings")({
  head: () => pageHead("SolidWorks settings", "Manage your account details and preferences."),
  component: SettingsPage,
});
