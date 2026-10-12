import { createFileRoute } from "@tanstack/react-router";
import { Eye, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StudentShell } from "@/components/prep/StudentShell";
import { Breadcrumbs, EmptyState, FileIcon, PageHeader, PaidPill } from "@/components/prep/bits";
import { PurchaseDialog } from "@/components/prep/PurchaseDialog";
import { filesIn, getCategory, getCourse, type CategorySlug, type DriveFile } from "@/lib/mock-data";
import { usePrep } from "@/lib/prep-store";

export const Route = createFileRoute("/drive/$course/$category/$subfolder")({
  head: () => ({
    meta: [
      { title: "Files — PrepMaster Drive" },
      { name: "description", content: "Open, preview or unlock the materials in this folder." },
      { property: "og:title", content: "Files — PrepMaster Drive" },
      { property: "og:description", content: "Open, preview or unlock the materials in this folder." },
    ],
  }),
  component: SubfolderPage,
});

function SubfolderPage() {
  const params = Route.useParams();
  const prep = usePrep();
  const [pending, setPending] = useState<DriveFile | null>(null);

  const course = getCourse(params.course);
  const category = getCategory(params.category as CategorySlug);
  const subfolder = course?.subfolders[category?.slug ?? "lecture-notes"].find(
    (s) => s.slug === params.subfolder,
  );

  if (!course || !category || !subfolder) {
    return (
      <StudentShell>
        <EmptyState title="Folder not found" />
      </StudentShell>
    );
  }

  const list = filesIn(course.slug, category.slug, subfolder.slug);

  const openFile = (file: DriveFile) => {
    const locked = file.paid && !prep.ownsFile(file.id);
    if (locked) {
      setPending(file);
      return;
    }
    toast.success(`Opening ${file.name}`, { description: "Prototype viewer — no real file is loaded." });
  };

  return (
    <StudentShell>
      <Breadcrumbs
        items={[
          { label: "Drive", to: "/drive" },
          { label: course.title, to: "/drive/$course", params: { course: course.slug } },
          {
            label: category.name,
            to: "/drive/$course/$category",
            params: { course: course.slug, category: category.slug },
          },
          { label: subfolder.name },
        ]}
      />
      <PageHeader title={subfolder.name} subtitle={`${course.code} · ${category.name} · ${list.length} files`} />

      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        {list.length === 0 && <p className="px-5 py-10 text-center text-sm text-text-muted">This folder is empty.</p>}
        {list.map((file) => {
          const locked = file.paid && !prep.ownsFile(file.id);
          return (
            <button
              key={file.id}
              onClick={() => openFile(file)}
              className="flex w-full items-center gap-3 border-b border-border px-5 py-3.5 text-left last:border-b-0 hover:bg-surface-subtle"
            >
              <FileIcon type={file.type} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{file.name}</span>
                <span className="block text-xs text-text-muted">
                  {file.size} · added {file.addedAt}
                </span>
              </span>
              <PaidPill paid={file.paid} owned={prep.ownsFile(file.id)} />
              {locked ? (
                <Lock className="size-4 text-gold" />
              ) : (
                <Eye className="size-4 text-text-muted" />
              )}
            </button>
          );
        })}
      </div>

      <PurchaseDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
        itemName={pending?.name ?? ""}
        price={pending?.price ?? 1500}
        onConfirm={() => {
          if (!pending) return;
          prep.purchaseFile(pending.id);
          toast.success("Payment confirmed", { description: `${pending.name} was added to your library.` });
        }}
      />
    </StudentShell>
  );
}
