import { createFileRoute, Link } from "@tanstack/react-router";
import { Folder, FolderInput, Loader2, Pencil, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { EmptyState, FileIcon, PaidPill } from "@/components/prep/bits";
import { Panel, Td, Th } from "@/features/admin/components/parts";
import { useAdmin } from "@/lib/admin-store";
import { CATEGORIES, type CategorySlug, type Course, type DriveFile } from "@/lib/mock-data";
import { useCatalog } from "@/features/catalog/useCatalog";
import { UploadMaterialDialog } from "@/features/admin/components/UploadMaterialDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/courses/$slug/")({
  head: () => ({
    meta: [
      { title: "Course materials | PrepMaster Admin" },
      {
        name: "description",
        content: "Every material inside this course, by category and folder.",
      },
      { property: "og:title", content: "Course materials | PrepMaster Admin" },
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
  const [movingFile, setMovingFile] = useState<DriveFile | null>(null);
  const { filesIn } = useCatalog();
  if (!course)
    return (
      <AdminShell title="Course not found" back={{ to: "/admin/courses", label: "All courses" }}>
        <EmptyState title="This course doesn't exist" />
      </AdminShell>
    );
  const list = filesIn(course.slug, cat, sub ?? undefined);
  const subs = [...(course.subfolders[cat] ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }),
  );

  return (
    <AdminShell
      title={course.title}
      description={`${course.code} · ${filesIn(course.slug).length} materials`}
      back={{ to: "/admin/courses", label: "All courses" }}
      actions={
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/courses/$slug/edit" params={{ slug: course.slug }}>
              <Pencil />
              Edit course
            </Link>
          </Button>
          <Button onClick={() => setUploading(true)}>
            <Upload />
            Upload file
          </Button>
        </div>
      }
    >
      <UploadMaterialDialog open={uploading} onOpenChange={setUploading} course={course} category={cat} />
      <MoveMaterialDialog file={movingFile} course={course} onOpenChange={(open) => !open && setMovingFile(null)} />
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
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((f) => (
                <tr key={f.id} className="cursor-pointer transition-colors hover:bg-surface-hover">
                  <Td>
                    <Link
                      to="/admin/courses/$slug/materials/$fileId"
                      params={{ slug: course.slug, fileId: f.id }}
                      className="group flex items-center gap-2.5"
                    >
                      <FileIcon type={f.type} />
                      <span className="font-medium text-foreground transition-colors group-hover:text-primary">{f.name}</span>
                    </Link>
                  </Td>
                  <Td className="text-text-secondary">
                    <Link
                      to="/admin/courses/$slug/materials/$fileId"
                      params={{ slug: course.slug, fileId: f.id }}
                      className="block"
                    >
                      {subs.find((s) => s.slug === f.subfolderSlug)?.name ?? "—"}
                    </Link>
                  </Td>
                  <Td className="text-text-muted">{f.size}</Td>
                  <Td>
                    <PaidPill paid={f.paid} />
                  </Td>
                  <Td className="text-text-muted">{f.addedAt}</Td>
                  <Td className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setMovingFile(f)}>
                      <FolderInput />
                      Move
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </AdminShell>
  );
}

function MoveMaterialDialog({
  file,
  course,
  onOpenChange,
}: {
  file: DriveFile | null;
  course: Course;
  onOpenChange: (open: boolean) => void;
}) {
  const admin = useAdmin();
  const [category, setCategory] = useState<CategorySlug>(file?.category ?? "lecture-notes");
  const [folder, setFolder] = useState(file?.subfolderSlug ?? "");
  const [moving, setMoving] = useState(false);
  const folders = course.subfolders[category] ?? [];

  useEffect(() => {
    if (!file) return;
    setCategory(file.category);
    setFolder(file.subfolderSlug);
  }, [file]);

  const move = async () => {
    if (!file) return;
    setMoving(true);
    try {
      await admin.moveMaterial(file.id, category, folder);
      toast.success("File moved");
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't move file", { description: (error as Error).message });
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={Boolean(file)} onOpenChange={(open) => !moving && onOpenChange(open)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move file</DialogTitle>
          <DialogDescription>Choose where {file?.name ?? "this file"} should appear.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="move-category">Category</Label>
            <select
              id="move-category"
              value={category}
              onChange={(event) => {
                const nextCategory = event.target.value as CategorySlug;
                setCategory(nextCategory);
                setFolder(course.subfolders[nextCategory]?.[0]?.slug ?? "");
              }}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {CATEGORIES.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="move-folder">Folder</Label>
            <select
              id="move-folder"
              value={folder}
              onChange={(event) => setFolder(event.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">No folder</option>
              {folders.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={moving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={moving} onClick={move}>
            {moving && <Loader2 className="animate-spin" />}
            Move file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
