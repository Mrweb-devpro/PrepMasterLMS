import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import { ApiError } from "@/lib/api/client";
import { saveCompetitionAnswer } from "../services/competitions.api";
import { arenaKey } from "./useCompetitions";

type PendingAnswer = { questionId: string; selectedIndex: number | null };
const owns = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key);

/** Locks a choice immediately and sends choices in order without delaying the Next button. */
export function useArenaSaves(id: string, serverAnswers: Record<string, number | null>) {
  const { user } = useSession();
  const userId = user?.id ?? "";
  const storageKey = `competition-pending:${userId}:${id}`;
  const client = useQueryClient();
  const queue = useRef<PendingAnswer[]>([]);
  const receipts = useRef<Record<string, number | null>>({});
  const server = useRef(serverAnswers);
  server.current = serverAnswers;
  const flight = useRef<Promise<void> | null>(null);
  const [revision, render] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejected, setRejected] = useState(0);
  const [saving, setSaving] = useState(false);

  const persist = useCallback(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(queue.current)); } catch { /* Keep pending answers in memory. */ }
    render((value) => value + 1);
  }, [storageKey]);

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(stored)) queue.current = stored.filter((item): item is PendingAnswer =>
        Boolean(item && typeof item.questionId === "string" && (item.selectedIndex === null || Number.isInteger(item.selectedIndex))));
    } catch { queue.current = []; }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    queue.current = queue.current.filter((item) => !owns(serverAnswers, item.questionId));
    persist();
  }, [serverAnswers, persist, ready]);

  const flush = useCallback((): Promise<void> => {
    if (flight.current) return flight.current;
    const operation = async () => {
      setSaving(true);
      setError(null);
      try {
        while (queue.current.length) {
          const item = queue.current[0]!;
          if (owns(server.current, item.questionId)) {
            queue.current = queue.current.filter((pending) => pending.questionId !== item.questionId);
            persist();
            continue;
          }
          try {
            const receipt = await saveCompetitionAnswer(id, userId, item.questionId, item.selectedIndex);
            receipts.current[item.questionId] = receipt.selectedIndex;
            queue.current = queue.current.filter((pending) => pending.questionId !== item.questionId);
            persist();
          } catch (cause) {
            if (cause instanceof ApiError && cause.status >= 400 && cause.status < 500 && cause.status !== 429) {
              // A closed contest or a choice accepted in another tab cannot be changed by retrying.
              queue.current = queue.current.filter((pending) => pending.questionId !== item.questionId);
              setRejected((value) => value + 1);
              persist();
              void client.invalidateQueries({ queryKey: arenaKey(id, userId) });
            }
            setError(cause instanceof Error ? cause.message : "Your answer is waiting to save. Please retry.");
            break;
          }
        }
      } finally { setSaving(false); }
    };
    flight.current = operation().finally(() => { flight.current = null; });
    return flight.current;
  }, [client, id, userId, persist]);

  useEffect(() => {
    if (!ready || !userId) return;
    if (queue.current.length && !error) void flush();
    const retry = () => { if (queue.current.length) void flush(); };
    const timer = window.setInterval(retry, 5_000);
    window.addEventListener("online", retry);
    return () => { window.clearInterval(timer); window.removeEventListener("online", retry); };
  }, [ready, userId, flush, revision, error]);

  const lock = useCallback((questionId: string, selectedIndex: number | null) => {
    if (!ready || owns(server.current, questionId) || owns(receipts.current, questionId) || queue.current.some((item) => item.questionId === questionId)) return;
    queue.current.push({ questionId, selectedIndex });
    persist();
    void flush();
  }, [ready, persist, flush]);

  const answers = { ...receipts.current, ...serverAnswers };
  for (const item of queue.current) if (!owns(answers, item.questionId)) answers[item.questionId] = item.selectedIndex;
  const discardAfterClose = () => {
    const count = queue.current.length;
    queue.current = [];
    if (count) setRejected((value) => value + count);
    persist();
    return count;
  };
  return { answers, lock, flush, ready, pending: queue.current.length, saving, error, rejected, discardAfterClose, hasPending: () => queue.current.length > 0 };
}
