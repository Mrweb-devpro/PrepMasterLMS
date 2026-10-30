import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { Flag, Trophy, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/features/cbt/components/QuestionCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CompetitionStanding } from "@/lib/mock-data";
import { CompetitionAvatar } from "../components/CompetitionAvatar";
import { useCompetitionAnswer, useCompetitionArena, useSubmitCompetition } from "../hooks/useCompetitions";

function StandingRow({ entry, previousRank, compact = false }: { entry: CompetitionStanding; previousRank?: number; compact?: boolean }) {
  return <div className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm ${entry.isCurrentUser ? "border-primary/40 bg-primary-soft" : "border-transparent bg-surface-subtle/50"}`}>
    <span className="w-5 text-xs font-semibold text-text-muted">#{entry.rank}</span>
    <CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className="size-7 text-2xs" />
    <span className="min-w-0 flex-1 truncate font-medium text-foreground">{entry.name}{entry.isCurrentUser ? " (You)" : ""}</span>
    {!compact && previousRank && previousRank > entry.rank ? <TrendingUp className="size-3.5 text-success" /> : !compact && previousRank && previousRank < entry.rank ? <TrendingDown className="size-3.5 text-error" /> : null}
    <span className="text-xs font-semibold tabular-nums text-foreground">{entry.score}</span>
  </div>;
}

function SpectatorLounge({ standings, score, rank }: { standings: CompetitionStanding[]; score: number; rank?: number }) {
  return <main className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-7">
    <div className="mx-auto max-w-2xl text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary"><Trophy className="size-6" /></div>
      <p className="mt-4 font-display text-2xl font-semibold text-foreground">You’re on the board</p>
      <p className="mt-2 text-sm text-text-secondary">Your entry is locked in. Stay and watch the live rankings change until the arena closes.</p>
      <div className="mt-5 grid grid-cols-2 gap-3 text-left sm:mx-auto sm:max-w-sm">
        <div className="rounded-lg border border-border bg-surface-subtle p-3"><p className="text-xs text-text-muted">Your score</p><p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{score}</p></div>
        <div className="rounded-lg border border-border bg-surface-subtle p-3"><p className="text-xs text-text-muted">Provisional rank</p><p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">#{rank ?? "—"}</p></div>
      </div>
    </div>
    <div className="mt-7 border-t border-border pt-5">
      <div className="flex items-center justify-between"><h2 className="font-display text-base font-semibold text-foreground">Live standings</h2><span className="inline-flex items-center gap-1.5 text-xs text-text-secondary"><span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-70" /><span className="relative size-2 rounded-full bg-success" /></span>Updating live</span></div>
      <div className="mt-3 max-h-[42dvh] space-y-2 overflow-y-auto pr-1">{standings.map((entry) => <StandingRow key={`${entry.rank}-${entry.name}`} entry={entry} />)}</div>
    </div>
  </main>;
}

export function CompetitionArenaPage({ competitionId }: { competitionId: string }) {
  const arena = useCompetitionArena(competitionId);
  const answer = useCompetitionAnswer(competitionId);
  const submit = useSubmitCompetition(competitionId);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  const [boardOpen, setBoardOpen] = useState(false);
  const priorRanks = useRef(new Map<string, number>());

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (arena.data) setAnswers(arena.data.answers); }, [arena.data]);

  const endsAt = arena.data ? new Date(arena.data.competition.deadline).getTime() : now;
  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1_000));
  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const standings = arena.data?.standings ?? [];
  const myStanding = standings.find((entry) => entry.isCurrentUser);
  const questions = arena.data?.questions ?? [];
  const question = questions[index];
  const isSpectating = Boolean(arena.data?.entry.submitted || submit.isSuccess);
  const topStandings = standings.slice(0, 7);
  const pinnedStanding = myStanding && !topStandings.some((entry) => entry.isCurrentUser) ? myStanding : undefined;

  useEffect(() => { standings.forEach((entry) => priorRanks.current.set(entry.name, entry.rank)); }, [standings]);
  useEffect(() => { if (arena.data && secondsLeft === 0 && !isSpectating && !submit.isPending && !submit.isSuccess) submit.mutate(); }, [arena.data, isSpectating, secondsLeft, submit]);
  useEffect(() => {
    if (!submit.isSuccess) return;
    const tokens = getComputedStyle(document.documentElement);
    confetti({ particleCount: 90, spread: 65, origin: { y: 0.64 }, colors: ["--primary", "--gold", "--success"].map((token) => tokens.getPropertyValue(token).trim()) });
  }, [submit.isSuccess]);

  if (arena.isPending) return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="text-center"><p className="font-display text-lg font-semibold text-foreground">Entering arena…</p><p className="mt-1 text-sm text-text-secondary">Checking your contest access and question bank.</p></div></div>;
  if (arena.error || !arena.data) {
    const message = arena.error instanceof Error ? arena.error.message : "This arena is unavailable right now.";
    return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="max-w-md rounded-xl border border-border bg-surface p-6 text-center shadow-sm"><Trophy className="mx-auto size-8 text-primary" /><h1 className="mt-4 font-display text-xl font-semibold text-foreground">Couldn’t enter the arena</h1><p className="mt-2 text-sm leading-relaxed text-text-secondary">{message}</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => arena.refetch()}>Try again</Button><Button asChild><Link to="/competitions">Back to competitions</Link></Button></div></div></div>;
  }
  if (!isSpectating && !question) return <div className="p-8 text-sm text-text-secondary">This contest’s question bank is being prepared.</div>;

  return <div className="min-h-screen bg-background">
    <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
      <Button asChild size="sm" className="bg-error text-destructive-foreground hover:bg-error/90"><Link to="/competitions">Leave arena</Link></Button>
      <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-foreground">{arena.data.competition.title}</p>
      <span className="rounded-full bg-error-bg px-3 py-1 font-display text-sm font-semibold tabular-nums text-error">{timerLabel}</span>
    </header>
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {isSpectating ? <SpectatorLounge standings={standings} score={submit.data?.score ?? arena.data.entry.score} rank={submit.data?.rank ?? myStanding?.rank} /> : <main className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between text-xs text-text-muted"><span>Question {index + 1} of {questions.length}</span><span className="inline-flex items-center gap-1"><Flag className="size-3.5" />Speed + accuracy points</span></div>
        <QuestionCard question={{ ...question!, courseSlug: "", answerIndex: -1 }} index={index} total={questions.length} selected={answers[question!.id]} onSelect={(choice) => { setAnswers((current) => ({ ...current, [question!.id]: choice })); answer.mutate({ questionId: question!.id, selectedIndex: choice }); }} />
        <div className="mt-7 flex justify-end">{index === questions.length - 1 ? <Button disabled={submit.isPending || secondsLeft === 0} onClick={() => submit.mutate()}>Finish contest</Button> : <Button onClick={() => setIndex((current) => current + 1)}>Next question</Button>}</div>
      </main>}
      <aside className="hidden rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-6 lg:block lg:h-fit">
        <div className="flex items-center gap-2"><Trophy className="size-4 text-gold-text" /><h2 className="font-display text-sm font-semibold">Live standings</h2></div>
        <div className="mt-4 space-y-2">{topStandings.map((entry) => <StandingRow key={`${entry.rank}-${entry.name}`} entry={entry} previousRank={priorRanks.current.get(entry.name)} />)}</div>
        {pinnedStanding && <div className="mt-3 border-t border-border pt-3"><p className="mb-2 text-2xs font-medium uppercase tracking-wider text-text-muted">Your position</p><StandingRow entry={pinnedStanding} /></div>}
        <div className="mt-4 border-t border-border pt-3 text-xs text-text-secondary"><span className="inline-flex items-center gap-1"><Users className="size-3.5" />{standings.length} competing</span></div>
      </aside>
    </div>
    <button type="button" onClick={() => setBoardOpen(true)} className="fixed left-1/2 top-16 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-lg lg:hidden"><Trophy className="size-3.5" />Rank #{myStanding?.rank ?? "—"} · {myStanding?.score ?? 0} pts · Board</button>
    <Dialog open={boardOpen} onOpenChange={setBoardOpen}><DialogContent className="top-auto bottom-0 max-h-[75dvh] translate-y-0 rounded-b-none"><DialogHeader><DialogTitle>Live standings</DialogTitle><DialogDescription>Scores refresh while the contest is active.</DialogDescription></DialogHeader><div className="overflow-y-auto">{standings.slice(0, 20).map((entry) => <div key={`${entry.rank}-${entry.name}`} className="py-1"><StandingRow entry={entry} compact /></div>)}</div></DialogContent></Dialog>
  </div>;
}
