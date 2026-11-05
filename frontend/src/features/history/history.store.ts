import { useCallback, useEffect, useState } from "react";

export type HistoryKind = "document" | "cbt" | "competition";

export interface HistoryEntry {
  id: string;
  targetId: string;
  kind: HistoryKind;
  title: string;
  subtitle: string;
  detail?: string;
  timestamp: string;
  course?: string;
  route?: {
    course?: string;
    category?: string;
    subfolder?: string;
    cbtId?: string;
    attemptId?: string;
  };
}

type StoredHistory = {
  entries: HistoryEntry[];
  removedIds: string[];
  clearedAt?: string;
};

const MAX_ENTRIES = 100;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const storageKey = (userId: string) => `pm-history:${userId}`;

function readHistory(userId: string): StoredHistory {
  if (!userId || typeof window === "undefined") return { entries: [], removedIds: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "{}") as Partial<StoredHistory>;
    return {
      entries: Array.isArray(saved.entries) ? saved.entries.slice(0, MAX_ENTRIES) : [],
      removedIds: Array.isArray(saved.removedIds) ? saved.removedIds : [],
      ...(saved.clearedAt ? { clearedAt: saved.clearedAt } : {}),
    };
  } catch {
    return { entries: [], removedIds: [] };
  }
}

function writeHistory(userId: string, value: StoredHistory) {
  if (!userId || typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(value));
  } catch {
    // History is a convenience feature; the rest of the app remains usable if storage is unavailable.
  }
  notify();
}

/** Saves a recent student activity locally, keeping only the most recent 100 entries. */
export function recordHistory(userId: string, entry: Omit<HistoryEntry, "id" | "timestamp"> & Partial<Pick<HistoryEntry, "timestamp">>) {
  const current = readHistory(userId);
  const timestamp = entry.timestamp ?? new Date().toISOString();
  const id = `${entry.kind}:${entry.targetId}`;
  const item: HistoryEntry = { ...entry, id, timestamp };
  const entries = [item, ...current.entries.filter((existing) => existing.id !== id)].slice(0, MAX_ENTRIES);
  writeHistory(userId, {
    entries,
    removedIds: current.removedIds.filter((removedId) => removedId !== id),
    ...(current.clearedAt ? { clearedAt: current.clearedAt } : {}),
  });
}

export function useActivityHistory(userId?: string) {
  const [stored, setStored] = useState<StoredHistory>(() => readHistory(userId ?? ""));

  useEffect(() => {
    const update = () => setStored(readHistory(userId ?? ""));
    update();
    listeners.add(update);
    return () => listeners.delete(update);
  }, [userId]);

  const remove = useCallback((id: string) => {
    if (!userId) return;
    const current = readHistory(userId);
    writeHistory(userId, {
      ...current,
      entries: current.entries.filter((entry) => entry.id !== id),
      removedIds: [...new Set([...current.removedIds, id])],
    });
  }, [userId]);

  const clear = useCallback(() => {
    if (!userId) return;
    writeHistory(userId, { entries: [], removedIds: [], clearedAt: new Date().toISOString() });
  }, [userId]);

  return { ...stored, remove, clear };
}
