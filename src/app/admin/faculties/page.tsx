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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Faculties &amp; Departments</h1>
          <p className="mt-1 text-muted-foreground">
            Organise university courses by faculty and department.
          </p>
        </div>
        <AddFaculty />
      </div>

      {faculties && faculties.length > 0 ? (
        <div className="space-y-4">
          {faculties.map((f) => {
            const depts = byFaculty(f.id);
            return (
              <Card key={f.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{f.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {depts.length} department{depts.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
