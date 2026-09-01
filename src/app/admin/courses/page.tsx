import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddCourse } from "./add-course";
import { CourseToggle } from "./course-toggle";

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const [{ data: courses }, { data: levels }, { data: departments }] =
    await Promise.all([
      supabase.from("courses").select("*").order("code"),
      supabase.from("levels").select("*"),
      supabase.from("departments").select("*"),
    ]);

  const levelName = (id: string | null) =>
    levels?.find((l) => l.id === id)?.name ?? "—";
  const deptName = (id: string | null) =>
    departments?.find((d) => d.id === id)?.name ?? "—";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="mt-1 text-muted-foreground">
            University courses scoped by level and department.
          </p>
        </div>
        <AddCourse />
      </div>

      {courses && courses.length > 0 ? (
        <div className="space-y-2">
          {courses.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {c.code}
                  </span>
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="outline">{levelName(c.level_id)}</Badge>
                  {c.department_id && (
                    <Badge variant="secondary">{deptName(c.department_id)}</Badge>
                  )}
                  <Badge variant={c.is_active ? "default" : "secondary"}>
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CourseToggle id={c.id} isActive={c.is_active} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            No courses yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
