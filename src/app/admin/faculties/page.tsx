import { Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { AddFaculty } from "./add-faculty";
import {
  AddDepartment,
  ToggleFacultyButton,
  DeleteDepartmentButton,
} from "./department-controls";

export default async function FacultiesPage() {
  const supabase = await createClient();
  const { data: faculties } = await supabase
    .from("faculties")
    .select("*")
    .order("name");
  const { data: departments } = await supabase
    .from("departments")
    .select("*")
    .order("name");

  const byFaculty = (facultyId: string) =>
    (departments ?? []).filter((d) => d.faculty_id === facultyId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Faculties &amp; Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Organise university courses by faculty and department.
          </p>
        </div>
        <div className="shrink-0">
          <AddFaculty />
        </div>
      </div>

      {faculties && faculties.length > 0 ? (
        <div className="space-y-4">
          {faculties.map((f) => {
            const depts = byFaculty(f.id);
            return (
              <Card key={f.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-semibold">{f.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {depts.length} department{depts.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={f.is_active ? "default" : "secondary"}>
                        {f.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <ToggleFacultyButton id={f.id} isActive={f.is_active} />
                      <AddDepartment facultyId={f.id} />
                    </div>
                  </div>
                  {depts.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {depts.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-sm"
                        >
                          {d.name}
                          <DeleteDepartmentButton id={d.id} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No faculties yet.</p>
            <div className="mt-4">
              <AddFaculty />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
