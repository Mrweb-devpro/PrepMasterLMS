import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Folder, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Panel } from "@/features/admin/components/parts";
import { useAdmin } from "@/lib/admin-store";
import { CATEGORIES, type CategorySlug, type Course, type Subfolder } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/courses/$slug_/edit")({
  head: () => ({
    meta: [
      { title: "Edit course | PrepMaster Admin" },
      { name: "description", content: "Update course details and folders." },
    ],
  }),
  component: EditCoursePage,
});

const COLORS = ["#3b6cff", "#16a34a", "#e5484d", "#c27a12", "#8b5cf6", "#0ea5e9"];
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function EditCoursePage() {
  const { slug } = Route.useParams();
  const admin = useAdmin();
  const course = admin.courses.find((item) => item.slug === slug);

  if (!course) {
    return (
      <AdminShell title="Course not found" back={{ to: "/admin/courses", label: "All courses" }}>
        <p className="p-6 text-text-muted">This course does not exist.</p>
      </AdminShell>
    );
  }

  return <CourseEditForm course={course} />;
}

function CourseEditForm({ course }: { course: Course }) {
  const admin = useAdmin();
  const navigate = useNavigate();
  const [code, setCode] = useState(course.code);
  const [title, setTitle] = useState(course.title);
  const [color, setColor] = useState(course.color);
  const [folders, setFolders] = useState<Record<CategorySlug, Subfolder[]>>({
    "lecture-notes": course.subfolders["lecture-notes"] ?? [],
    "past-questions": course.subfolders["past-questions"] ?? [],
    textbooks: course.subfolders.textbooks ?? [],
  });
  const [drafts, setDrafts] = useState<Record<CategorySlug, string>>({
    "lecture-notes": "",
    "past-questions": "",
    textbooks: "",
  });
  const [saving, setSaving] = useState(false);

  const addFolder = (category: CategorySlug) => {
    const name = drafts[category].trim();
    const slug = slugify(name);
    if (!name || !slug) return;
    if (folders[category].some((folder) => folder.slug === slug)) {
      toast.error("A folder with this name already exists in this section");
      return;
    }
    setFolders((items) => ({ ...items, [category]: [...items[category], { slug, name }] }));
    setDrafts((items) => ({ ...items, [category]: "" }));
  };

  const removeFolder = (category: CategorySlug, folderSlug: string) => {
    setFolders((items) => ({
      ...items,
      [category]: items[category].filter((folder) => folder.slug !== folderSlug),
    }));
  };

  const save = async () => {
    if (!code.trim() || !title.trim()) {
      toast.error("Course code and title are required");
      return;
    }
    setSaving(true);
    try {
      await admin.updateCourse(course.slug, {
        code: code.toUpperCase().trim(),
        title: title.trim(),
        color,
        subfolders: folders,
      });
      toast.success("Course updated successfully");
      navigate({ to: "/admin/courses/$slug", params: { slug: course.slug } });
    } catch (error) {
      toast.error("Couldn't update course", { description: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title={`Edit ${course.code}`}
      description="Update course information and organize folders."
      back={{ to: "/admin/courses/$slug", params: { slug: course.slug }, label: course.title }}
      actions={
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save changes
        </Button>
      }
    >
      <div className="grid max-w-4xl gap-6">
        <Panel className="space-y-5 p-5 md:p-6">
          <h2 className="text-base font-semibold">Course details</h2>
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <Field label="Code">
              <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="BIO 201" />
            </Field>
            <Field label="Title">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Molecular Biology" />
            </Field>
          </div>
          <Field label="Colour accent">
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  aria-label={`Use ${option} as the course colour`}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border-2 border-border transition-transform hover:scale-110",
                    color === option && "ring-2 ring-foreground",
                  )}
                  style={{ backgroundColor: option }}
                >
                  {color === option && <Check className="size-4 text-primary-foreground" />}
                </button>
              ))}
            </div>
          </Field>
        </Panel>

        <Panel className="space-y-6 p-5 md:p-6">
          <div>
            <h2 className="text-base font-semibold">Folders and sections</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Add folders or remove empty ones. Move any materials first before removing their folder.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {CATEGORIES.map((category) => (
              <div key={category.slug} className="flex flex-col rounded-lg border border-border bg-surface-subtle/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <Folder className="size-4 text-primary" />
                  {category.name}
                </div>
                <div className="mb-4 flex-1 space-y-2">
                  {folders[category.slug].length === 0 ? (
                    <p className="text-xs italic text-text-muted">No folders yet</p>
                  ) : (
                    folders[category.slug].map((folder) => (
                      <div
                        key={folder.slug}
                        className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs"
                      >
                        <span className="truncate">{folder.name}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${folder.name}`}
                          onClick={() => removeFolder(category.slug, folder.slug)}
                          className="shrink-0 text-text-muted transition-colors hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-1.5">
                  <Input
                    value={drafts[category.slug]}
                    onChange={(event) => setDrafts((items) => ({ ...items, [category.slug]: event.target.value }))}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addFolder(category.slug);
                      }
                    }}
                    placeholder="New folder name"
                    className="h-8 text-xs"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={() => addFolder(category.slug)}>
                    <Plus className="size-3.5" />
                    <span className="sr-only">Add folder</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AdminShell>
  );
}
