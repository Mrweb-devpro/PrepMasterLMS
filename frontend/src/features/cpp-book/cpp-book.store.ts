import { useCallback, useEffect, useState } from "react";

export type ReaderFontSize = "sm" | "base" | "lg";

export interface CppBookProgress {
  activeChapterId: string;
  completedChapterIds: string[];
  bookmarkedChapterIds: string[];
  fontSizePreference: ReaderFontSize;
}

const DEFAULT_PROGRESS: CppBookProgress = {
  activeChapterId: "cpp-1-1",
  completedChapterIds: [],
  bookmarkedChapterIds: [],
  fontSizePreference: "base",
};

function storageKey(userId?: string) {
  return `pm-cpp-book:${userId ?? "guest"}`;
}

function loadProgress(userId?: string): CppBookProgress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "null");
    return saved ? { ...DEFAULT_PROGRESS, ...saved } : DEFAULT_PROGRESS;
  } catch {
    return DEFAULT_PROGRESS;
  }
}

/** Stores one student's local C++ reader state and keeps it across reloads. */
export function useCppBookProgress(userId?: string) {
  const [progress, setProgress] = useState<CppBookProgress>(() => loadProgress(userId));

  useEffect(() => setProgress(loadProgress(userId)), [userId]);

  const update = useCallback((next: CppBookProgress | ((current: CppBookProgress) => CppBookProgress)) => {
    setProgress((current) => {
      const value = typeof next === "function" ? next(current) : next;
      localStorage.setItem(storageKey(userId), JSON.stringify(value));
      return value;
    });
  }, [userId]);

  return { progress, update };
}
