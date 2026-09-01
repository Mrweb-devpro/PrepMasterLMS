import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile } from "@/lib/session";
import { getCourses } from "@/lib/data";

export default async function CoursesPage() {
  const profile = await getProfile();
  const courses = await getCourses(profile);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight">Your courses</h1>
      <p className="mt-1 text-muted-foreground">
        Course-wise CBTs and practice for your level.
      </p>

      {courses.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed py-24 text-center">
          <p className="text-muted-foreground">
            No courses published for your level yet.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {course.code}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{course.name}</h3>
                  <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                    <span>CBTS &amp; practice</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
