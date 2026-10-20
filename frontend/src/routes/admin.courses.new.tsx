import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Folder, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { Field, KV, Panel, PanelHeader, Stepper } from "@/features/admin/components/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/lib/admin-store";
import { CATEGORIES, type CategorySlug, type Subfolder } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/courses/new")({
  head: () => ({
    meta: [
      { title: "Create course | PrepMaster Admin" },
      { name: "description", content: "Set up a new course and its folders." },
      { property: "og:title", content: "Create course | PrepMaster Admin" },
      { property: "og:description", content: "Set up a new course and its folders." },
    ],
  }),
  component: NewCourse,
});

const COLORS = ["#3b6cff", "#16a34a", "#e5484d", "#c27a12", "#8b5cf6", "#0ea5e9"];
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function NewCourse() {
  const admin = useAdmin();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(COLORS[0]!);
  const [folders, setFolders] = useState<Record<CategorySlug, Subfolder[]>>({
    "lecture-notes": [{ slug: "week-1", name: "Week 1" }],
    "past-questions": [{ slug: "2024", name: "2024 Papers" }],
    textbooks: [{ slug: "core-texts", name: "Core Texts" }],
  });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const addFolder = (cat: CategorySlug) => {
    const name = (draft[cat] ?? "").trim();
    if (!name) return;
    setFolders((p) => ({ ...p, [cat]: [...p[cat], { slug: slugify(name), name }] }));
    setDraft((d) => ({ ...d, [cat]: "" }));
  };

  const next = () => {
    if (step === 0 && (!code.trim() || !title.trim())) {
      toast.error("Add a course code and title");
      return;
    }
    setStep((s) => s + 1);
  };

  const create = async () => {
    if (saving) return;
    setSaving(true);
    const slug = `${slugify(code)}-${Date.now().toString(36)}`;
    try {
      await admin.addCourse({ slug, code: code.toUpperCase(), title, color, subfolders: folders });
    } catch (e) {
      toast.error("Couldn't create the course", { description: (e as Error).message });
      setSaving(false);
      return;
    }
    toast.success("Course created", { description: `${code.toUpperCase()} — ${title}` });
    navigate({ to: "/admin/courses/$slug", params: { slug } });
  };

  return (
    <AdminShell
      title="Create course"
      description="Details, folders, then a final preview."
      back={{ to: "/admin/courses", label: "All courses" }}
    >
      <Stepper steps={["Details", "Folders", "Preview"]} current={step} onStep={setStep} />

      {step === 0 && (
        <Panel className="max-w-2xl space-y-5 p-5 md:p-6">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <Field label="Code">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="BIO 201" />
            </Field>
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Molecular Biology"
              />
            </Field>
          </div>
          <Field label="Colour">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={cn(
                    "size-8 rounded-full ring-offset-2 ring-offset-surface transition",
                    color === c && "ring-2 ring-foreground",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </Field>
        </Panel>
      )}

      {step === 1 && (
        <div className="grid gap-4 lg:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Panel key={cat.slug}>
              <PanelHeader
                title={cat.name}
                aside={<span className="text-xs text-text-muted">{folders[cat.slug].length}</span>}
              />
              <div className="space-y-1.5 p-4">
                {folders[cat.slug].map((f) => (
                  <div
                    key={f.slug}
                    className="flex h-9 items-center gap-2 rounded-md bg-surface-subtle px-3 text-sm"
                  >
                    <Folder className="size-3.5 text-text-muted" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <button
                      aria-label="Remove"
                      onClick={() =>
                        setFolders((p) => ({
                          ...p,
                          [cat.slug]: p[cat.slug].filter((x) => x.slug !== f.slug),
                        }))
                      }
                      className="text-text-muted hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addFolder(cat.slug);
                  }}
                  className="flex gap-2 pt-1"
                >
                  <Input
                    value={draft[cat.slug] ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, [cat.slug]: e.target.value }))}
                    placeholder="New folder"
                    className="h-9"
                  />
                  <Button type="submit" size="icon" variant="outline" aria-label="Add folder">
                    <Plus />
                  </Button>
                </form>
              </div>
            </Panel>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Panel className="h-fit p-5">
            <span
              className="flex size-12 items-center justify-center rounded-md"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Folder className="size-6" />
            </span>
            <p className="mt-3 text-xs text-text-muted">{code.toUpperCase()}</p>
            <p className="font-display text-lg font-semibold">{title}</p>
            <div className="mt-3 border-t border-border pt-2">
              {CATEGORIES.map((c) => (
                <KV key={c.slug} k={c.name} v={`${folders[c.slug].length} folders`} />
              ))}
            </div>
          </Panel>
          <Panel>
            <PanelHeader
              title="Folder structure"
              aside={
                <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
                  Edit
                </Button>
              }
            />
            <div className="divide-y divide-border">
              {CATEGORIES.map((c) => (
                <div key={c.slug} className="px-5 py-4">
                  <p className="text-sm font-medium">{c.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {folders[c.slug].map((f) => (
                      <span
                        key={f.slug}
                        className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 py-1 text-xs"
                      >
                        <Folder className="size-3" />
                        {f.name}
                      </span>
                    ))}
                    {folders[c.slug].length === 0 && (
                      <span className="text-xs text-text-muted">No folders</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <div className="sticky bottom-4 mt-6 flex items-center justify-between rounded-lg border border-border bg-surface/90 p-3 shadow-md backdrop-blur">
        <Button variant="ghost" disabled={step === 0 || saving} onClick={() => setStep((s) => s - 1)}>
          <ArrowLeft />
          Back
        </Button>
        {step < 2 ? (
          <Button disabled={saving} onClick={next}>
            Continue
            <ArrowRight />
          </Button>
        ) : (
          <Button disabled={saving} onClick={create}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating course...
              </>
            ) : (
              <>
                <Check className="size-4" />
                Create course
              </>
            )}
          </Button>
        )}
      </div>
    </AdminShell>
  );
}
