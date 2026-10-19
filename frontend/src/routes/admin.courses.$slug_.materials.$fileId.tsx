import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download, Edit2, Eye, Folder, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { AdminShell } from "@/components/prep/AdminShell";
import { EmptyState, FileIcon, PaidPill } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { EditMaterialDialog } from "@/features/admin/components/EditMaterialDialog";
import { Panel } from "@/features/admin/components/parts";
import { useCatalog, deleteMockMaterial, useRefreshCatalog } from "@/features/catalog/useCatalog";
import { FileViewerDialog, type ViewableFile } from "@/features/files/components/FileViewer";
import { loadViewable } from "@/features/drive/utils/files";
import { useAdmin } from "@/lib/admin-store";
import { api } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import { formatNaira } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/courses/$slug_/materials/$fileId")({
  head: () => ({
    meta: [
      { title: "Material details | PrepMaster Admin" },
      { name: "description", content: "View, preview, edit, or delete course material." },
    ],
  }),
  component: AdminMaterialDetail,
});

function AdminMaterialDetail() {
  const { slug, fileId } = Route.useParams();
  const navigate = useNavigate();
  const admin = useAdmin();
  const confirm = useConfirm();
  const refreshCatalog = useRefreshCatalog();
  const { getFile, getCategory } = useCatalog();
  const course = admin.courses.find((item) => item.slug === slug);
  const file = getFile(fileId);
  const [previewFile, setPreviewFile] = useState<ViewableFile | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!course || !file || file.courseSlug !== slug) {
    return (
      <AdminShell title="Material not found" back={{ to: "/admin/courses/$slug", params: { slug }, label: "Course materials" }}>
        <EmptyState title="This material doesn't exist" />
      </AdminShell>
    );
  }

  const category = getCategory(file.category);
  const subfolder = course.subfolders[file.category]?.find((item) => item.slug === file.subfolderSlug);

  const handlePreview = async () => {
    setLoadingPreview(true);
    try {
      setPreviewFile(await loadViewable(file));
    } catch (error) {
      toast.error("Could not preview file", { description: (error as Error).message });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownload = async () => {
    try {
      const viewable = await loadViewable(file);
      if (viewable.url) window.open(viewable.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Download link failed", { description: (error as Error).message });
    }
  };

  const handleDelete = async () => {
    const approved = await confirm({
      title: `Delete “${file.name}”?`,
      description: "This permanently removes the material from the course. This action cannot be undone.",
      confirmLabel: "Delete material",
      destructive: true,
    });
    if (!approved) return;

    setDeleting(true);
    try {
      if (LIVE) await api.delete(`/materials/${file.id}`);
      else deleteMockMaterial(file.id);
      await refreshCatalog();
      toast.success("Material deleted");
      await navigate({ to: "/admin/courses/$slug", params: { slug } });
    } catch (error) {
      toast.error("Failed to delete material", { description: (error as Error).message });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell
      title={file.name}
      description={`${course.code} · ${category?.name ?? file.category}`}
      back={{ to: "/admin/courses/$slug", params: { slug }, label: course.code }}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Edit2 className="size-4" /> Edit details
          </Button>
          <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
            <Trash2 className="size-4" /> {deleting ? "Deleting…" : "Delete material"}
          </Button>
        </div>
      }
    >
      <FileViewerDialog file={previewFile} onClose={() => setPreviewFile(null)} />
      <EditMaterialDialog open={editing} onOpenChange={setEditing} file={file} course={course} />

      <div className="grid gap-6 md:grid-cols-3">
        <Panel className="space-y-6 p-6 md:col-span-2">
          <div className="flex items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-subtle">
              <FileIcon type={file.type} className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold text-foreground">{file.name}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <PaidPill paid={file.paid} />
                <span className="inline-flex items-center gap-1 rounded-md border border-border bg-surface-subtle px-2 py-0.5 text-xs text-text-secondary">
                  <Folder className="size-3" /> {subfolder?.name ?? "General"}
                </span>
                <span className="font-mono text-xs uppercase text-text-muted">{file.type}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-4">
            <Metadata label="Price" value={file.paid ? formatNaira(file.price ?? 0) : "Free"} />
            <Metadata label="Size" value={file.size} />
            <Metadata label="Date added" value={file.addedAt} />
            <Metadata label="Category" value={category?.name ?? file.category} />
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            <Button size="lg" disabled={loadingPreview} onClick={handlePreview}>
              <Eye className="size-4" /> {loadingPreview ? "Loading preview…" : "Preview document"}
            </Button>
            <Button size="lg" variant="outline" onClick={handleDownload}>
              <Download className="size-4" /> Download copy
            </Button>
          </div>
        </Panel>

        <Panel className="space-y-4 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Course information</p>
          <div>
            <p className="text-sm font-medium text-foreground">{course.title}</p>
            <p className="font-mono text-xs text-text-muted">{course.code}</p>
          </div>
          <div className="rounded-md border border-border bg-surface-subtle p-3 text-xs text-text-secondary">
            <p className="mb-1 font-medium text-foreground">Target folder</p>
            <p>{category?.name ?? file.category} &gt; {subfolder?.name ?? "All folders"}</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="w-full justify-start text-primary">
            <Link to="/admin/courses/$slug" params={{ slug: course.slug }}>View all materials in {course.code}</Link>
          </Button>
        </Panel>
      </div>
    </AdminShell>
  );
}

function Metadata({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 truncate font-semibold text-foreground">{value}</p>
    </div>
  );
}
