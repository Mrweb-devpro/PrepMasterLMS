import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/prep/AdminShell";
import { SwSubmissionDetailPage } from "@/features/admin/pages/sw/SwSubmissionDetailPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/sw-submissions/$id")({
  head: () => pageHead("Grade submission", "View the student's files and answers, then grade.", "SolidWorks Admin"),
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
