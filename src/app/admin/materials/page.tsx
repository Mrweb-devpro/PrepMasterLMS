import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { AddMaterialDialog } from "./material-form";
import { MaterialControls } from "./material-controls";

export default async function AdminMaterialsPage() {
  const supabase = await createClient();
  const [{ data: materials }, { data: subjects }, { data: courses }] = await Promise.all([
    supabase.from("materials").select("*").order("created_at", { ascending: false }),
    supabase.from("subjects").select("id, name").order("name"),
    supabase.from("courses").select("id, name, code").order("name"),
  ]);
  const subjectMap = new Map((subjects ?? []).map((s) => [s.id, s.name]));
  const courseMap = new Map(((courses ?? []) as { id: string; name: string; code: string }[]).map((c) => [c.id, `${c.code} — ${c.name}`]));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Materials</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Upload PDFs, notes and resources students can read. Scope to a subject or course; mark premium to gate behind a package.
          </p>
        </div>
        <div className="shrink-0">
          <AddMaterialDialog subjects={subjects ?? []} courses={courses ?? []} />
        </div>
      </div>

      {materials && materials.length > 0 ? (
        <div className="space-y-3">
          {materials.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{m.title}</p>
                      {m.is_premium && <Badge variant="secondary">Premium</Badge>}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {m.subject_id ? subjectMap.get(m.subject_id) ?? "Subject" : m.course_id ? courseMap.get(m.course_id) ?? "Course" : "Global"}
                      {" · "}
                      <a href={m.file_url} target="_blank" rel="noreferrer" className="underline hover:text-foreground">
                        Open file
                      </a>
                    </p>
                  </div>
                </div>
                <MaterialControls material={m} subjects={subjects ?? []} courses={courses ?? []} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No materials yet. Upload your first file.</p>
            <div className="mt-4 flex justify-center">
              <AddMaterialDialog subjects={subjects ?? []} courses={courses ?? []} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
