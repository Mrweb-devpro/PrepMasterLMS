import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useSession } from "@/features/auth/session";
import { catalogKey, updateMockMaterial, useCatalogQuery } from "@/features/catalog/useCatalog";
import { api, toKobo } from "./api/client";
import { LIVE } from "./api/config";
import {
  cbts as seedCbts,
  courses as seedCourses,
  students as seedStudents,
  type Cbt,
  type CategorySlug,
  type Course,
  type Subfolder,
  type Student,
} from "./mock-data";

export interface Warning {
  reason: string;
  date: string;
}

interface AdminState {
  courses: Course[];
  cbts: Cbt[];
  students: Student[];
  suspended: string[];
  /** Returns the new course's slug. */
  addCourse: (c: Course) => Promise<string>;
  updateCourse: (
    slugOrId: string,
    patch: {
      code?: string;
      title?: string;
      color?: string;
      description?: string;
      level?: string;
      departments?: string[];
      subfolders?: Record<CategorySlug, Subfolder[]>;
    },
  ) => Promise<void>;
  moveMaterial: (materialId: string, targetCategory: CategorySlug, targetSubfolder: string) => Promise<void>;
  /** Returns the new CBT's id. */
  addCbt: (c: Cbt) => Promise<string>;
  toggleReveal: (id: string) => void;
  togglePause: (id: string) => void;
  /** Edit settings and/or questions of an existing CBT (live or not). */
  updateCbt: (id: string, patch: Partial<Cbt>) => Promise<void>;
  toggleSuspend: (ids: string[], suspend: boolean, reason?: string) => void;
  suspendReasons: Record<string, { reason: string; date: string }>;
  warnings: Record<string, Warning[]>;
  warn: (ids: string[], reason: string) => void;
  isSuspended: (id: string) => boolean;
}

interface StudentRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  created_at: string;
  suspended_at: string | null;
  suspend_reason: string | null;
  warnings: { reason: string; created_at: string }[];
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const today = () => fmt(new Date().toISOString());
const studentsKey = ["admin-students"] as const;

const g = globalThis as { __adminCtx?: React.Context<AdminState | null> };
const Ctx = (g.__adminCtx ??= createContext<AdminState | null>(null));

