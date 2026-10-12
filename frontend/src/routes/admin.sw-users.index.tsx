import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/prep/AdminShell";
import { SwUsersPage } from "@/features/admin/pages/sw/SwUsersPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/sw-users/")({
  head: () => pageHead("SW users", "Everyone registered for SolidWorks."),
  component: () => (
    <AdminShell title="SolidWorks users" description="Everyone who has joined SolidWorks.">
      <SwUsersPage />
    </AdminShell>
  ),
});
