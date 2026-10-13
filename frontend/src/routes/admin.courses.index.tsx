import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Folder, Plus } from "lucide-react";
import { AdminShell } from "@/components/prep/AdminShell";
import { StatStrip } from "@/features/admin/components/parts";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/lib/admin-store";
import { CATEGORIES } from "@/lib/mock-data";
import { useCatalog } from "@/features/catalog/useCatalog";

export const Route = createFileRoute("/admin/courses/")({
  head: () => ({
    meta: [
      { title: "Courses — PrepMaster Admin" },
      { name: "description", content: "Manage course folders and see their materials." },
      { property: "og:title", content: "Courses — PrepMaster Admin" },
      { property: "og:description", content: "Manage course folders and see their materials." },
    ],
  }),
  component: AdminCourses,
});

function AdminCourses() {
  const admin = useAdmin();
  const { files, filesIn } = useCatalog();
  return (
    <AdminShell
      title="Courses"
      description="Folders, categories and materials."
      actions={
        <Button asChild>
          <Link to="/admin/courses/new">
            <Plus />
            New course
          </Link>
        </Button>
      }
    >
      <StatStrip
        items={[
          { label: "Courses", value: admin.courses.length },
          { label: "Materials", value: files.length },
          { label: "Paid materials", value: files.filter((f) => f.paid).length },
          { label: "Categories", value: CATEGORIES.length },
        ]}
      />
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {admin.courses.map((c) => (
          <Link
            key={c.slug}
            to="/admin/courses/$slug"
            params={{ slug: c.slug }}
            className="group card-surface card-hover block p-5"
          >
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-md"
                style={{ backgroundColor: `${c.color}1a`, color: c.color }}
              >
                <Folder className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-text-muted">{c.code}</p>
                <p className="truncate font-display font-semibold">{c.title}</p>
              </div>
              <ChevronRight className="size-4 text-text-muted transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <div key={cat.slug} className="rounded-md bg-surface-subtle p-3">
                  <p className="font-display text-lg font-semibold">
                    {filesIn(c.slug, cat.slug).length}
                  </p>
                  <p className="truncate text-xs text-text-muted">{cat.name}</p>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
