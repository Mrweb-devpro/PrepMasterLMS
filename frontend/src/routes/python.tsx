import { createFileRoute } from "@tanstack/react-router";
import { StudentShell } from "@/components/prep/StudentShell";
import { PythonWebBookPage } from "@/features/python/pages/PythonWebBookPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/python")({
  head: () => pageHead("Python Web Book", "Master Python from zero through short, plain-English chapters."),
  component: PythonRoute,
});

function PythonRoute() {
  return (
    <StudentShell>
      <PythonWebBookPage />
    </StudentShell>
  );
}
