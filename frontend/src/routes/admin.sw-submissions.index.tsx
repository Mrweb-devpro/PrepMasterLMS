import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/prep/AdminShell";
import { SwSubmissionsPage } from "@/features/admin/pages/sw/SwSubmissionsPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/sw-submissions/")({
  head: () => pageHead("Submissions", "Review and grade SolidWorks submissions.", "SolidWorks Admin"),
  component: () => (
    <AdminShell
      title="SolidWorks submissions"
      description="Open a submission to view files and grade it."
    >
      <SwSubmissionsPage />
    </AdminShell>
  ),
});
