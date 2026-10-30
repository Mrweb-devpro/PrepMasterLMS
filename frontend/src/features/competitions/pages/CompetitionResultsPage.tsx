import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { ArrowLeft, Award, Crown, Trophy } from "lucide-react";
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
  const label = champion ? "Champion" : runnerUp ? "Runner-up" : "Third place";
  const accent = champion ? "border-gold/70 text-gold-text" : runnerUp ? "border-primary/35 text-primary" : "border-warning/50 text-warning";
  const pedestal = champion ? "h-24 bg-gold sm:h-32" : runnerUp ? "h-16 bg-primary sm:h-20" : "h-14 bg-warning sm:h-16";
  const avatarSize = champion ? "size-16 sm:size-20" : "size-12 sm:size-16";

  return <div className={`flex min-w-0 flex-col items-center text-center ${champion ? "-mt-6 sm:-mt-10" : ""}`}>
    <div className="relative">
      {champion ? <Crown aria-label="First place crown" className="absolute -top-7 left-1/2 z-10 size-9 -translate-x-1/2 fill-current text-gold-text" /> : <span className={`absolute -top-2 -right-2 z-10 flex size-6 items-center justify-center rounded-full border-2 border-background bg-surface text-xs font-bold ${accent}`}>{entry.rank}</span>}
      <div className={`rounded-full border-2 bg-surface p-0.5 shadow-sm ${accent}`}><CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className={`${avatarSize} text-sm sm:text-lg`} /></div>
    </div>
    <p className={`mt-3 text-2xs font-bold uppercase tracking-wider sm:text-xs ${accent}`}>{label}</p>
    <p title={entry.name} className="mt-1 w-full truncate text-xs font-semibold text-foreground sm:text-sm">{entry.name}</p>
    <p className="mt-1 text-2xs font-semibold tabular-nums text-foreground sm:text-xs">{entry.score.toLocaleString()} pts</p>
    <p className="mt-0.5 text-2xs text-text-secondary">{duration(entry.speedSeconds)}</p>
    <div className={`relative mt-3 flex w-full items-start justify-center rounded-t-lg ${pedestal}`}>
      <span className={`absolute top-2 flex size-8 items-center justify-center rounded-full bg-surface font-display text-base font-bold shadow-sm ${champion ? "text-gold-text" : runnerUp ? "text-primary" : "text-warning"}`}>{entry.rank}</span>
      {champion && <Award aria-hidden className="absolute top-11 size-5 text-primary-foreground/80 sm:top-12" />}
    </div>
  </div>;
}

function StandingRow({ entry }: { entry: CompetitionStanding }) {
  return <div className={`grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 py-3 text-sm last:border-b-0 sm:grid-cols-[3rem_minmax(0,1fr)_9rem] sm:px-4 ${entry.isCurrentUser ? "bg-primary-soft" : "bg-surface"}`}>
    <span className="font-display font-semibold text-text-secondary">{entry.rank}</span>
    <span className="flex min-w-0 items-center gap-2.5"><CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className="size-8 text-2xs" /><span className="truncate font-medium text-foreground">{entry.name}{entry.isCurrentUser ? " (You)" : ""}</span></span>
    <span className="text-right"><span className="block font-semibold tabular-nums text-foreground">{entry.score.toLocaleString()} pts</span><span className="block text-2xs text-text-secondary">{duration(entry.speedSeconds)}</span></span>
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
    <Card className="overflow-hidden p-5 sm:p-7"><div className="flex items-start justify-between gap-3"><div><StatusPill tone="success">Results final</StatusPill><h2 className="mt-3 font-display text-xl font-semibold text-foreground">{competition.title}</h2><p className="mt-1 text-sm text-text-secondary">{competition.participantCount} participants · final scores</p></div><Trophy className="size-9 text-gold-text" /></div>{podium.length ? <div className="mx-auto mt-14 grid max-w-xl grid-cols-3 items-end gap-1.5 sm:mt-16 sm:gap-4">{[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => <PodiumColumn key={entry.rank} entry={entry} />)}</div> : <EmptyState className="mt-6" title="No final standings yet" />}</Card>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-foreground">Final standings</h2><span className="text-xs text-text-secondary">{competition.participantCount} players</span></div><Card className="overflow-hidden p-0"><div className="grid grid-cols-[2rem_minmax(0,1fr)_auto] gap-2 border-b border-border bg-surface-subtle px-3 py-2 text-2xs font-semibold uppercase tracking-wider text-text-muted sm:grid-cols-[3rem_minmax(0,1fr)_9rem] sm:px-4"><span>Rank</span><span>Player</span><span className="text-right">Points / time</span></div>{remaining.length ? remaining.map((entry) => <StandingRow key={`${entry.rank}-${entry.name}`} entry={entry} />) : <div className="px-4 py-8 text-center text-sm text-text-secondary">Only the podium finishers took part in this contest.</div>}</Card></section>
    {currentUser && <YourStandingBar entry={currentUser} />}
  </div>;
}
