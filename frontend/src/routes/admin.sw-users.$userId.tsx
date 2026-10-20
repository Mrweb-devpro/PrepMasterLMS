import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/prep/AdminShell";
import { SwUserDetailPage } from "@/features/admin/pages/sw/SwUserDetailPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/sw-users/$userId")({
  head: () => pageHead("User profile", "Submissions, grades and questions for this member.", "SolidWorks Admin"),
  component: Page,
});

function Page() {
  const { userId } = Route.useParams();
  return (
    <AdminShell
      title="Member details"
      description="Submissions, grades and questions."
      back={{ to: "/admin/sw-users", label: "SW users" }}
    >
      <SwUserDetailPage userId={userId} />
    </AdminShell>
  );
}
