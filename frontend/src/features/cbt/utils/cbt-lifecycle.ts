import type { Cbt } from "@/lib/mock-data";

/** True when a CBT has passed its live testing window or already has a past status. */
export function isCbtClosed(cbt: Cbt): boolean {
  if (cbt.status === "past-results-shown" || cbt.status === "past-results-held") return true;
  if (cbt.kind !== "live") return false;

  const now = Date.now();
  if (cbt.closesAt) return new Date(cbt.closesAt).getTime() <= now;
  if (cbt.scheduledFor) {
    return new Date(cbt.scheduledFor).getTime() + cbt.minutes * 60_000 <= now;
  }
  return false;
}

/** True only while a live CBT can actually be entered at this moment. */
export function isAttemptableLiveCbt(cbt: Cbt): boolean {
  if (cbt.kind !== "live" || cbt.paused || cbt.status !== "live" || isCbtClosed(cbt)) return false;
  const now = Date.now();
  if (cbt.scheduledFor && new Date(cbt.scheduledFor).getTime() > now) return false;
  return !cbt.closesAt || new Date(cbt.closesAt).getTime() > now;
}
