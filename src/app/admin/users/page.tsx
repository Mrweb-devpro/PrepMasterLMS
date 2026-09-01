import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { UserRoleSelect } from "./user-role-select";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, track_id, level_id, faculty_id, department_id, created_at"
    )
    .order("created_at", { ascending: false });

  const [{ data: tracks }, { data: levels }, { data: faculties }, { data: departments }] =
    await Promise.all([
      supabase.from("tracks").select("id, name"),
      supabase.from("levels").select("id, name"),
      supabase.from("faculties").select("id, name"),
      supabase.from("departments").select("id, name"),
    ]);

  const trackName = (id: string | null) =>
    id ? tracks?.find((t) => t.id === id)?.name ?? "" : "";
  const levelName = (id: string | null) =>
    id ? levels?.find((l) => l.id === id)?.name ?? "" : "";
  const facultyName = (id: string | null) =>
    id ? faculties?.find((f) => f.id === id)?.name ?? "" : "";
  const deptName = (id: string | null) =>
    id ? departments?.find((d) => d.id === id)?.name ?? "" : "";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">
          Manage student, teacher and admin accounts.
        </p>
      </div>

      {profiles && profiles.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="hidden grid-cols-12 gap-2 border-b bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground sm:grid">
            <span className="col-span-4">User</span>
            <span className="col-span-3">Track / Level</span>
            <span className="col-span-3">Faculty / Dept</span>
            <span className="col-span-2">Role</span>
          </div>
          {profiles.map((p) => {
            const scope = p.track_id
              ? `${trackName(p.track_id)}${p.level_id ? ` · ${levelName(p.level_id)}` : ""}`
              : "No track";
            const faculty = p.faculty_id ? `${facultyName(p.faculty_id)}` : "";
            const dept = p.department_id ? deptName(p.department_id) : "";
            return (
              <div
                key={p.id}
                className="grid grid-cols-1 items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0 sm:grid-cols-12"
              >
                <div className="col-span-4">
                  <p className="font-semibold">{p.full_name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{p.id}</p>
                </div>
                <div className="col-span-3 text-muted-foreground">{scope}</div>
                <div className="col-span-3 text-muted-foreground">
                  {faculty}
                  {dept ? ` / ${dept}` : ""}
                </div>
                <div className="col-span-2">
                  <UserRoleSelect userId={p.id} role={p.role} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No users yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
