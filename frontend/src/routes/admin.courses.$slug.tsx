import { createFileRoute } from "@tanstack/react-router";
import { Folder } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { EmptyState, FileIcon, PaidPill } from "@/components/prep/bits";
import { Panel, Td, Th } from "@/features/admin/components/parts";
import { useAdmin } from "@/lib/admin-store";
import { CATEGORIES, formatNaira, type CategorySlug } from "@/lib/mock-data";
import { useCatalog } from "@/features/catalog/useCatalog";
import { UploadMaterialDialog } from "@/features/admin/components/UploadMaterialDialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/courses/$slug")({
  head: () => ({
    meta: [
      { title: "Course materials — PrepMaster Admin" },
      {
        name: "description",
        content: "Every material inside this course, by category and folder.",
      },
      { property: "og:title", content: "Course materials — PrepMaster Admin" },
      {
        property: "og:description",
        content: "Every material inside this course, by category and folder.",
      },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { slug } = Route.useParams();
  const admin = useAdmin();
  const course = admin.courses.find((c) => c.slug === slug);
  const [cat, setCat] = useState<CategorySlug>("lecture-notes");
  const [sub, setSub] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { filesIn } = useCatalog();
  if (!course)
    return (
      <AdminShell title="Course not found" back={{ to: "/admin/courses", label: "All courses" }}>
        <EmptyState title="This course doesn't exist" />
      </AdminShell>
    );
  const list = filesIn(course.slug, cat, sub ?? undefined);
  const subs = course.subfolders[cat] ?? [];

  return (
    <AdminShell
      title={course.title}
      description={`${course.code} · ${filesIn(course.slug).length} materials`}
      back={{ to: "/admin/courses", label: "All courses" }}
      actions={
        <Button onClick={() => setUploading(true)}>
          <Upload />
          Upload file
        </Button>
      }
    >
      <UploadMaterialDialog open={uploading} onOpenChange={setUploading} course={course} category={cat} />
      <div className="mb-4 flex rounded-md border border-border bg-surface p-0.5 w-fit">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => {
              setCat(c.slug);
              setSub(null);
            }}
            className={cn(
              "h-8 rounded-sm px-3 text-sm",
              cat === c.slug ? "bg-surface-subtle font-medium" : "text-text-muted",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setSub(null)}
          className={cn(
            "h-8 rounded-full border px-3 text-sm",
            sub === null
              ? "border-primary bg-primary-soft text-primary"
              : "border-border bg-surface text-text-secondary",
          )}
        >
          All folders
        </button>
        {subs.map((s) => (
          <button
            key={s.slug}
            onClick={() => setSub(s.slug)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm",
              sub === s.slug
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-surface text-text-secondary",
            )}
          >
            <Folder className="size-3.5" />
            {s.name}
          </button>
        ))}
      </div>
      <Panel className="overflow-x-auto">
        {list.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No materials here yet" />
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-border bg-surface-subtle/60">
              <tr>
                <Th>Name</Th>
                <Th>Folder</Th>
                <Th>Size</Th>
                <Th>Access</Th>
                <Th>Added</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((f) => (
                <tr
                  key={f.id}
                  onClick={() =>
                    toast(f.name, {
                      description: `${f.size} · ${f.paid ? formatNaira(f.price ?? 0) : "Free"}`,
                    })
                  }
                  className="cursor-pointer hover:bg-surface-hover"
                >
                  <Td>
                    <span className="flex items-center gap-2.5">
                      <FileIcon type={f.type} />
                      <span className="font-medium">{f.name}</span>
                    </span>
                  </Td>
                  <Td className="text-text-secondary">
                    {subs.find((s) => s.slug === f.subfolderSlug)?.name}
                  </Td>
                  <Td className="text-text-muted">{f.size}</Td>
                  <Td>
                    <PaidPill paid={f.paid} />
                  </Td>
                  <Td className="text-text-muted">{f.addedAt}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </AdminShell>
  );
}
