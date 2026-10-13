import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderClosed } from "lucide-react";
import { useState } from "react";
import { StudentShell } from "@/components/prep/StudentShell";
import { Breadcrumbs, EmptyState, FileIcon, PageHeader, PaidPill } from "@/components/prep/bits";
import { CATEGORIES, filesIn, getCategory, getCourse, type CategorySlug } from "@/lib/mock-data";
import { usePrep } from "@/lib/prep-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/drive/$course/$category/")({
  head: () => ({
    meta: [
      { title: "Category — PrepMaster Drive" },
      { name: "description", content: "Sub-folders and files inside this course category." },
      { property: "og:title", content: "Category — PrepMaster Drive" },
      { property: "og:description", content: "Sub-folders and files inside this course category." },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const params = Route.useParams();
  const prep = usePrep();
  const [showAll, setShowAll] = useState(false);
  const course = getCourse(params.course);
  const category = getCategory(params.category as CategorySlug);

  if (!course || !category) {
    return (
      <StudentShell>
        <EmptyState title="Folder not found" />
      </StudentShell>
    );
  }

  const subfolders = course.subfolders[category.slug];
  const allFiles = filesIn(course.slug, category.slug);

  return (
    <StudentShell>
      <Breadcrumbs
        items={[
          { label: "Drive", to: "/drive" },
          { label: course.title, to: "/drive/$course", params: { course: course.slug } },
          { label: category.name },
        ]}
      />
      <PageHeader title={category.name} subtitle={`${course.code} · ${allFiles.length} files`} />

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setShowAll(false)}
          className={cn(
            "rounded-sm border px-3 py-1.5 text-sm transition-colors",
            !showAll ? "border-primary bg-secondary text-primary" : "border-border bg-surface text-text-secondary",
          )}
        >
          Sub-folders
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={cn(
            "rounded-sm border px-3 py-1.5 text-sm transition-colors",
            showAll ? "border-primary bg-secondary text-primary" : "border-border bg-surface text-text-secondary",
          )}
        >
          All sub-folders (flat)
        </button>
      </div>

      {showAll ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          {allFiles.length === 0 && <p className="px-5 py-8 text-center text-sm text-text-muted">No files yet.</p>}
          {allFiles.map((file) => (
            <Link
              key={file.id}
              to="/drive/$course/$category/$subfolder"
              params={{ course: course.slug, category: category.slug, subfolder: file.subfolderSlug }}
              className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0 hover:bg-surface-subtle"
            >
              <FileIcon type={file.type} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
              <span className="hidden text-xs text-text-muted sm:block">
                {subfolders.find((s) => s.slug === file.subfolderSlug)?.name}
              </span>
              <PaidPill paid={file.paid} owned={prep.ownsFile(file.id)} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subfolders.map((sf) => (
            <Link
              key={sf.slug}
              to="/drive/$course/$category/$subfolder"
              params={{ course: course.slug, category: category.slug, subfolder: sf.slug }}
              className="rounded-lg border border-border bg-surface p-5 shadow-sm card-hover"
            >
              <FolderClosed className="mb-4 size-6 text-primary" />
              <h3 className="font-semibold">{sf.name}</h3>
              <p className="mt-1 text-sm text-text-muted">
                {filesIn(course.slug, category.slug, sf.slug).length} files
              </p>
            </Link>
          ))}
        </div>
      )}

      {CATEGORIES.length === 0 && <EmptyState title="Nothing here" />}
    </StudentShell>
  );
}
