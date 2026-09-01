"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { createCourse } from "../actions";

type Track = { id: string; name: string; type: string };
type Level = { id: string; track_id: string; name: string; is_active: boolean };
type Faculty = { id: string; name: string };
type Department = { id: string; faculty_id: string; name: string };
type Semester = { id: string; name: string };

export function AddCourse() {
  const [open, setOpen] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [trackId, setTrackId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [facultyIds, setFacultyIds] = useState<string[]>([]);
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [semesterId, setSemesterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const sb = createClient();
    Promise.all([
      sb.from("tracks").select("*"),
      sb.from("levels").select("*"),
      sb.from("faculties").select("*").eq("is_active", true),
      sb.from("departments").select("*").eq("is_active", true),
      sb.from("semesters").select("*").order("order"),
    ]).then(([t, l, f, d, s]) => {
      if (t.data) setTracks(t.data);
      if (l.data) setLevels(l.data);
      if (f.data) setFaculties(f.data);
      if (d.data) setDepartments(d.data);
      if (s.data) setSemesters(s.data);
    });
  }, [open]);

  const trackLevels = useMemo(
    () => levels.filter((l) => l.track_id === trackId && l.is_active),
    [levels, trackId]
  );
  const selectedTrack = tracks.find((t) => t.id === trackId);
  const isUniversityTrack = selectedTrack?.type === "university";

  const availableDepartments = useMemo(() => {
    if (facultyIds.length === 0) return departments;
    return departments.filter((d) => facultyIds.includes(d.faculty_id));
  }, [departments, facultyIds]);

  function toggleFaculty(id: string) {
    setFacultyIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    // also clear departments that are no longer visible
    setDepartmentIds((prev) => prev.filter((did) => {
      const dept = departments.find((d) => d.id === did);
      return dept ? facultyIds.includes(dept.faculty_id) || id === dept.faculty_id : false;
    }));
  }

  function toggleDept(id: string) {
    setDepartmentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    const result = await createCourse({
      code,
      name,
      track_id: trackId,
      level_id: levelId,
      faculty_id: facultyIds[0] ?? null,
      department_id: departmentIds[0] ?? null,
      faculty_ids: facultyIds,
      department_ids: departmentIds,
      semester_id: semesterId || null,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setCode("");
    setName("");
    setFacultyIds([]);
    setDepartmentIds([]);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add course
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add a course</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  placeholder="e.g. GET 102"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={semesterId} onValueChange={setSemesterId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Course name</Label>
              <Input
                placeholder="e.g. Ethics & Citizenship"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Track</Label>
                <Select
                  value={trackId}
                  onValueChange={(v) => {
                    setTrackId(v);
                    setLevelId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {tracks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Select value={levelId} onValueChange={setLevelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {trackLevels.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {isUniversityTrack && (
              <>
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <div>
                    <Label className="text-sm font-semibold">Faculties sharing this course</Label>
                    <p className="text-xs text-muted-foreground">
                      Check the faculties that offer this course. Leave unchecked for a course shared across all faculties (e.g. general GET).
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {faculties.map((f) => (
                      <label key={f.id} className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent">
                        <Checkbox
                          checked={facultyIds.includes(f.id)}
                          onCheckedChange={() => toggleFaculty(f.id)}
                        />
                        <span>{f.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <div>
                    <Label className="text-sm font-semibold">Departments sharing this course</Label>
                    <p className="text-xs text-muted-foreground">
                      Check specific departments. Leave unchecked to share across all departments in the selected faculties (or all if no faculty selected).
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {availableDepartments.map((d) => (
                      <label key={d.id} className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent">
                        <Checkbox
                          checked={departmentIds.includes(d.id)}
                          onCheckedChange={() => toggleDept(d.id)}
                        />
                        <span className="truncate">{d.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{faculties.find((f) => f.id === d.faculty_id)?.name}</span>
                      </label>
                    ))}
                    {availableDepartments.length === 0 && (
                      <p className="col-span-2 text-sm text-muted-foreground">Select a faculty first or no departments available.</p>
                    )}
                  </div>
                </div>
              </>
            )}
            {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading || !code.trim() || !name.trim() || !trackId || !levelId} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
