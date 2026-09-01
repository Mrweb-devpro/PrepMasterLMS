"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { createMaterial, updateMaterial } from "../actions";

type Subject = { id: string; name: string };
type Course = { id: string; name: string; code: string };

function MaterialFormInner({
  subjects,
  courses,
  initial,
  onClose,
}: {
  subjects: Subject[];
  courses: Course[];
  initial?: { id: string; title: string; is_premium: boolean; file_url: string };
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [isPremium, setIsPremium] = useState(initial?.is_premium ?? false);
  const [fileUrl, setFileUrl] = useState(initial?.file_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    if (initial) {
      const res = await updateMaterial(initial.id, {
        title,
        is_premium: isPremium,
        file_url: fileUrl || initial.file_url,
      });
      setBusy(false);
      if ("error" in res) {
        setError(res.error ?? "Failed");
        return;
      }
      onClose();
      router.refresh();
      return;
    }

    const fd = new FormData();
    fd.set("title", title);
    fd.set("is_premium", String(isPremium));
    if (subjectId) fd.set("subject_id", subjectId);
    if (courseId) fd.set("course_id", courseId);
    if (file) fd.set("file", file);
    if (fileUrl) fd.set("file_url", fileUrl);

    const res = await createMaterial(fd);
    setBusy(false);
    if ("error" in res) {
      setError(res.error ?? "Failed");
      return;
    }
    onClose();
    router.refresh();
  }

  const disabled = !title.trim() || (!subjectId && !courseId && !initial) || (!file && !fileUrl && !initial);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. SS2 Physics — Waves" />
      </div>

      {!initial && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Subject (optional)</Label>
            <select
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                if (e.target.value) setCourseId("");
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">— None —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Course (optional)</Label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                if (e.target.value) setSubjectId("");
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">— None —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>File {initial ? "(leave to keep current)" : ""}</Label>
        <Input
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="space-y-2">
        <Label>Or file URL</Label>
        <Input value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." />
      </div>

      <div className="flex items-center justify-between rounded-md border px-3 py-2">
        <Label className="mb-0">Premium (package-gated)</Label>
        <Switch checked={isPremium} onCheckedChange={setIsPremium} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={busy || Boolean(disabled)}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : initial ? <Pencil className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {initial ? "Save" : "Upload"}
        </Button>
      </div>
    </div>
  );
}

export function AddMaterialDialog({ subjects, courses }: { subjects: Subject[]; courses: Course[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add material
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add material</DialogTitle>
          </DialogHeader>
          <MaterialFormInner subjects={subjects} courses={courses} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditMaterialDialog({
  material,
  subjects,
  courses,
}: {
  material: { id: string; title: string; is_premium: boolean; file_url: string };
  subjects: Subject[];
  courses: Course[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit material</DialogTitle>
          </DialogHeader>
          <MaterialFormInner subjects={subjects} courses={courses} initial={material} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
