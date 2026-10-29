import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCatalog } from "@/features/catalog/useCatalog";
import { useAdmin } from "@/lib/admin-store";
import { localDateTime } from "@/features/cbt/utils/cbt-time";
import type { Competition } from "@/lib/mock-data";
import { CompetitionQuestionBuilder, newCompetitionQuestion } from "../components/CompetitionQuestionBuilder";
import { useCompetitionQuestionBank, useCompetitions, useCreateCompetition } from "../hooks/useCompetitions";
import type { CompetitionQuestionDraft, CreateCompetitionInput } from "../services/competitions.api";

const levels = ["all", "100", "200", "300", "400", "500", "600", "Postgraduate"];
const questionCounts = [null, 10, 15, 20, 25];

type EditorForm = CreateCompetitionInput & { startsAt: string };

function formFor(competition?: Competition): EditorForm {
  return {
    title: competition?.title ?? "",
    description: competition?.description ?? "",
    courseId: competition?.courseId ?? "",
    cbtId: competition?.cbtId ?? "",
    startsAt: competition ? localDateTime(new Date(competition.startsAt)) : "",
    durationMinutes: competition?.durationMinutes ?? 30,
    level: competition?.level ?? "all",
    prizePoolNaira: competition?.prizePoolNaira ?? 0,
    prizeDescription: competition?.prizeDescription ?? "",
    questionSource: competition?.questionSource ?? "bank",
    questionLimit: competition?.questionLimit ?? null,
    customQuestions: [],
  };
}

