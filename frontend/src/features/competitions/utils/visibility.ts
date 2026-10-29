import type { Competition } from "@/lib/mock-data";

export function visibleForLevel(competition: Competition, user: { level?: string } | null | undefined) {
  return competition.level === "all" || (user ? competition.level === user.level : competition.level === "100");
}

export function competitionStatus(competition: Competition) {
  if (competition.status === "completed" || competition.status === "cancelled") return competition.status;
  const start = new Date(competition.startsAt).getTime();
  if (Date.now() >= start + competition.durationMinutes * 60000) return "completed";
  return Date.now() >= start ? "live" : competition.status;
}
