import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/prep/AdminShell";
import { SwTasksActions, SwTasksPage } from "@/features/admin/pages/sw/SwTasksPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/admin/sw-tasks")({
  head: () => pageHead("SW tasks", "Create, edit and delete SolidWorks tasks."),
  component: SwTasksRoute,
});

function SwTasksRoute() {
  const [open, setOpen] = useState(false);
  return (
    <AdminShell
      title="SolidWorks tasks"
      description="One task per video."
      actions={<SwTasksActions onNew={() => setOpen(true)} />}
    >
      <SwTasksPage formOpen={open} setFormOpen={setOpen} />
    </AdminShell>
  );
}
