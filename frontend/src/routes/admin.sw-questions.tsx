import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/prep/AdminShell";
import { SwQuestionsPage } from "@/features/admin/pages/sw/SwQuestionsPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/sw-questions")({
  head: () => pageHead("SW questions", "Read and respond to SolidWorks questions."),
  component: () => (
    <AdminShell title="SolidWorks questions" description="Reply to students' questions.">
      <SwQuestionsPage />
    </AdminShell>
  ),
});
