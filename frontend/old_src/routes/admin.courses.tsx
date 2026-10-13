import { createFileRoute } from "@tanstack/react-router";
import { Folder, Plus, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { Button } from "@/components/ui/button";
import { CATEGORIES, courses, filesIn } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/courses")({
  head: () => ({
    meta: [
      { title: "Courses — PrepMaster Admin" },
      { name: "description", content: "Manage course folders and upload materials." },
      { property: "og:title", content: "Courses — PrepMaster Admin" },
      { property: "og:description", content: "Manage course folders and upload materials." },
    ],
  }),
  component: AdminCourses,
});

function AdminCourses() {
  return (
    <AdminShell
      title="Courses"
      description="Folders, categories and uploaded materials."
      actions={<Button onClick={() => toast("New course", { description: "Preview only." })}><Plus className="size-4" />New course</Button>}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((c) => (
          <div key={c.slug} className="rounded-lg border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-md" style={{ backgroundColor: `${c.color}1a`, color: c.color }}><Folder className="size-5" /></span>
              <div className="flex-1"><p className="text-xs text-text-muted">{c.code}</p><p className="font-display font-semibold">{c.title}</p></div>
              <Button size="sm" variant="outline" onClick={() => toast.success("Upload started", { description: "Preview only — nothing is uploaded." })}><Upload className="size-4" />Upload</Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <div key={cat.slug} className="rounded-md bg-surface-subtle p-3">
                  <p className="font-display text-lg font-semibold">{filesIn(c.slug, cat.slug).length}</p>
                  <p className="text-xs text-text-muted">{cat.name}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
