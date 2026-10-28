import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCatalog } from "@/features/catalog/useCatalog";
import { useCreateCompetition } from "../hooks/useCompetitions";

const levels = ["all", "100", "200", "300", "400", "500", "600", "Postgraduate"];

export function NewCompetitionPage() {
  const navigate = useNavigate();
  const { courses, cbts } = useCatalog();
  const create = useCreateCompetition();
  const [form, setForm] = useState({ title: "", description: "", courseId: "", cbtId: "", startsAt: "", durationMinutes: 30, level: "all", prizePoolNaira: 0 });
  const submit = () => {
    if (!form.title.trim() || !form.startsAt) {
      toast.error("Add a title and start time");
      return;
    }
    create.mutate({ ...form, courseId: form.courseId || null, cbtId: form.cbtId || null, startsAt: new Date(form.startsAt).toISOString() }, {
      onSuccess: () => { toast.success("Competition scheduled"); navigate({ to: "/admin/competitions" }); },
      onError: (error: Error) => toast.error("Couldn’t schedule competition", { description: error.message }),
    });
  };
  return <AdminShell title="New competition" description="Set the arena, question bank, timing, and prize pool." back={{ to: "/admin/competitions", label: "All competitions" }} actions={<Button disabled={create.isPending} onClick={submit}>{create.isPending ? "Scheduling…" : "Schedule competition"}</Button>}>
    <div className="max-w-2xl space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6">
      <div><Label>Title</Label><Input className="mt-1.5" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. MAT 111 Calculus Speed Clash" /></div>
      <div><Label>Description</Label><Textarea className="mt-1.5" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What should students expect?" /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><Label>Course</Label><select className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}><option value="">General</option>{courses.filter((course) => course.id).map((course) => <option key={course.id} value={course.id}>{course.code} · {course.title}</option>)}</select></div><div><Label>CBT question bank</Label><select className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.cbtId} onChange={(event) => setForm({ ...form, cbtId: event.target.value })}><option value="">Choose later</option>{cbts.map((cbt) => <option key={cbt.id} value={cbt.id}>{cbt.title}</option>)}</select></div></div>
      <div className="grid gap-4 sm:grid-cols-3"><div><Label>Start</Label><Input className="mt-1.5" type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></div><div><Label>Minutes</Label><Input className="mt-1.5" type="number" min="1" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} /></div><div><Label>Prize pool (₦)</Label><Input className="mt-1.5" type="number" min="0" value={form.prizePoolNaira} onChange={(event) => setForm({ ...form, prizePoolNaira: Number(event.target.value) })} /></div></div>
      <div><Label>Eligible level</Label><select className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>{levels.map((level) => <option key={level} value={level}>{level === "all" ? "All levels" : `${level} level`}</option>)}</select></div>
    </div>
  </AdminShell>;
}