const fail = (what: string) => (e: Error) => toast.error(what, { description: e.message });

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const isAdmin = user?.role === "admin";
  const catalog = useCatalogQuery();
  const liveStudents = useQuery({
    queryKey: studentsKey,
    queryFn: () => api.get<StudentRow[]>("/admin/students"),
    enabled: LIVE && isAdmin,
  });

  const [courses, setCourses] = useState<Course[]>(seedCourses);
  const [cbts, setCbts] = useState<Cbt[]>(seedCbts);
  const [suspended, setSuspended] = useState<string[]>([]);
  const [suspendReasons, setReasons] = useState<Record<string, { reason: string; date: string }>>({});
  const [warnings, setWarnings] = useState<Record<string, Warning[]>>({});

  const value = useMemo<AdminState>(() => {
    const refreshCatalog = () => qc.invalidateQueries({ queryKey: catalogKey });
    const refreshStudents = () => qc.invalidateQueries({ queryKey: studentsKey });

    if (LIVE) {
      const rows = liveStudents.data ?? [];
      const liveCourses = catalog.data?.courses ?? [];
      const liveSuspended = rows.filter((r) => r.suspended_at).map((r) => r.id);
      return {
        courses: liveCourses,
        cbts: catalog.data?.cbts ?? [],
        students: rows.map((r) => ({
          id: r.id,
          name: `${r.first_name} ${r.last_name}`.trim() || r.email,
          email: r.email,
          ...(r.gender ? { gender: r.gender } : {}),
          joinedAt: r.created_at.slice(0, 10),
          verified: true,
        })),
        suspended: liveSuspended,
        suspendReasons: Object.fromEntries(
          rows
            .filter((r) => r.suspended_at)
            .map((r) => [r.id, { reason: r.suspend_reason ?? "", date: fmt(r.suspended_at!) }]),
        ),
        warnings: Object.fromEntries(
          rows.map((r) => [
            r.id,
            [...r.warnings]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map((w) => ({ reason: w.reason, date: fmt(w.created_at) })),
          ]),
        ),
        isSuspended: (id) => liveSuspended.includes(id),
        addCourse: async (c) => {
          const subfolders = (Object.keys(c.subfolders) as (keyof Course["subfolders"])[]).flatMap(
            (category) => c.subfolders[category].map((s) => ({ category, slug: s.slug, name: s.name })),
          );
          await api.post("/courses", {
            slug: c.slug,
            code: c.code,
            title: c.title,
            color: c.color,
            level: c.level ?? "all",
            departments: c.departments ?? [],
            subfolders,
          });
          await refreshCatalog();
          return c.slug;
        },
        updateCourse: async (slugOrId, patch) => {
          const course = liveCourses.find((item) => item.id === slugOrId || item.slug === slugOrId);
          if (!course?.id) throw new Error("Course not found");
          const subfolders = patch.subfolders
            ? (Object.keys(patch.subfolders) as CategorySlug[]).flatMap((category) =>
                patch.subfolders![category].map((folder) => ({ category, slug: folder.slug, name: folder.name })),
              )
            : undefined;
          await api.patch(`/courses/${course.id}`, {
            ...(patch.code !== undefined ? { code: patch.code } : {}),
            ...(patch.title !== undefined ? { title: patch.title } : {}),
            ...(patch.color !== undefined ? { color: patch.color } : {}),
            ...(patch.description !== undefined ? { description: patch.description } : {}),
            ...(patch.level !== undefined ? { level: patch.level } : {}),
            ...(patch.departments !== undefined ? { departments: patch.departments } : {}),
            ...(subfolders !== undefined ? { subfolders } : {}),
          });
          await refreshCatalog();
        },
        moveMaterial: async (materialId, targetCategory, targetSubfolder) => {
          await api.patch(`/materials/${materialId}`, {
            category: targetCategory,
            subfolder: targetSubfolder,
          });
          await refreshCatalog();
        },
        addCbt: async (c) => {
          const course = liveCourses.find((x) => x.slug === c.courseSlug);
          if (!course?.id) throw new Error("Pick a course first");
          const attempts = Number.parseInt(c.retakePolicy, 10);
          const row = await api.post<{ id: string }>("/cbts/admin", {
            courseId: course.id,
            title: c.title,
            mode: c.kind,
            durationMinutes: c.minutes,
            ...(c.scheduledFor ? { opensAt: c.scheduledFor } : {}),
            ...(c.closesAt ? { closesAt: c.closesAt } : {}),
            priceKobo: c.paid ? toKobo(c.price ?? 0) : 0,
            maxAttempts: c.kind === "live" || Number.isNaN(attempts) ? null : attempts,
            revealResults: c.revealResults !== false,
            published: true,
            questions: c.questions.map((q) => ({
              text: q.text,
              options: q.options,
              answerIndex: q.answerIndex,
              ...(q.topic ? { topic: q.topic } : {}),
            })),
          });
          await refreshCatalog();
          return row.id;
        },
        toggleReveal: (id) => {
          const cbt = catalog.data?.cbts.find((c) => c.id === id);
          api
            .patch(`/cbts/admin/${id}`, { revealResults: cbt?.revealResults === false })
            .then(refreshCatalog, fail("Couldn't update results"));
        },
        togglePause: (id) => {
          const cbt = catalog.data?.cbts.find((c) => c.id === id);
          api
            .patch(`/cbts/admin/${id}`, { paused: !cbt?.paused })
            .then(refreshCatalog, fail("Couldn't update CBT"));
        },
        updateCbt: async (id, c) => {
          const attempts = c.retakePolicy ? Number.parseInt(c.retakePolicy, 10) : undefined;
          await api.patch(`/cbts/admin/${id}`, {
            ...(c.title !== undefined ? { title: c.title } : {}),
            ...(c.minutes !== undefined ? { durationMinutes: c.minutes } : {}),
            ...(c.scheduledFor ? { opensAt: new Date(c.scheduledFor).toISOString() } : {}),
            ...(c.closesAt ? { closesAt: new Date(c.closesAt).toISOString() } : {}),
            ...(c.paid !== undefined ? { priceKobo: c.paid ? toKobo(c.price ?? 0) : 0 } : {}),
            ...(c.retakePolicy !== undefined
              ? { maxAttempts: attempts === undefined || Number.isNaN(attempts) ? null : attempts }
              : {}),
            ...(c.questions
              ? {
                  questions: c.questions.map((q) => ({
                    ...(/^[0-9a-f-]{36}$/i.test(q.id) ? { id: q.id } : {}),
                    text: q.text,
                    options: q.options,
                    answerIndex: q.answerIndex,
                    ...(q.topic ? { topic: q.topic } : {}),
                  })),
                }
              : {}),
          });
          await Promise.all([refreshCatalog(), qc.invalidateQueries({ queryKey: ["admin-cbt", id] })]);
        },
        toggleSuspend: (ids, suspend, reason) => {
          const req = suspend
            ? api.post("/admin/students/suspend", { ids, reason: reason || "No reason given" })
            : api.post("/admin/students/restore", { ids });
          req.then(refreshStudents, fail("Couldn't update students"));
        },
        warn: (ids, reason) => {
          api.post("/admin/students/warn", { ids, reason }).then(refreshStudents, fail("Couldn't send warning"));
        },
      };
    }

    return {
      courses,
      cbts,
      students: seedStudents,
      suspended,
      addCourse: async (c) => {
        setCourses((p) => [c, ...p]);
        return c.slug;
      },
      updateCourse: async (slugOrId, patch) => {
        setCourses((items) =>
          items.map((course) =>
            course.id === slugOrId || course.slug === slugOrId ? { ...course, ...patch } : course,
          ),
        );
      },
      moveMaterial: async (materialId, targetCategory, targetSubfolder) => {
        updateMockMaterial(materialId, { category: targetCategory, subfolderSlug: targetSubfolder });
      },
      addCbt: async (c) => {
        setCbts((p) => [c, ...p]);
        return c.id;
      },
      toggleReveal: (id) =>
        setCbts((p) => p.map((c) => (c.id === id ? { ...c, revealResults: c.revealResults === false } : c))),
      togglePause: (id) =>
        setCbts((p) => p.map((c) => (c.id === id ? { ...c, paused: !c.paused } : c))),
      updateCbt: async (id, patch) =>
        setCbts((p) =>
          p.map((c) =>
            c.id === id
              ? { ...c, ...patch, questionCount: patch.questions?.length ?? c.questionCount }
              : c,
          ),
        ),
      toggleSuspend: (ids, suspend, reason) => {
        setSuspended((p) => (suspend ? Array.from(new Set([...p, ...ids])) : p.filter((x) => !ids.includes(x))));
        setReasons((p) => {
          const n = { ...p };
          ids.forEach((id) =>
            suspend ? (n[id] = { reason: reason || "No reason given", date: today() }) : delete n[id],
          );
          return n;
        });
      },
      suspendReasons,
      warnings,
      warn: (ids, reason) =>
        setWarnings((p) => {
          const n = { ...p };
          ids.forEach((id) => (n[id] = [{ reason, date: today() }, ...(n[id] ?? [])]));
          return n;
        }),
      isSuspended: (id) => suspended.includes(id),
    };
  }, [qc, catalog.data, liveStudents.data, courses, cbts, suspended, suspendReasons, warnings]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdmin must be used inside AdminProvider");
  return ctx;
}
