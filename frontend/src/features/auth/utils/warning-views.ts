import type { AccountWarning } from "../types";

export interface WarningViewState {
  viewCount: number;
  acknowledged: boolean;
}

type WarningStorage = Pick<Storage, "getItem" | "setItem">;

function readWarningState(storage: WarningStorage, warningId: string): WarningViewState {
  const raw = storage.getItem(`pm_warning_${warningId}`);
  let stored: Partial<WarningViewState> | null = null;
  try { stored = raw ? JSON.parse(raw) : null; } catch { /* Recover malformed JSON. */ }
  const count = stored?.viewCount;
  return {
    viewCount: typeof count === "number" && Number.isFinite(count)
      ? Math.min(3, Math.max(0, Math.floor(count))) : 0,
    acknowledged: stored?.acknowledged === true,
  };
}

export function latestWarning(warnings: AccountWarning[]): AccountWarning | undefined {
  return warnings.reduce<AccountWarning | undefined>((latest, warning) =>
    !latest || Date.parse(warning.created_at) > Date.parse(latest.created_at) ? warning : latest,
  undefined);
}

/** One automatic display per warning per document load, including route remounts. */
const displayed = new Set<string>();

export function claimWarningView(
  storage: WarningStorage,
  userId: string,
  warningId: string,
  seen = displayed,
): boolean {
  const identity = `${userId}:${warningId}`;
  if (seen.has(identity)) return false;
  try {
    const state = readWarningState(storage, warningId);
    if (state.acknowledged || state.viewCount >= 3) return false;
    storage.setItem(`pm_warning_${warningId}`, JSON.stringify({
      viewCount: state.viewCount + 1, acknowledged: false,
    }));
    seen.add(identity);
    return true;
  } catch {
    // Without persistent storage we cannot enforce the cap. History stays available.
    return false;
  }
}

export function acknowledgeWarning(storage: WarningStorage, warningId: string): boolean {
  try {
    const state = readWarningState(storage, warningId);
    storage.setItem(`pm_warning_${warningId}`, JSON.stringify({ ...state, acknowledged: true }));
    return true;
  } catch {
    return false;
  }
}

export function formatWarningDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "Africa/Lagos",
  });
}
