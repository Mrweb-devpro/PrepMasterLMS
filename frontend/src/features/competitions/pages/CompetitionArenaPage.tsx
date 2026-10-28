import { Link } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { Flag, Trophy, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/features/cbt/components/QuestionCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCompetitionAnswer, useCompetitionArena, useSubmitCompetition } from "../hooks/useCompetitions";

export function CompetitionArenaPage({ competitionId }: { competitionId: string }) {
  const arena = useCompetitionArena(competitionId);
  const answer = useCompetitionAnswer(competitionId);
  const submit = useSubmitCompetition(competitionId);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());
  const [boardOpen, setBoardOpen] = useState(false);
  const priorRanks = useRef(new Map<string, number>());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { if (arena.data) setAnswers(arena.data.answers); }, [arena.data]);
  const endsAt = arena.data ? new Date(arena.data.competition.deadline).getTime() : now;
  const secondsLeft = Math.max(0, Math.ceil((endsAt - now) / 1_000));
  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const standings = arena.data?.standings ?? [];
  const myStanding = standings.find((entry) => entry.isCurrentUser);
  const questions = arena.data?.questions ?? [];
  const question = questions[index];

  useEffect(() => {
    standings.forEach((entry) => priorRanks.current.set(entry.name, entry.rank));
  }, [standings]);

  useEffect(() => {
    if (arena.data && secondsLeft === 0 && !submit.isPending && !submit.isSuccess) submit.mutate();
  }, [arena.data, secondsLeft, submit]);

  useEffect(() => {
    if (!submit.isSuccess) return;
    const tokens = getComputedStyle(document.documentElement);
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.65 },
      colors: ["--primary", "--gold", "--success"].map((token) => tokens.getPropertyValue(token).trim()),
    });
  }, [submit.isSuccess]);

  if (arena.isPending) return <div className="p-8 text-sm text-text-secondary">Entering arena…</div>;
  if (arena.error || !arena.data) return <div className="p-8 text-sm text-text-secondary">This arena is unavailable right now.</div>;
  if (!question) return <div className="p-8 text-sm text-text-secondary">This contest’s question bank is being prepared.</div>;
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4 sm:px-6">
        <Link to="/competitions" className="text-sm text-text-secondary hover:text-foreground">Leave arena</Link>
          <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold">{arena.data.competition.title}</p>
        <span className="rounded-full bg-error-bg px-3 py-1 font-display text-sm font-semibold tabular-nums text-error">{timerLabel}</span>
      </header>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-7">
          <div className="mb-4 flex items-center justify-between text-xs text-text-muted"><span>Question {index + 1} of {questions.length}</span><span className="inline-flex items-center gap-1"><Flag className="size-3.5" />Speed + accuracy points</span></div>
          <QuestionCard question={{ ...question, courseSlug: "", answerIndex: -1 }} index={index} total={questions.length} selected={answers[question.id]} onSelect={(choice) => { setAnswers((current) => ({ ...current, [question.id]: choice })); answer.mutate({ questionId: question.id, selectedIndex: choice }); }} />
          <div className="mt-7 flex justify-end">{index === questions.length - 1 ? <Button disabled={submit.isPending || secondsLeft === 0} onClick={() => submit.mutate()}>Finish contest</Button> : <Button onClick={() => setIndex((current) => current + 1)}>Next question</Button>}</div>
        </main>
        <aside className="rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-6 lg:h-fit">
          <div className="flex items-center gap-2"><Trophy className="size-4 text-gold-text" /><h2 className="font-display text-sm font-semibold">Live standings</h2></div>
          <div className="mt-4 space-y-2">
            {standings.slice(0, 10).map((entry) => {
              const previousRank = priorRanks.current.get(entry.name);
              return <div key={entry.name} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"><span className="w-5 text-xs font-semibold text-text-muted">#{entry.rank}</span><span className="min-w-0 flex-1 truncate font-medium">{entry.name}</span>{previousRank && previousRank > entry.rank ? <TrendingUp className="size-3.5 text-success" /> : previousRank && previousRank < entry.rank ? <TrendingDown className="size-3.5 text-error" /> : null}<span className="text-xs tabular-nums text-text-secondary">{entry.score}</span></div>;
            })}
          </div>
          <div className="mt-4 border-t border-border pt-3 text-xs text-text-secondary"><span className="inline-flex items-center gap-1"><Users className="size-3.5" />{standings.length} competing</span></div>
        </aside>
      </div>
      <button type="button" onClick={() => setBoardOpen(true)} className="fixed left-1/2 top-16 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-lg lg:hidden"><Trophy className="size-3.5" />Rank #{myStanding?.rank ?? "—"} · {myStanding?.score ?? 0} pts · Board</button>
      <Dialog open={boardOpen} onOpenChange={setBoardOpen}><DialogContent className="top-auto bottom-0 max-h-[75dvh] translate-y-0 rounded-b-none"><DialogHeader><DialogTitle>Live standings</DialogTitle><DialogDescription>Scores refresh while the contest is active.</DialogDescription></DialogHeader><div className="overflow-y-auto">{standings.slice(0, 20).map((entry) => <div key={entry.rank} className="flex items-center gap-2 border-b border-border py-2 text-sm"><span className="w-6 text-text-muted">#{entry.rank}</span><span className="flex-1 truncate font-medium">{entry.name}</span><span>{entry.score}</span></div>)}</div></DialogContent></Dialog>
      <Dialog open={submit.isSuccess || secondsLeft === 0} onOpenChange={() => {}}><DialogContent><DialogHeader><DialogTitle className="font-display text-2xl">Competition complete</DialogTitle><DialogDescription>Your final result is ready.</DialogDescription></DialogHeader><div className="rounded-lg bg-primary-soft p-5 text-center"><Trophy className="mx-auto size-8 text-gold-text" /><p className="mt-3 text-sm text-text-secondary">Your rank</p><p className="font-display text-4xl font-semibold">#{submit.data?.rank ?? "—"}</p><p className="mt-2 text-sm text-text-secondary">{submit.data?.score ?? 0} points · Top {submit.data?.participantCount ? Math.max(1, Math.round(((submit.data.rank ?? submit.data.participantCount) / submit.data.participantCount) * 100)) : 100}%</p></div><Button asChild><Link to="/competitions">Back to competitions</Link></Button></DialogContent></Dialog>
    </div>
  );
}
