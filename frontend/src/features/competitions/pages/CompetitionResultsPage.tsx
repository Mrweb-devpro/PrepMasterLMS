import { Link } from "@tanstack/react-router";
import { ArrowLeft, Medal, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/prep/bits";
import { useCompetitions } from "../hooks/useCompetitions";

function duration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

/** Shows a completed contest's final podium and full ranked results. */
export function CompetitionResultsPage({ id }: { id: string }) {
  const query = useCompetitions();
  const competition = query.data?.find((item) => item.id === id);
  if (query.isPending) return <div className="h-56 animate-pulse rounded-lg bg-surface-subtle" />;
  if (query.isError || !competition || competition.status !== "completed") return <EmptyState title="Results not available" description="This contest does not have a published result board yet." action={<Button asChild variant="outline"><Link to="/competitions"><ArrowLeft className="size-4" />Back to competitions</Link></Button>} />;

  const podium = competition.standings.slice(0, 3);
  return <div className="space-y-7">
    <PageHeader title="Hall of Fame" subtitle={`${competition.title} · final standings`} action={<Button asChild variant="outline"><Link to="/competitions"><ArrowLeft className="size-4" />All competitions</Link></Button>} />
    <Card className="overflow-hidden"><div className="flex flex-wrap items-start justify-between gap-3"><div><StatusPill tone="success">Results final</StatusPill><h2 className="mt-3 font-display text-xl font-semibold text-foreground">{competition.title}</h2><p className="mt-1 text-sm text-text-secondary">{competition.courseCode} · {competition.participantCount} participants</p></div><Trophy className="size-9 text-primary" /></div>
      {podium.length ? <div className="mt-7 grid gap-3 sm:grid-cols-3">{[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => <div key={entry.rank} className={`rounded-lg border p-4 text-center ${entry.rank === 1 ? "border-primary bg-primary-soft sm:-translate-y-2" : "border-border bg-surface-subtle"}`}><Medal className="mx-auto size-5 text-primary" /><p className="mt-2 text-xs font-semibold text-text-muted">#{entry.rank}</p><p className="mt-1 truncate font-semibold text-foreground">{entry.name}</p><p className="mt-2 font-display text-xl font-bold text-foreground">{entry.score.toLocaleString()} pts</p><p className="mt-1 text-xs text-text-secondary">{duration(entry.speedSeconds)}</p></div>)}</div> : <EmptyState className="mt-6" title="No final standings yet" />}
    </Card>
    <section><h2 className="mb-3 font-display text-lg font-semibold">All participants</h2><div className="space-y-2">{competition.standings.map((entry) => <div key={`${entry.rank}-${entry.name}`} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm"><span className="w-7 font-display font-semibold text-text-secondary">#{entry.rank}</span><span className="min-w-0 flex-1 truncate font-medium text-foreground">{entry.name}{entry.isCurrentUser ? " (You)" : ""}</span><span className="hidden text-text-muted sm:inline">{duration(entry.speedSeconds)}</span><span className="font-semibold text-foreground">{entry.score.toLocaleString()} pts</span></div>)}</div></section>
  </div>;
}
