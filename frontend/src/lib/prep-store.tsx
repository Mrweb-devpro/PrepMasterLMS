import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useSession } from "@/features/auth/session";
import { fullName, initials as initialsOf } from "@/features/auth/utils/profile";
import { useCatalogQuery } from "@/features/catalog/useCatalog";
import { cbtApi } from "@/features/cbt/services/cbt.api";
import { paymentsApi, type ItemType } from "@/features/payments/payments.api";
import { LIVE } from "./api/config";
import { currentStudent, type UnfinishedAttempt } from "./mock-data";

/** A finished CBT attempt, saved automatically on submit. */
export interface SavedAttempt {
  id: string;
  cbtId: string;
  /** Picked options (dummy mode only — the real review is loaded from the server). */
  answers: Record<string, number>;
  /** Null while results are not available to the student. */
  correct: number | null;
  total: number;
  submittedAt: string;
  /** true when the server auto-submitted it at the deadline. */
  autoSubmitted?: boolean;
}

interface PrepState {
  name: string;
  email: string;
  initials: string;
  emailVerified: boolean;
  ownedFileIds: string[];
  ownedCbtIds: string[];
  unfinishedAttempts: UnfinishedAttempt[];
  notifications: Record<string, boolean>;
  ownsFile: (id: string) => boolean;
  ownsCbt: (id: string) => boolean;
  /** Dummy mode: unlocks instantly. LIVE: sends the student to Paystack. */
  purchaseFile: (id: string) => Promise<void>;
  purchaseCbt: (id: string) => Promise<void>;
  verifyEmail: () => void;
  toggleNotification: (key: string) => void;
  completeAttempt: (cbtId: string) => void;
  attempts: SavedAttempt[];
  attemptsLoading: boolean;
  saveAttempt: (a: Omit<SavedAttempt, "id" | "submittedAt">) => SavedAttempt;
  /** Reload attempts from the server (LIVE). */
  refreshAttempts: () => void;
}

// Pinned on globalThis so hot reloads reuse the same context (otherwise the provider and consumers drift apart).
const g = globalThis as { __prepCtx?: React.Context<PrepState | null> };
const PrepContext = (g.__prepCtx ??= createContext<PrepState | null>(null));
export const attemptsKey = ["attempts"] as const;

export function PrepProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const catalog = useCatalogQuery();
  const liveAttempts = useQuery({
    queryKey: [...attemptsKey, user?.id ?? "anon"],
    queryFn: cbtApi.mine,
    enabled: LIVE && Boolean(user),
  });

  const [ownedFileIds, setOwnedFileIds] = useState<string[]>(currentStudent.ownedFileIds);
  const [ownedCbtIds, setOwnedCbtIds] = useState<string[]>(currentStudent.ownedCbtIds);
  const [emailVerified, setEmailVerified] = useState(currentStudent.emailVerified);
  const [unfinished, setUnfinished] = useState<UnfinishedAttempt[]>(currentStudent.unfinishedAttempts);
  const [mockAttempts, setMockAttempts] = useState<SavedAttempt[]>([]);
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "New materials": true,
    "Live CBT reminders": true,
    "Results released": true,
    "Payment receipts": false,
  });

  const value = useMemo<PrepState>(() => {
    const files = LIVE ? (catalog.data?.owned.fileIds ?? []) : ownedFileIds;
    const cbtIds = LIVE ? (catalog.data?.owned.cbtIds ?? []) : ownedCbtIds;
    const rows = liveAttempts.data ?? [];
    const attempts: SavedAttempt[] = LIVE
      ? rows
          .filter((a) => a.status !== "in_progress")
          .map((a) => ({
            id: a.id,
            cbtId: a.cbtId,
            answers: {},
            correct: a.correct,
            total: a.total,
            submittedAt: a.submittedAt ?? a.startedAt,
            autoSubmitted: a.status === "expired",
          }))
      : mockAttempts;
    const unfinishedAttempts: UnfinishedAttempt[] = LIVE
      ? rows
          .filter((a) => a.status === "in_progress")
          .map((a) => {
            const cbt = catalog.data?.cbts.find((c) => c.id === a.cbtId);
            return { cbtId: a.cbtId, answered: a.answered, total: cbt?.questionCount ?? 0, lastOpened: a.startedAt };
          })
      : unfinished;

    const buy = async (type: ItemType, id: string, unlock: () => void) => {
      if (!LIVE) return unlock();
      try {
        await paymentsApi.startCheckout(type, id);
      } catch (e) {
        toast.error("Couldn't start the payment", { description: (e as Error).message });
        throw e;
      }
    };
    const refreshAttempts = () => void qc.invalidateQueries({ queryKey: attemptsKey });

    return {
      name: user ? fullName(user) : currentStudent.name,
      email: user?.email ?? currentStudent.email,
      initials: user ? initialsOf(user) : currentStudent.initials,
      emailVerified: LIVE ? (user?.emailVerified ?? false) : emailVerified,
      ownedFileIds: files,
      ownedCbtIds: cbtIds,
      unfinishedAttempts,
      notifications,
      ownsFile: (id) => files.includes(id),
      ownsCbt: (id) => cbtIds.includes(id),
      purchaseFile: (id) =>
        buy("material", id, () => setOwnedFileIds((p) => (p.includes(id) ? p : [...p, id]))),
      purchaseCbt: (id) =>
        buy("cbt", id, () => setOwnedCbtIds((p) => (p.includes(id) ? p : [...p, id]))),
      verifyEmail: () => setEmailVerified(true),
      toggleNotification: (key) => setNotifications((p) => ({ ...p, [key]: !p[key] })),
      completeAttempt: (cbtId) =>
        LIVE ? refreshAttempts() : setUnfinished((p) => p.filter((a) => a.cbtId !== cbtId)),
      attempts,
      attemptsLoading: LIVE && liveAttempts.isPending,
      saveAttempt: (a) => {
        const saved = { ...a, id: `att-${Date.now()}`, submittedAt: new Date().toISOString() };
        if (LIVE) refreshAttempts();
        else setMockAttempts((p) => [saved, ...p]);
        return saved;
      },
      refreshAttempts,
    };
  }, [
    user,
    qc,
    catalog.data,
    liveAttempts.data,
    liveAttempts.isPending,
    mockAttempts,
    ownedFileIds,
    ownedCbtIds,
    emailVerified,
    unfinished,
    notifications,
  ]);

  return <PrepContext.Provider value={value}>{children}</PrepContext.Provider>;
}

export function usePrep() {
  const ctx = useContext(PrepContext);
  if (!ctx) throw new Error("usePrep must be used inside PrepProvider");
  return ctx;
}
