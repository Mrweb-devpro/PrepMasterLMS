import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddCourse } from "./add-course";
import { CourseToggle } from "./course-toggle";

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const [{ data: courses }, { data: levels }, { data: departments }, { data: shares }] =
    await Promise.all([
      supabase.from("courses").select("*").order("code"),
      supabase.from("levels").select("*"),
      supabase.from("departments").select("*"),
      (supabase as unknown as { from: (t: string) => { select: (s: string) => Promise<{ data: { course_id: string; department_id: string | null; faculty_id: string | null }[] | null }> } }).from("course_shares").select("course_id, department_id, faculty_id"),
    ]);

  const levelName = (id: string | null) =>
    levels?.find((l) => l.id === id)?.name ?? "—";
  const deptName = (id: string | null) =>
    departments?.find((d) => d.id === id)?.name ?? "—";
  const sharesFor = (courseId: string) =>
    (shares ?? []).filter((s) => s.course_id === courseId);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            University courses scoped by level and department — use checkboxes for shared GET courses.
          </p>
        </div>
        <div className="shrink-0">
          <AddCourse />
        </div>
      </div>

      {courses && courses.length > 0 ? (
        <div className="space-y-3">
          {courses.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {c.code}
                  </span>
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="outline">{levelName(c.level_id)}</Badge>
                  {(() => {
                    const extra = sharesFor(c.id);
                    const primary = c.department_id ? [deptName(c.department_id)] : [];
                    const extraNames = extra.map((s) => deptName(s.department_id)).filter(Boolean) as string[];
                    const all = [...primary, ...extraNames];
                    if (all.length === 0) return <Badge variant="secondary">Shared (all)</Badge>;
                    return (
                      <>
                        {all.slice(0, 3).map((n) => (
                          <Badge key={n} variant="secondary">
                            {n}
                          </Badge>
                        ))}
                        {all.length > 3 && <Badge variant="outline">+{all.length - 3} more</Badge>}
                      </>
                    );
                  })()}
                  <Badge variant={c.is_active ? "default" : "secondary"}>
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="shrink-0">
                  <CourseToggle id={c.id} isActive={c.is_active} />
                </div>
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
