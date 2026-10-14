// GET /v1/catalog -> the shapes the pages already use (Course, DriveFile, Cbt).
import { api, toNaira } from "@/lib/api/client";
import { formatBytes } from "@/lib/mock-api";
import type { CategorySlug, Cbt, CbtStatus, Course, DriveFile, FileType } from "@/lib/mock-data";

interface CourseRow {
  id: string;
  slug: string;
  code: string;
  title: string;
  color: string;
}
interface SubfolderRow {
  course_id: string;
  category: CategorySlug;
  slug: string;
  name: string;
}
interface MaterialRow {
  id: string;
  course_id: string;
  category: CategorySlug;
  subfolder: string;
  title: string;
  file_type: FileType;
  size_bytes: number;
  price_kobo: number;
  created_at: string;
}
export interface CbtRow {
  id: string;
  course_id: string;
  title: string;
  mode: "practice" | "live";
  duration_minutes: number;
  opens_at: string;
  closes_at: string | null;
  price_kobo: number;
  max_attempts: number | null;
  reveal_results: boolean;
  published: boolean;
  paused?: boolean;
  question_count: number;
  my_attempts: number;
}
interface CatalogResponse {
  courses: CourseRow[];
  subfolders: SubfolderRow[];
  materials: MaterialRow[];
  cbts: CbtRow[];
  owned: { materialIds: string[]; cbtIds: string[] };
}

export interface Catalog {
  courses: Course[];
  files: DriveFile[];
  cbts: Cbt[];
  owned: { fileIds: string[]; cbtIds: string[] };
}

function liveStatus(c: CbtRow): CbtStatus {
  const now = Date.now();
  if (new Date(c.opens_at).getTime() > now) return "upcoming";
  if (!c.closes_at || new Date(c.closes_at).getTime() > now) return "live";
  return c.reveal_results ? "past-results-shown" : "past-results-held";
}

export function toCbt(c: CbtRow, courseSlug: string): Cbt {
  const paid = c.price_kobo > 0;
  return {
    id: c.id,
    title: c.title,
    courseSlug,
    kind: c.mode,
    paid,
    ...(paid ? { price: toNaira(c.price_kobo) } : {}),
    questionCount: c.question_count,
    minutes: c.duration_minutes,
    retakePolicy:
      c.mode === "live"
        ? "Single attempt"
        : c.max_attempts
          ? `${c.max_attempts} attempt${c.max_attempts === 1 ? "" : "s"}`
          : "Unlimited retakes",
    revealResults: c.reveal_results,
    published: c.published,
    paused: !!c.paused,
    myAttempts: c.my_attempts,
    ...(c.mode === "live" ? { status: liveStatus(c), scheduledFor: c.opens_at } : {}),
    questions: [], // questions only arrive when an attempt starts
  };
}

export async function fetchCatalog(): Promise<Catalog> {
  const r = await api.get<CatalogResponse>("/catalog");
  const slugOf = new Map(r.courses.map((c) => [c.id, c.slug]));
  const courses: Course[] = r.courses.map((c) => {
    const subs = r.subfolders.filter((s) => s.course_id === c.id);
    const pick = (cat: CategorySlug) =>
      subs.filter((s) => s.category === cat).map((s) => ({ slug: s.slug, name: s.name }));
    return {
      id: c.id,
      slug: c.slug,
      code: c.code,
      title: c.title,
      color: c.color,
      subfolders: {
        "lecture-notes": pick("lecture-notes"),
        "past-questions": pick("past-questions"),
        textbooks: pick("textbooks"),
      },
    };
  });
  const files: DriveFile[] = r.materials.map((m) => ({
    id: m.id,
    name: m.title,
    type: m.file_type,
    size: formatBytes(m.size_bytes),
    addedAt: m.created_at.slice(0, 10),
    paid: m.price_kobo > 0,
    ...(m.price_kobo > 0 ? { price: toNaira(m.price_kobo) } : {}),
    courseSlug: slugOf.get(m.course_id) ?? "",
    category: m.category,
    subfolderSlug: m.subfolder,
  }));
  const cbts = r.cbts.map((c) => toCbt(c, slugOf.get(c.course_id) ?? ""));
  return { courses, files, cbts, owned: { fileIds: r.owned.materialIds, cbtIds: r.owned.cbtIds } };
}
