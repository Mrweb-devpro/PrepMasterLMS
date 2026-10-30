import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { ArrowLeft, Award, Crown } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/prep/bits";
import type { CompetitionStanding } from "@/lib/mock-data";
import { CompetitionAvatar } from "../components/CompetitionAvatar";
import { useCompetitions } from "../hooks/useCompetitions";

function duration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

function PodiumColumn({ entry }: { entry: CompetitionStanding }) {
  const champion = entry.rank === 1;
  const runnerUp = entry.rank === 2;
  const accent = champion ? "border-gold/70 text-gold-text" : runnerUp ? "border-primary/35 text-primary" : "border-warning/50 text-warning";
  const pedestal = champion ? "h-24 bg-gold sm:h-32" : runnerUp ? "h-16 bg-primary sm:h-20" : "h-14 bg-warning sm:h-16";
  const avatarSize = champion ? "size-15 sm:size-20" : "size-11 sm:size-16";

  return <div className={`flex min-w-0 flex-col items-center text-center ${champion ? "-mt-5 sm:-mt-8" : ""}`}>
    <div className="relative">
      {champion ? <Crown aria-label="First place crown" className="absolute -top-6 left-1/2 z-10 size-8 -translate-x-1/2 fill-current text-gold-text sm:-top-7 sm:size-9" /> : <span className={`absolute -top-3 left-1/2 z-10 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border-2 border-background bg-surface text-xs font-bold ${accent}`}>{entry.rank}</span>}
      <div className={`rounded-full border-2 bg-surface p-0.5 shadow-sm ${accent}`}><CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className={`${avatarSize} text-sm sm:text-lg`} /></div>
    </div>
    <p title={entry.name} className="mt-2 w-full truncate text-xs font-semibold text-foreground sm:mt-3 sm:text-sm">{entry.name}</p>
    <p className="mt-0.5 text-2xs font-semibold tabular-nums text-foreground sm:text-xs">{entry.score.toLocaleString()} pts</p>
    <p className="text-2xs text-text-secondary">{duration(entry.speedSeconds)}</p>
    <div className={`relative mt-2 flex w-full items-start justify-center rounded-t-md sm:mt-3 sm:rounded-t-lg ${pedestal}`}>
      <span className={`absolute top-2 flex size-7 items-center justify-center rounded-full bg-surface font-display text-sm font-bold shadow-sm sm:size-8 sm:text-base ${champion ? "text-gold-text" : runnerUp ? "text-primary" : "text-warning"}`}>{entry.rank}</span>
      {champion && <Award aria-hidden className="absolute top-10 size-4 text-primary-foreground/80 sm:top-12 sm:size-5" />}
    </div>
  </div>;
}

function StandingRow({ entry }: { entry: CompetitionStanding }) {
  return <div className={`flex items-center gap-2.5 border-b border-border px-3 py-3 text-sm last:border-b-0 sm:px-4 ${entry.isCurrentUser ? "bg-primary-soft" : "bg-surface"}`}>
    <span className="w-7 shrink-0 font-display font-semibold text-text-secondary sm:w-9">{entry.rank}</span>
    <CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className="size-8 shrink-0 text-2xs" />
    <span className="min-w-0 flex-1 truncate font-medium text-foreground">{entry.name}{entry.isCurrentUser ? " (You)" : ""}</span>
    <span className="shrink-0 text-right"><span className="block text-xs font-semibold tabular-nums text-foreground sm:text-sm">{entry.score.toLocaleString()} pts</span><span className="block text-2xs text-text-secondary">{duration(entry.speedSeconds)}</span></span>
  </div>;
}

function YourStandingBar({ entry }: { entry: CompetitionStanding }) {
  return <div className="rounded-xl border border-primary/30 bg-surface p-2.5 shadow-sm sm:p-3">
    <div className="flex items-center gap-2.5 sm:gap-3"><span className="flex min-w-12 items-center justify-center rounded-lg bg-primary-soft px-2 py-2 font-display text-lg font-bold text-primary">#{entry.rank}</span><CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className="size-10 text-xs sm:size-11" /><div className="min-w-0 flex-1"><div className="flex min-w-0 items-center gap-1.5"><span className="truncate text-sm font-semibold text-foreground">{entry.name}</span><span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide text-primary">You</span></div><p className="truncate text-xs text-text-secondary">Score: {entry.score.toLocaleString()} pts <span className="px-1">•</span> Time: {duration(entry.speedSeconds)}</p></div></div>
  </div>;
}

/** Shows a completed contest's final podium and complete result board. */
export function CompetitionResultsPage({ id }: { id: string }) {
  const query = useCompetitions();
  const competition = query.data?.find((item) => item.id === id);
  const celebrated = useRef(false);
  const podium = competition?.standings.slice(0, 3) ?? [];
  const currentUser = competition?.standings.find((entry) => entry.isCurrentUser);
  const remaining = competition?.standings.filter((entry) => entry.rank > 3) ?? [];

  useEffect(() => {
    if (!podium[0] || celebrated.current) return;
    celebrated.current = true;
    const tokens = getComputedStyle(document.documentElement);
    confetti({ particleCount: 105, spread: 72, startVelocity: 28, origin: { y: 0.27 }, colors: ["--gold", "--primary", "--success"].map((token) => tokens.getPropertyValue(token).trim()) });
  }, [podium]);

  if (query.isPending) return <div className="h-56 animate-pulse rounded-lg bg-surface-subtle" />;
  if (query.isError || !competition || competition.status !== "completed") return <EmptyState title="Results not available" description="This contest does not have a published result board yet." action={<Button asChild variant="outline"><Link to="/competitions"><ArrowLeft className="size-4" />Back to competitions</Link></Button>} />;

  return <div className="space-y-7 pb-10">
    <PageHeader title="Hall of Fame" subtitle={`${competition.courseCode} ${competition.title} · final standings`} action={<Button asChild variant="outline"><Link to="/competitions"><ArrowLeft className="size-4" />All competitions</Link></Button>} />
    <Card className="p-5 sm:p-7"><div><StatusPill tone="success">Results final</StatusPill><h2 className="mt-3 font-display text-xl font-semibold text-foreground">{competition.title}</h2></div>{podium.length ? <div className="mx-auto mt-12 grid max-w-xl grid-cols-3 items-end gap-1 sm:mt-14 sm:gap-4">{[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => <PodiumColumn key={entry.rank} entry={entry} />)}</div> : <EmptyState className="mt-6" title="No final standings yet" />}</Card>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-foreground">Final standings</h2><span className="text-xs text-text-secondary">{competition.participantCount} players</span></div><Card className="overflow-hidden p-0"><div className="flex items-center gap-2.5 border-b border-border bg-surface-subtle px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-text-muted sm:px-4"><span className="w-7 shrink-0 sm:w-9">Rank</span><span className="min-w-0 flex-1">Player</span><span className="shrink-0 text-right">Points / time</span></div>{remaining.length ? remaining.map((entry) => <StandingRow key={`${entry.rank}-${entry.name}`} entry={entry} />) : <div className="px-4 py-8 text-center text-sm text-text-secondary">Only the podium finishers took part in this contest.</div>}</Card></section>
    {currentUser && <YourStandingBar entry={currentUser} />}
  </div>;
}
