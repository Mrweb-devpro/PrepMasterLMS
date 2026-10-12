import { createFileRoute, Link } from "@tanstack/react-router";
import { Folder, Search } from "lucide-react";
import { useState } from "react";
import { StudentShell } from "@/components/prep/StudentShell";
import { Breadcrumbs, FileIcon, PageHeader, PaidPill } from "@/components/prep/bits";
import { Input } from "@/components/ui/input";
import { useCatalog } from "@/features/catalog/useCatalog";
import { usePrep } from "@/lib/prep-store";

export const Route = createFileRoute("/drive/")({
  head: () => ({
    meta: [
      { title: "Drive — PrepMaster" },
      {
        name: "description",
        content: "Browse course folders, lecture notes, past questions and textbooks.",
      },
      { property: "og:title", content: "Drive — PrepMaster" },
      {
        property: "og:description",
        content: "Browse course folders, lecture notes, past questions and textbooks.",
      },
    ],
  }),
  component: DrivePage,
});

function DrivePage() {
  const prep = usePrep();
  const { courses, files, getCourse, filesIn } = useCatalog();
  const [query, setQuery] = useState("");
  const searching = query.trim().length > 0;
  const results = files.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <StudentShell>
      <Breadcrumbs items={[{ label: "Drive" }]} />
      <PageHeader title="Drive" subtitle="All your course materials, organised by course." />

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search all files…"
          className="rounded-md border-border bg-surface pl-9"
        />
      </div>

      {searching ? (
        <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          {results.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-text-muted">
              No files match "{query}".
            </p>
          )}
          {results.map((file) => (
            <Link
              key={file.id}
              to="/drive/$course/$category/$subfolder"
              params={{
                course: file.courseSlug,
                category: file.category,
                subfolder: file.subfolderSlug,
              }}
              className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-b-0 hover:bg-surface-subtle"
            >
              <FileIcon type={file.type} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
              <span className="hidden text-xs text-text-muted sm:block">
                {getCourse(file.courseSlug)?.code}
              </span>
              <PaidPill paid={file.paid} owned={prep.ownsFile(file.id)} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.slug}
              to="/drive/$course"
              params={{ course: course.slug }}
              className="rounded-lg border border-border bg-surface p-5 shadow-sm card-hover"
            >
              <span
                className="mb-4 flex size-10 items-center justify-center rounded-md"
                style={{ backgroundColor: `${course.color}1a`, color: course.color }}
              >
                <Folder className="size-5" />
              </span>
              <p className="text-xs text-text-secondary">{course.code}</p>
              <h3 className="text-lg font-semibold leading-tight">{course.title}</h3>
              <p className="mt-2 text-sm text-text-muted">
                {filesIn(course.slug).length} files · 3 categories
              </p>
            </Link>
          ))}
        </div>
      )}
    </StudentShell>
  );
}
