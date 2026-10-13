import { LiveBadge, StatusPill } from "@/components/prep/bits";
import type { Cbt } from "@/lib/mock-data";

export function cbtStatusPill(cbt: Cbt) {
  if (cbt.paused) return <StatusPill tone="warning">Pending release</StatusPill>;
  if (cbt.kind === "practice") return null;
  if (cbt.status === "live") return <LiveBadge />;
  if (cbt.status === "upcoming") return <StatusPill tone="primary">Upcoming</StatusPill>;
  if (cbt.status === "past-results-held")
    return <StatusPill tone="warning">Results pending</StatusPill>;
  return <StatusPill tone="success">Results out</StatusPill>;
}
