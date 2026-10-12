import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { currentStudent, type UnfinishedAttempt } from "./mock-data";

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
  purchaseFile: (id: string) => void;
  purchaseCbt: (id: string) => void;
  verifyEmail: () => void;
  toggleNotification: (key: string) => void;
  completeAttempt: (cbtId: string) => void;
}

const PrepContext = createContext<PrepState | null>(null);

export function PrepProvider({ children }: { children: ReactNode }) {
  const [ownedFileIds, setOwnedFileIds] = useState<string[]>(currentStudent.ownedFileIds);
  const [ownedCbtIds, setOwnedCbtIds] = useState<string[]>(currentStudent.ownedCbtIds);
  const [emailVerified, setEmailVerified] = useState(currentStudent.emailVerified);
  const [unfinishedAttempts, setUnfinishedAttempts] = useState<UnfinishedAttempt[]>(
    currentStudent.unfinishedAttempts,
  );
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    "New materials": true,
    "Live CBT reminders": true,
    "Results released": true,
    "Payment receipts": false,
  });

  const value = useMemo<PrepState>(
    () => ({
      name: currentStudent.name,
      email: currentStudent.email,
      initials: currentStudent.initials,
      emailVerified,
      ownedFileIds,
      ownedCbtIds,
      unfinishedAttempts,
      notifications,
      ownsFile: (id) => ownedFileIds.includes(id),
      ownsCbt: (id) => ownedCbtIds.includes(id),
      purchaseFile: (id) => setOwnedFileIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      purchaseCbt: (id) => setOwnedCbtIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
      verifyEmail: () => setEmailVerified(true),
      toggleNotification: (key) => setNotifications((prev) => ({ ...prev, [key]: !prev[key] })),
      completeAttempt: (cbtId) =>
        setUnfinishedAttempts((prev) => prev.filter((a) => a.cbtId !== cbtId)),
    }),
    [ownedFileIds, ownedCbtIds, emailVerified, unfinishedAttempts, notifications],
  );

  return <PrepContext.Provider value={value}>{children}</PrepContext.Provider>;
}

export function usePrep() {
  const ctx = useContext(PrepContext);
  if (!ctx) throw new Error("usePrep must be used inside PrepProvider");
  return ctx;
}
