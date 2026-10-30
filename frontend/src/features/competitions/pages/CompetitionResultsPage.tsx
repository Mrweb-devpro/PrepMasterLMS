import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { ArrowLeft, Crown, Medal, Trophy } from "lucide-react";
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

function podiumTone(rank: number) {
  if (rank === 1) return { card: "border-gold/60 bg-gold-bg shadow-md shadow-gold/10", icon: "text-gold-text", crown: "text-gold-text", place: "1st place" };
  if (rank === 2) return { card: "border-border-strong bg-surface-subtle", icon: "text-text-secondary", crown: "text-text-secondary", place: "2nd place" };
  return { card: "border-warning/40 bg-warning-bg", icon: "text-warning", crown: "text-warning", place: "3rd place" };
}

function PodiumSpot({ entry }: { entry: CompetitionStanding }) {
  const tone = podiumTone(entry.rank);
  const winner = entry.rank === 1;
  return <div className={`relative flex min-w-0 flex-col items-center rounded-xl border px-2 py-3 text-center sm:px-4 sm:py-4 ${tone.card} ${winner ? "-mt-4 pb-5 sm:-mt-7 sm:pb-7" : "mt-3 sm:mt-5"}`}>
    <div className="relative">
      <Crown aria-label={tone.place} className={`absolute -top-5 left-1/2 z-10 size-6 -translate-x-1/2 fill-current ${tone.crown} ${winner ? "size-8 -top-7" : ""}`} />
      <CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className={`${winner ? "size-14 sm:size-20" : "size-11 sm:size-16"} border-2 border-background text-sm sm:text-lg`} />
    </div>
    <p className={`mt-3 font-display text-xs font-bold sm:text-sm ${tone.icon}`}>{winner ? "Champion" : `#${entry.rank}`}</p>
    <p className="mt-1 w-full truncate text-xs font-semibold text-foreground sm:text-sm">{entry.name}</p>
    <p className="mt-2 font-display text-base font-bold tabular-nums text-foreground sm:text-xl">{entry.score.toLocaleString()}<span className="ml-0.5 text-2xs font-medium sm:text-xs">pts</span></p>
    <p className="mt-1 text-2xs text-text-secondary sm:text-xs">{duration(entry.speedSeconds)}</p>
  </div>;
}

/** Shows a completed contest's final podium and full ranked results. */
export function CompetitionResultsPage({ id }: { id: string }) {
  const query = useCompetitions();
  const competition = query.data?.find((item) => item.id === id);
  const celebrated = useRef(false);
  const podium = competition?.standings.slice(0, 3) ?? [];

  useEffect(() => {
    if (!podium[0] || celebrated.current) return;
    celebrated.current = true;
    const tokens = getComputedStyle(document.documentElement);
    confetti({ particleCount: 110, spread: 75, startVelocity: 28, origin: { y: 0.32 }, colors: ["--gold", "--primary", "--success"].map((token) => tokens.getPropertyValue(token).trim()) });
  }, [podium]);

  if (query.isPending) return <div className="h-56 animate-pulse rounded-lg bg-surface-subtle" />;
  if (query.isError || !competition || competition.status !== "completed") return <EmptyState title="Results not available" description="This contest does not have a published result board yet." action={<Button asChild variant="outline"><Link to="/competitions"><ArrowLeft className="size-4" />Back to competitions</Link></Button>} />;

  return <div className="space-y-7">
    <PageHeader title="Hall of Fame" subtitle={`${competition.title} · final standings`} action={<Button asChild variant="outline"><Link to="/competitions"><ArrowLeft className="size-4" />All competitions</Link></Button>} />
    <Card className="overflow-hidden p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><StatusPill tone="success">Results final</StatusPill><h2 className="mt-3 font-display text-xl font-semibold text-foreground">{competition.title}</h2><p className="mt-1 text-sm text-text-secondary">{competition.courseCode} · {competition.participantCount} participants</p></div><Trophy className="size-9 text-gold-text" /></div>
      {podium.length ? <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 items-end gap-2 sm:mt-14 sm:gap-4">{[podium[1], podium[0], podium[2]].filter(Boolean).map((entry) => <PodiumSpot key={entry.rank} entry={entry} />)}</div> : <EmptyState className="mt-6" title="No final standings yet" />}
    </Card>
    <section><h2 className="mb-3 font-display text-lg font-semibold">Final standings</h2><div className="space-y-2">{competition.standings.map((entry) => <div key={`${entry.rank}-${entry.name}`} className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-sm sm:px-4 ${entry.isCurrentUser ? "border-primary/40 bg-primary-soft" : "border-border bg-surface"}`}><span className="w-7 font-display font-semibold text-text-secondary">#{entry.rank}</span><CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className="size-8 text-2xs" /><span className="min-w-0 flex-1 truncate font-medium text-foreground">{entry.name}{entry.isCurrentUser ? " (You)" : ""}</span><span className="hidden text-text-muted sm:inline">{duration(entry.speedSeconds)}</span><span className="font-semibold tabular-nums text-foreground">{entry.score.toLocaleString()} pts</span></div>)}</div></section>
  </div>;
}
