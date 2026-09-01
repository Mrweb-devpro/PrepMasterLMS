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
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="mt-1 text-muted-foreground">
            Science subjects available for secondary practice.
          </p>
        </div>
        <AddSubject />
      </div>

      {subjects && subjects.length > 0 ? (
        <div className="space-y-2">
          {subjects.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{s.name}</span>
                  <Badge variant={s.is_active ? "default" : "secondary"}>
                    {s.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <SubjectToggle id={s.id} isActive={s.is_active} />
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
