import { Link } from "@tanstack/react-router";
import { Bell, CalendarClock, ChevronRight, Loader2, Medal, Trophy, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card, EmptyState, LiveBadge, StatusPill, PageHeader } from "@/components/prep/bits";
import { visibleForLevel } from "../utils/visibility";
import { Button } from "@/components/ui/button";
import { useSession } from "@/features/auth/session";
import { formatNaira, type Competition } from "@/lib/mock-data";
import { useCompetitions, useRegisterForCompetition } from "../hooks/useCompetitions";

function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.ceil((new Date(target).getTime() - now) / 1_000));
  const parts = [Math.floor(seconds / 86_400), Math.floor((seconds % 86_400) / 3_600), Math.floor((seconds % 3_600) / 60), seconds % 60];
  return <span className="font-display tabular-nums text-sm font-semibold">{parts.map((part) => String(part).padStart(2, "0")).join(":")}</span>;
}

function ContestCard({ competition, onRegister, registering }: { competition: Competition; onRegister: (competition: Competition) => void; registering?: boolean }) {
  const isLive = competition.status === "live";
  return (
    <Card className={isLive ? "border-error/40" : ""}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {isLive ? <LiveBadge /> : <StatusPill tone="primary">Upcoming</StatusPill>}
            <StatusPill tone="neutral">{competition.courseCode}</StatusPill>
            <StatusPill tone="neutral">{competition.level === "all" ? "All levels" : `${competition.level} level`}</StatusPill>
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{competition.title}</h3>
          <p className="mt-1 text-sm text-text-secondary">{competition.description}</p>
        </div>
        <span className="rounded-full bg-gold-bg px-3 py-1 text-xs font-semibold text-gold-text">
          {formatNaira(competition.prizePoolNaira)} prize pool
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-text-secondary">
        <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />{competition.participantCount} participants</span>
        {isLive ? <span className="text-error">Arena is open now</span> : <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" />Starts in <Countdown target={competition.startsAt} /></span>}
        {isLive ? (
          <Button asChild size="sm"><Link to="/competitions/$competitionId/arena" params={{ competitionId: competition.id }}>Enter arena <ChevronRight /></Link></Button>
        ) : (
          <Button size="sm" variant={competition.registered ? "outline" : "default"} disabled={competition.registered || registering} onClick={() => onRegister(competition)}>
            {registering ? <><Loader2 className="size-4 animate-spin" />Registering…</> : competition.registered ? "Registered" : "Register"}
          </Button>
        )}
      </div>
    </Card>
  );
}

function CompetitionsEmptyState() {
  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-surface px-5 py-10 text-center shadow-sm sm:px-10 sm:py-14">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary shadow-sm">
        <Trophy className="size-7" />
      </div>
      <p className="mt-5 font-display text-xl font-semibold tracking-tight text-foreground">
        The arena is getting ready
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-secondary">
        There are no competitions available for your level right now. New challenges will appear here as soon as they are scheduled.
      </p>
      <div className="mx-auto mt-7 grid max-w-lg gap-3 text-left sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-surface-subtle p-3.5">
          <CalendarClock className="size-4 text-primary" />
          <p className="mt-2 text-sm font-medium text-foreground">Scheduled contests</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">See the course, start time, rules, and prize before you enter.</p>
        </div>
        <div className="rounded-lg border border-border bg-surface-subtle p-3.5">
          <Bell className="size-4 text-primary" />
          <p className="mt-2 text-sm font-medium text-foreground">No need to keep checking</p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">A clear announcement will appear when the next competition is close.</p>
        </div>
      </div>
    </section>
  );
}

export function CompetitionsPage() {
  const { user } = useSession();
  const competitions = useCompetitions();
  const register = useRegisterForCompetition();
  const visible = useMemo(
    () => (competitions.data ?? []).filter((competition) => visibleForLevel(competition, user)),
    [competitions.data, user],
  );
  const live = visible.filter((competition) => competition.status === "live");
  const upcoming = visible.filter((competition) => competition.status === "scheduled");
  const past = visible.filter((competition) => competition.status === "completed");
  const onRegister = (competition: Competition) => register.mutate(competition.id, {
    onSuccess: () => toast.success("You’re registered", { description: `We’ll see you at ${competition.title}.` }),
    onError: (error: Error) => toast.error("Couldn’t register", { description: error.message }),
  });

  if (competitions.isPending) return <div className="h-48 animate-pulse rounded-lg bg-surface-subtle" />;
  return (
    <div className="space-y-8">
      <PageHeader title="Competitions & Contests" subtitle="Join live timed blitzes, compete with coursemates, and win cash prizes." />

      {visible.length === 0 ? (
        <CompetitionsEmptyState />
      ) : (
        <>

      <section>
        <div className="mb-3 flex items-center gap-2"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-error opacity-70" /><span className="relative size-2 rounded-full bg-error" /></span><h2 className="font-display text-lg font-semibold">Live now</h2></div>
        {live.length ? <div className="grid gap-4 lg:grid-cols-2">{live.map((competition) => <ContestCard key={competition.id} competition={competition} onRegister={onRegister} registering={register.isPending && register.variables === competition.id} />)}</div> : <EmptyState title="No contest is live right now" description="The next scheduled clash will appear here." />}
      </section>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold">Upcoming clashes</h2>
        {upcoming.length ? <div className="grid gap-4 lg:grid-cols-2">{upcoming.map((competition) => <ContestCard key={competition.id} competition={competition} onRegister={onRegister} registering={register.isPending && register.variables === competition.id} />)}</div> : <EmptyState title="No upcoming competitions" />}
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2"><Medal className="size-5 text-gold-text" /><h2 className="font-display text-lg font-semibold">Hall of Fame</h2></div>
        <div className="grid gap-4 lg:grid-cols-2">
          {past.map((competition) => (
            <Card key={competition.id} className="p-0 transition-colors hover:border-primary/40">
              <Link to="/competitions/$competitionId/results" params={{ competitionId: competition.id }} className="block p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <p className="text-xs font-medium text-text-muted">{competition.courseCode} · {competition.participantCount} participants</p>
                <h3 className="mt-1 font-semibold">{competition.title}</h3>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {competition.standings.slice(0, 3).map((entry) => <div key={entry.rank} className="rounded-md bg-surface-subtle p-2 text-center"><p className="text-xs font-semibold text-gold-text">#{entry.rank}</p><p className="mt-1 truncate text-xs font-medium">{entry.name}</p><p className="mt-1 text-2xs text-text-secondary">{entry.score.toLocaleString()} pts</p></div>)}
                </div>
                <p className="mt-4 text-sm font-medium text-primary">View final results</p>
              </Link>
            </Card>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
