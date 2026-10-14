import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useSession } from "@/features/auth/session";
import { LIVE } from "@/lib/api/config";
import {
  CATEGORIES,
  cbts as mockCbts,
  courses as mockCourses,
  files as mockFiles,
  type CategorySlug,
  type Cbt,
  type Course,
  type DriveFile,
} from "@/lib/mock-data";
import { fetchCatalog, type Catalog } from "./catalog.api";

export const catalogKey = ["catalog"] as const;

const EMPTY: Catalog = { courses: [], files: [], cbts: [], owned: { fileIds: [], cbtIds: [] } };

/** Raw catalog query (LIVE only). */
export function useCatalogQuery() {
  const { user } = useSession();
  return useQuery({
    queryKey: [...catalogKey, user?.id ?? "anon"],
    queryFn: fetchCatalog,
    enabled: LIVE && Boolean(user),
    staleTime: 60_000,
  });
}

/** Refetch everything the student browses (after a purchase, upload, new CBT…). */
export function useRefreshCatalog() {
  const qc = useQueryClient();
  return useCallback(() => qc.invalidateQueries({ queryKey: catalogKey }), [qc]);
}

/**
 * Courses, files and CBTs with the same lookup helpers the pages always used.
 * LIVE: from the API. Otherwise: the dummy data.
 */
export function useCatalog(overrides?: { courses?: Course[]; cbts?: Cbt[] }) {
  const q = useCatalogQuery();
  const data = LIVE ? (q.data ?? EMPTY) : null;
  const courses = overrides?.courses ?? data?.courses ?? mockCourses;
  const files = data?.files ?? mockFiles;
  const cbts = overrides?.cbts ?? data?.cbts ?? mockCbts;

  return useMemo(() => {
    const getCourse = (slug: string) => courses.find((c) => c.slug === slug);
    const getCbt = (id: string) => cbts.find((c) => c.id === id);
    const getFile = (id: string) => files.find((f) => f.id === id);
    const getCategory = (slug: string) => CATEGORIES.find((c) => c.slug === slug);
    const filesIn = (courseSlug: string, category?: CategorySlug, subfolderSlug?: string) =>
      files.filter(
        (f: DriveFile) =>
          f.courseSlug === courseSlug &&
          (!category || f.category === category) &&
          (!subfolderSlug || f.subfolderSlug === subfolderSlug),
      );
    const recentFiles = [...files].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 8);
    return {
      courses,
      files,
      cbts,
      getCourse,
      getCbt,
      getFile,
      getCategory,
      filesIn,
      recentFiles,
      /** true while the real catalog is still loading for the first time. */
      loading: LIVE && q.isPending,
      error: LIVE ? q.error : null,
    };
  }, [courses, files, cbts, q.isPending, q.error]);
}