/** Full-page competition authoring for both new and existing contests. */
export function CompetitionEditorPage({ id }: { id?: string }) {
  const navigate = useNavigate();
  const admin = useAdmin();
  const { courses, cbts } = useCatalog();
  const competitions = useCompetitions();
  const existing = id ? competitions.data?.find((item) => item.id === id) : undefined;
  const [form, setForm] = useState<EditorForm>(() => formFor());
  const [loadedId, setLoadedId] = useState<string | undefined>();
  const questionBank = useCompetitionQuestionBank(existing?.questionSource === "custom" ? existing.cbtId : undefined, Boolean(existing));
  const create = useCreateCompetition();
  const editing = Boolean(id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing || loadedId === existing.id) return;
    setForm({
      ...formFor(existing),
      customQuestions: questionBank.data?.map(({ id: _id, ...question }) => question) ?? [],
    });
    setLoadedId(existing.id);
  }, [existing, loadedId, questionBank.data]);

  useEffect(() => {
    if (!existing || existing.questionSource !== "custom" || !questionBank.data?.length) return;
    setForm((current) => current.customQuestions?.length ? current : { ...current, customQuestions: questionBank.data.map(({ id: _id, ...question }) => question) });
  }, [existing, questionBank.data]);

  if (editing && competitions.isPending) return <AdminShell title="Competition editor" back={{ to: "/admin/competitions", label: "All competitions" }}><div className="h-64 animate-pulse rounded-lg bg-surface-subtle" /></AdminShell>;
  if (editing && !existing) return <AdminShell title="Competition not found" back={{ to: "/admin/competitions", label: "All competitions" }}><p className="text-sm text-text-secondary">This competition no longer exists.</p></AdminShell>;

  const isCustom = form.questionSource === "custom";
  const submit = async () => {
    if (!form.title.trim() || !form.startsAt) { toast.error("Add a title and start time"); return; }
    if (isCustom) {
      if (!form.courseId) { toast.error("Choose a course for custom questions"); return; }
      const questions = form.customQuestions ?? [];
      const incomplete = questions.findIndex((question) => !question.text.trim() || question.options.some((option) => !option.trim()));
      if (!questions.length || incomplete >= 0) { toast.error(incomplete >= 0 ? `Question ${incomplete + 1} is incomplete` : "Add at least one custom question"); return; }
    } else {
      if (!form.cbtId) { toast.error("Choose an existing CBT question bank"); return; }
      const selected = cbts.find((cbt) => cbt.id === form.cbtId);
      if ((selected?.questionCount ?? 0) === 0) { toast.error("The selected CBT needs at least one question"); return; }
    }
    const payload: CreateCompetitionInput = { ...form, title: form.title.trim(), courseId: form.courseId || null, cbtId: isCustom ? null : form.cbtId || null, startsAt: new Date(form.startsAt).toISOString(), customQuestions: isCustom ? form.customQuestions : undefined, questionLimit: isCustom ? null : form.questionLimit };
    setSaving(true);
    try {
      if (existing) {
        await admin.updateCompetition(existing.id, payload);
        toast.success("Competition updated");
        navigate({ to: "/admin/competitions/$competitionId", params: { competitionId: existing.id } });
      } else {
        const created = await create.mutateAsync(payload);
        toast.success("Competition scheduled");
        navigate({ to: "/admin/competitions/$competitionId", params: { competitionId: created.id } });
      }
    } catch (error) { toast.error("Couldn’t save competition", { description: (error as Error).message }); } finally { setSaving(false); }
  };

  const actions = <Button disabled={saving} onClick={submit}>{saving ? <><Loader2 className="size-4 animate-spin" />Saving…</> : <><Check className="size-4" />{editing ? "Save changes" : "Schedule competition"}</>}</Button>;
  const back = editing ? { to: "/admin/competitions/$competitionId", params: { competitionId: existing!.id }, label: "Competition details" } : { to: "/admin/competitions", label: "All competitions" };
  const cancel = editing ? <Button variant="outline" asChild><Link to="/admin/competitions/$competitionId" params={{ competitionId: existing!.id }}><ArrowLeft className="size-4" />Cancel</Link></Button> : <Button variant="outline" asChild><Link to="/admin/competitions"><ArrowLeft className="size-4" />Cancel</Link></Button>;
  return <AdminShell title={editing ? "Edit competition" : "New competition"} description="Set the contest details, then choose an existing question bank or build a custom arena." back={back} actions={actions}>
    <div className="mx-auto max-w-4xl space-y-6 pb-24">
      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6"><h2 className="font-display text-lg font-semibold">Competition details</h2><div className="mt-5 space-y-4"><div><Label>Title</Label><Input className="mt-1.5" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. MAT 111 Calculus Speed Clash" /></div><div><Label>Description</Label><Textarea className="mt-1.5" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What should students expect?" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>Course</Label><select className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.courseId ?? ""} onChange={(event) => setForm({ ...form, courseId: event.target.value })}><option value="">General</option>{courses.map((course) => <option key={course.id ?? course.slug} value={course.id ?? course.slug}>{course.code} · {course.title}</option>)}</select></div><div><Label>Target level</Label><select className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>{levels.map((level) => <option key={level} value={level}>{level === "all" ? "All levels" : `${level} level`}</option>)}</select></div><div><Label>Start time</Label><Input className="mt-1.5" type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} /></div><div><Label>Duration (minutes)</Label><Input className="mt-1.5" type="number" min={1} max={600} value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div><Label>Prize pool (₦)</Label><Input className="mt-1.5" type="number" min={0} value={form.prizePoolNaira} onChange={(event) => setForm({ ...form, prizePoolNaira: Number(event.target.value) })} /></div><div><Label>Prize description</Label><Input className="mt-1.5" value={form.prizeDescription ?? ""} onChange={(event) => setForm({ ...form, prizeDescription: event.target.value })} placeholder="Optional prize details" /></div></div></div></section>
      <section className="rounded-lg border border-border bg-surface p-5 shadow-sm sm:p-6"><h2 className="font-display text-lg font-semibold">Question source</h2><p className="mt-1 text-sm text-text-secondary">Existing CBT questions stay in their original bank. Custom questions become a hidden practice set after the contest.</p><div className="mt-4 inline-flex rounded-md border border-border bg-surface-subtle p-1"><button type="button" onClick={() => setForm({ ...form, questionSource: "bank" })} className={`rounded-sm px-3 py-2 text-sm font-medium ${!isCustom ? "bg-primary-active text-primary-foreground shadow-sm" : "text-text-secondary"}`}>Existing question bank</button><button type="button" onClick={() => setForm({ ...form, questionSource: "custom", customQuestions: form.customQuestions?.length ? form.customQuestions : [newCompetitionQuestion()] })} className={`rounded-sm px-3 py-2 text-sm font-medium ${isCustom ? "bg-primary-active text-primary-foreground shadow-sm" : "text-text-secondary"}`}>Create custom questions</button></div>
        {!isCustom ? <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><Label>CBT question bank</Label><select className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.cbtId ?? ""} onChange={(event) => setForm({ ...form, cbtId: event.target.value })}><option value="">Choose a CBT</option>{cbts.map((cbt) => <option key={cbt.id} value={cbt.id}>{cbt.title} · {cbt.questionCount} questions</option>)}</select></div><div><Label>Questions for each contestant</Label><select className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.questionLimit ?? "all"} onChange={(event) => setForm({ ...form, questionLimit: event.target.value === "all" ? null : Number(event.target.value) })}>{questionCounts.map((count) => <option key={count ?? "all"} value={count ?? "all"}>{count ? `Random ${count} questions` : "All questions"}</option>)}</select></div></div> : <div className="mt-5"><p className="mb-4 rounded-md border border-primary/20 bg-primary-soft px-3 py-2 text-sm text-text-secondary">This question set stays hidden through the contest and for 90 minutes afterward, then releases automatically as a free practice CBT.</p><CompetitionQuestionBuilder questions={form.customQuestions ?? []} onChange={(customQuestions: CompetitionQuestionDraft[]) => setForm({ ...form, customQuestions })} /></div>}
      </section>
    </div>
    <div className="fixed bottom-4 right-4 z-20 flex gap-2 rounded-lg border border-border bg-surface/95 p-2 shadow-md backdrop-blur sm:right-8">{cancel}{actions}</div>
  </AdminShell>;
}
