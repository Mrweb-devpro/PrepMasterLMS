"use client";

import { useEffect, useState } from "react";
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
import { createQuestionBank } from "../actions";

export function CreateBank() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"general" | "subject" | "course">("general");
  const [subjectId, setSubjectId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const sb = createClient();
    Promise.all([
      sb.from("subjects").select("id, name").order("name"),
      sb.from("courses").select("id, code, name").order("code"),
    ]).then(([s, c]) => {
      if (s.data) setSubjects(s.data);
      if (c.data) setCourses(c.data);
    });
  }, [open]);

  async function submit() {
    setLoading(true);
    setError(null);
    const result = await createQuestionBank({
      name,
      subject_id: scope === "subject" ? subjectId : null,
      course_id: scope === "course" ? courseId : null,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    setName("");
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        New bank
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a question bank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Bank name</Label>
              <Input
                placeholder="e.g. Physics Motion & Forces"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Scope</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as typeof scope)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="subject">Subject (secondary)</SelectItem>
                  <SelectItem value="course">Course (university)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scope === "subject" && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {scope === "course" && (
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
