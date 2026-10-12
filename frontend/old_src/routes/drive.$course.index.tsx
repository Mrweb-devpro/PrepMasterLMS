import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { FolderClosed } from "lucide-react";
import { StudentShell } from "@/components/prep/StudentShell";
import { Breadcrumbs, EmptyState, PageHeader } from "@/components/prep/bits";
import { CATEGORIES, filesIn, getCourse } from "@/lib/mock-data";

export const Route = createFileRoute("/drive/$course/")({
  loader: ({ params }) => {
    const course = getCourse(params.course);
    if (!course) throw notFound();
    return { courseSlug: course.slug };
  },
  head: () => ({
    meta: [
      { title: "Course folder — PrepMaster Drive" },
      { name: "description", content: "Lecture notes, past questions and textbooks for this course." },
      { property: "og:title", content: "Course folder — PrepMaster Drive" },
      { property: "og:description", content: "Lecture notes, past questions and textbooks for this course." },
    ],
  }),
  component: CoursePage,
});

function CoursePage() {
  const { course: courseSlug } = Route.useParams();
  const course = getCourse(courseSlug);

  if (!course) {
    return (
      <StudentShell>
        <EmptyState title="Course not found" />
      </StudentShell>
    );
  }

  return (
    <StudentShell>
      <Breadcrumbs items={[{ label: "Drive", to: "/drive" }, { label: course.title }]} />
      <PageHeader title={course.title} subtitle={`${course.code} · ${filesIn(course.slug).length} files`} />

      <div className="grid gap-4 sm:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            to="/drive/$course/$category"
            params={{ course: course.slug, category: cat.slug }}
            className="rounded-lg border border-border bg-surface p-5 shadow-sm card-hover"
          >
            <FolderClosed className="mb-4 size-6 text-primary" />
            <h3 className="font-semibold">{cat.name}</h3>
            <p className="mt-1 text-sm text-text-muted">
              {course.subfolders[cat.slug].length} sub-folders ·{" "}
              {filesIn(course.slug, cat.slug).length} files
            </p>
          </Link>
        ))}
      </div>
    </StudentShell>
  );
}
