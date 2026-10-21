import { LiveBadge, StatusPill } from "@/components/prep/bits";
import type { Cbt } from "@/lib/mock-data";
import { isAttemptableLiveCbt, isCbtClosed } from "./cbt-lifecycle";

export function cbtStatusPill(cbt: Cbt) {
  if (cbt.paused) return <StatusPill tone="warning">Pending release</StatusPill>;
  if (cbt.kind === "practice") return null;
  if (isAttemptableLiveCbt(cbt)) return <LiveBadge />;
  if (cbt.status === "upcoming" || (cbt.scheduledFor && new Date(cbt.scheduledFor).getTime() > Date.now())) {
    return <StatusPill tone="primary">Upcoming</StatusPill>;
  }
  if (cbt.status === "past-results-held" || (isCbtClosed(cbt) && cbt.revealResults === false))
    return <StatusPill tone="warning">Results pending</StatusPill>;
  return <StatusPill tone="success">Results out</StatusPill>;
}
