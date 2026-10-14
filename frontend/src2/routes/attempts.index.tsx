import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "@/components/prep/StudentShell";
import { AttemptsPage } from "@/features/cbt/pages/AttemptsPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/attempts/")({
  head: () => pageHead("My attempts", "All your submitted CBT attempts and their reviews."),
  component: () => (
    <StudentShell>
      <AttemptsPage />
    </StudentShell>
  ),
});
