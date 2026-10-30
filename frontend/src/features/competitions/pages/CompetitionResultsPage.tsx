import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { ArrowLeft, Crown } from "lucide-react";
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
  return (
    <div className="results-podium__column" data-place={entry.rank} aria-label={`Place ${entry.rank}: ${entry.name}`}>
      <div className="results-podium__portrait">
        {champion
          ? <Crown aria-hidden="true" className="results-podium__crown" />
          : <span className="results-podium__position" aria-hidden="true">{entry.rank}</span>}
        <CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className="results-podium__avatar" />
      </div>
      <p className="results-podium__name" title={entry.name}>{entry.name}</p>
      <p className="results-podium__points">{entry.score.toLocaleString()} <span>pts</span></p>
      <p className="results-podium__time">{duration(entry.speedSeconds)}</p>
      <div className="results-podium__pedestal" aria-hidden="true">
        <span className="results-podium__medal">{entry.rank}</span>
        {champion && <svg className="results-podium__laurel" viewBox="0 0 64 40" fill="currentColor" aria-hidden="true">
          <path d="M31 35C16 33 9 22 8 8M33 35C48 33 55 22 56 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="7" cy="12" rx="3" ry="6" transform="rotate(-30 7 12)" /><ellipse cx="14" cy="14" rx="3" ry="6" transform="rotate(25 14 14)" />
          <ellipse cx="12" cy="23" rx="3" ry="6" transform="rotate(-50 12 23)" /><ellipse cx="21" cy="23" rx="3" ry="6" transform="rotate(25 21 23)" />
          <ellipse cx="22" cy="32" rx="3" ry="6" transform="rotate(-70 22 32)" />
          <ellipse cx="57" cy="12" rx="3" ry="6" transform="rotate(30 57 12)" /><ellipse cx="50" cy="14" rx="3" ry="6" transform="rotate(-25 50 14)" />
          <ellipse cx="52" cy="23" rx="3" ry="6" transform="rotate(50 52 23)" /><ellipse cx="43" cy="23" rx="3" ry="6" transform="rotate(-25 43 23)" />
          <ellipse cx="42" cy="32" rx="3" ry="6" transform="rotate(70 42 32)" />
        </svg>}
      </div>
    </div>
  );
}

function StandingRow({ entry }: { entry: CompetitionStanding }) {
  return <tr data-current-user={Boolean(entry.isCurrentUser)}>
    <td>{entry.rank}</td>
    <td><div className="results-standings__player"><CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className="results-standings__avatar" /><span title={entry.name}>{entry.name}{entry.isCurrentUser ? " (You)" : ""}</span></div></td>
    <td><strong>{entry.score.toLocaleString()} pts</strong><small>{duration(entry.speedSeconds)}</small></td>
  </tr>;
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
    <Card className="results-podium-card"><div><StatusPill tone="success">Results final</StatusPill><h2 className="mt-3 font-display text-xl font-semibold text-foreground">{competition.title}</h2></div>{podium.length ? <div className="results-podium">{[2, 1, 3].map((rank) => {
      const entry = podium.find((finisher) => finisher.rank === rank);
      return entry ? <PodiumColumn key={rank} entry={entry} /> : <div key={rank} aria-hidden="true" />;
    })}</div> : <EmptyState className="mt-6" title="No final standings yet" />}</Card>
    <section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold text-foreground">Final standings</h2><span className="text-xs text-text-secondary">{competition.participantCount} players</span></div><div className="results-standings"><table><caption className="sr-only">Competition results from fourth place onward</caption><thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Points / time</th></tr></thead><tbody>{remaining.length ? remaining.map((entry) => <StandingRow key={`${entry.rank}-${entry.name}`} entry={entry} />) : <tr><td colSpan={3} className="results-standings__empty">All participants are shown on the podium.</td></tr>}</tbody></table></div></section>
    {currentUser && <YourStandingBar entry={currentUser} />}
  </div>;
}
