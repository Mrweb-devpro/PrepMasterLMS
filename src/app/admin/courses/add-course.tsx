"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
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
  const trackDepartments = useMemo(
    () => departments.filter((d) => d.faculty_id === facultyId),
    [departments, facultyId]
  );
  const selectedTrack = tracks.find((t) => t.id === trackId);
  const isUniversityTrack = selectedTrack?.type === "university";

  async function submit() {
    setLoading(true);
    setError(null);
    const result = await createCourse({
      code,
      name,
      track_id: trackId,
      level_id: levelId,
      faculty_id: facultyId || null,
      department_id: departmentId || null,
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
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add course
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
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
            <div className="grid grid-cols-2 gap-3">
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Faculty</Label>
                    <Select
                      value={facultyId}
                      onValueChange={(v) => {
                        setFacultyId(v);
                        setDepartmentId("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Shared / any" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select value={departmentId} onValueChange={setDepartmentId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Shared / any" />
                      </SelectTrigger>
                      <SelectContent>
                        {trackDepartments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave faculty/department blank for a course shared across all
                  departments (e.g. GET courses).
                </p>
              </>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading || !code.trim() || !name.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
