import { createFileRoute, Link } from "@tanstack/react-router";
import { Folder, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { StudentShell } from "@/components/prep/StudentShell";
import { DriveEmptyIllustration } from "@/components/common/EmptyStateIllustration";
import { Breadcrumbs, EmptyState, FileIcon, PageHeader, PaidPill } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DepartmentFilter, type DepartmentFilterMode } from "@/features/catalog/components/DepartmentFilter";
import { useCatalog } from "@/features/catalog/useCatalog";
import { matchesDepartment, matchesLevel } from "@/features/catalog/utils/department-filter";
import { useSession } from "@/features/auth/session";
import { usePrep } from "@/lib/prep-store";

export const Route = createFileRoute("/drive/")({
  head: () => ({
    meta: [
      { title: "Drive | PrepMaster" },
      {
        name: "description",
        content: "Browse course folders, lecture notes, past questions and textbooks.",
      },
      { property: "og:title", content: "Drive | PrepMaster" },
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
  const { user } = useSession();
  const { courses, files, getCourse, filesIn, loading } = useCatalog();
  const [query, setQuery] = useState("");
  const [departmentMode, setDepartmentMode] = useState<DepartmentFilterMode>(user?.course ? "mine" : "all");
  const [departmentFilterTouched, setDepartmentFilterTouched] = useState(false);
  const searching = query.trim().length > 0;
  const studentLevel = user?.level;
  const visibleCourses = courses.filter(
    (course) =>
      matchesLevel(course, studentLevel) &&
      matchesDepartment(course, departmentMode, user?.course),
  );
  const noCoursesTitle =
    departmentMode === "all"
      ? "No course materials yet"
      : "No courses found for your department at this level";
  const results = files.filter(
    (file) =>
      file.name.toLowerCase().includes(query.trim().toLowerCase()) &&
      matchesLevel(getCourse(file.courseSlug), studentLevel) &&
      matchesDepartment(getCourse(file.courseSlug), departmentMode, user?.course),
  );

  const resetDepartmentFilter = () => {
    setDepartmentFilterTouched(true);
    setDepartmentMode("all");
  };

  useEffect(() => {
    if (!departmentFilterTouched) setDepartmentMode(user?.course ? "mine" : "all");
  }, [departmentFilterTouched, user?.course]);

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

      <DepartmentFilter
        userDepartment={user?.course}
        mode={departmentMode}
        onModeChange={(mode) => {
          setDepartmentFilterTouched(true);
          setDepartmentMode(mode);
        }}
      />

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-text-muted">
          <Loader2 className="size-4 animate-spin" /> Loading course materials…
        </div>
      ) : searching ? (
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
      ) : visibleCourses.length === 0 ? (
        <EmptyState
          illustration={<DriveEmptyIllustration />}
          title={noCoursesTitle}
          description={
            departmentMode === "all"
              ? "Your courses and study materials will appear here when they are available."
              : "Switch to all courses to explore other departments at this level."
          }
          action={
            departmentMode !== "all" ? (
              <Button variant="outline" onClick={resetDepartmentFilter}>
                View all courses
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCourses.map((course) => (
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
              <span className="mt-3 inline-flex w-fit rounded-full bg-surface-subtle px-2 py-1 text-2xs font-medium text-text-secondary">
                {(course.departments?.length ?? 0) === 0
                  ? "General"
                  : `${course.departments!.length} department${course.departments!.length === 1 ? "" : "s"}`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </StudentShell>
  );
}
