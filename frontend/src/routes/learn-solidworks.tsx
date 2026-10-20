import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "@/components/prep/StudentShell";
import { SolidworksInfoPage } from "@/features/solidworks/pages/SolidworksInfoPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/learn-solidworks")({
  head: () =>
    pageHead(
      "Learn SolidWorks",
      "Do the task from each video, submit your SolidWorks files and get graded.",
    ),
  component: () => (
    <StudentShell>
      <SolidworksInfoPage />
    </StudentShell>
  ),
});
