import { createFileRoute, notFound } from "@tanstack/react-router";
import { InAppNotFound } from "@/components/common/InAppNotFound";
import { AdminShell } from "@/components/prep/AdminShell";
import { SwSubmissionDetailPage } from "@/features/admin/pages/sw/SwSubmissionDetailPage";
import { swQueries } from "@/features/solidworks/hooks/queries";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/sw-submissions/$id")({
  head: () => pageHead("Grade submission", "View the student's files and answers, then grade.", "SolidWorks Admin"),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(swQueries.submission(params.id));
    } catch {
      throw notFound();
    }
  },
  notFoundComponent: () => (
    <AdminShell title="Submission not found" back={{ to: "/admin/sw-submissions", label: "All submissions" }}>
      <InAppNotFound
        title="Submission not found"
        description="This submission doesn't exist or has been removed."
        backTo="/admin/sw-submissions"
        backLabel="Back to submissions"
      />
    </AdminShell>
  ),
  component: function RouteComponent() {
    return (
      <AdminShell
        title="Grade submission"
        back={{ to: "/admin/sw-submissions", label: "All submissions" }}
      >
        <SwSubmissionDetailPage id={Route.useParams().id} />
      </AdminShell>
    );
  },
});
