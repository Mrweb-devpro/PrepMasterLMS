import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddSubject } from "./add-subject";
import { SubjectToggle } from "./subject-toggle";

export default async function AdminSubjectsPage() {
  const supabase = await createClient();
  const { data: subjects } = await supabase
    .from("subjects")
    .select("*")
    .order("name");

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Subjects</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Science subjects available for secondary practice.
          </p>
        </div>
        <div className="shrink-0">
          <AddSubject />
        </div>
      </div>

      {subjects && subjects.length > 0 ? (
        <div className="space-y-3">
          {subjects.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.name}</span>
                  <Badge variant={s.is_active ? "default" : "secondary"}>
                    {s.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="shrink-0">
                  <SubjectToggle id={s.id} isActive={s.is_active} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-muted-foreground">
            No subjects yet.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
