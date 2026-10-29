import { Link } from "@tanstack/react-router";
import { Trophy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/features/auth/session";
import { useCompetitions } from "@/features/competitions/hooks/useCompetitions";
import { competitionStatus, visibleForLevel } from "@/features/competitions/utils/visibility";

export function TopBroadcastBanner() {
  const { user } = useSession();
  const contests = useCompetitions();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    try {
      setDismissed(Object.keys(sessionStorage).filter((key) => key.startsWith("dismissed_contest_banner_") && sessionStorage.getItem(key) === "true").map((key) => key.slice("dismissed_contest_banner_".length)));
    } catch { /* Dismissals still work in memory when storage is unavailable. */ }
    setReady(true);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const competition = contests.data?.filter((item) => visibleForLevel(item, user) && !dismissed.includes(item.id)).sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()).find((item) => {
    const status = competitionStatus(item);
    const remaining = new Date(item.startsAt).getTime() - now;
    return status === "live" || (status === "scheduled" && remaining > 0 && remaining <= 48 * 3600000);
  });
  if (!ready || !competition) return null;
  const live = competitionStatus(competition) === "live";
  const seconds = Math.max(0, Math.ceil((new Date(competition.startsAt).getTime() - now) / 1000));
  const countdown = `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m ${seconds % 60}s`;
  return <aside aria-label="Competition announcement" className="flex items-center gap-3 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground md:text-sm">
    <Trophy className="size-4 shrink-0" />
    <div className="min-w-0 flex-1"><span>{competition.title}</span><span className="ml-2 whitespace-nowrap opacity-90">{live ? "Live now" : `Starts in ${countdown}`}</span></div>
    {live ? <Link to="/competitions/$competitionId/arena" params={{ competitionId: competition.id }} className="shrink-0 rounded-md border border-current px-2 py-1 hover:opacity-80">Enter Arena</Link> : <Link to="/competitions" className="shrink-0 rounded-md border border-current px-2 py-1 hover:opacity-80">View Contest</Link>}
    <button type="button" aria-label="Dismiss announcement" className="shrink-0 rounded p-1 hover:opacity-80" onClick={() => {
      try { sessionStorage.setItem(`dismissed_contest_banner_${competition.id}`, "true"); } catch { /* Optional storage. */ }
      setDismissed((ids) => [...ids, competition.id]);
    }}><X className="size-4" /></button>
  </aside>;
}
