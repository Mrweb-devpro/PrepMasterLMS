import { Link, useBlocker, useNavigate } from "@tanstack/react-router";
import confetti from "canvas-confetti";
import { Check, Loader2, Trophy, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/features/cbt/components/QuestionCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { CompetitionStanding } from "@/lib/mock-data";
import { CompetitionAvatar } from "../components/CompetitionAvatar";
import { useArenaQuestions, useCompetitionArena, useSubmitCompetition } from "../hooks/useCompetitions";
import { useArenaSaves } from "../hooks/useArenaSaves";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { useSession } from "@/features/auth/session";
import { CompetitionRules } from "../components/CompetitionRules";
import { toast } from "sonner";

const EMPTY_ANSWERS: Record<string, number | null> = {};

function StandingRow({ entry }: { entry: CompetitionStanding }) {
  return <div className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm ${entry.isCurrentUser ? "border-primary/40 bg-primary-soft" : "border-transparent bg-surface-subtle/50"}`}>
    <span className="w-7 shrink-0 text-xs font-semibold text-text-muted">#{entry.rank}</span>
    <CompetitionAvatar name={entry.name} avatarUrl={entry.avatarUrl} className="size-7 text-2xs" />
    <span className="min-w-0 flex-1 break-words font-medium text-foreground">{entry.name}{entry.isCurrentUser ? " (You)" : ""}</span>
    <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">{entry.score.toLocaleString()} pts</span>
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
      <div className="mt-3 max-h-[42dvh] space-y-2 overflow-y-auto pr-1">{standings.map((entry) => <StandingRow key={entry.userId ?? `${entry.rank}-${entry.name}`} entry={entry} />)}</div>
    </div>
  </main>;
}

export function CompetitionArenaPage({ competitionId }: { competitionId: string }) {
  const { user } = useSession();
  return <ArenaSession key={`${competitionId}:${user?.id}`} competitionId={competitionId} />;
}

function ArenaSession({ competitionId }: { competitionId: string }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const arena = useCompetitionArena(competitionId);
  const submit = useSubmitCompetition(competitionId);
  const [acceptedRules, setAcceptedRules] = useState(false);
  const state = arena.data;
  const questionQuery = useArenaQuestions(competitionId, state?.competition.status === "live" && !state.entry.submitted && (acceptedRules || state.entry.started));
  const data = state ?? questionQuery.data;
  const saves = useArenaSaves(competitionId, state?.answers ?? questionQuery.data?.answers ?? EMPTY_ANSWERS);
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [boardOpen, setBoardOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const restored = useRef(false);
  const closedHandled = useRef(false);
  const allowExit = useRef(false);
  const cursorKey = `competition-cursor:${user?.id}:${competitionId}`;
  const questions = questionQuery.data?.questions ?? [];
  const isSpectating = Boolean(data?.entry.submitted || questionQuery.data?.entry.submitted || submit.isSuccess);
  const status = data?.competition.status;
  const serverOffset = state ? new Date(state.serverNow).getTime() - arena.dataUpdatedAt : 0;
  const secondsLeft = data ? Math.max(0, Math.ceil((new Date(data.competition.deadline).getTime() - now - serverOffset) / 1000)) : 0;
  const standings = data?.standings ?? [];
  const myStanding = standings.find((entry) => entry.isCurrentUser);
  const topStandings = standings.slice(0, 7);
  const pinnedStanding = myStanding && !topStandings.some((entry) => entry.isCurrentUser) ? myStanding : undefined;

  useBlocker({
    shouldBlockFn: async () => !allowExit.current && saves.hasPending() && !(await confirm({ title: "Answers are still saving", description: "Leaving now may prevent your pending answers from reaching the server. Stay here to finish saving.", confirmLabel: "Leave anyway", destructive: true })),
    enableBeforeUnload: saves.pending > 0,
  });

  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (restored.current || !questionQuery.data || !saves.ready) return;
    let cursor = questionQuery.data.entry.nextIndex;
    try { cursor = Math.max(cursor, Number(sessionStorage.getItem(cursorKey)) || 0); } catch { /* Use the saved server position. */ }
    setIndex(Math.min(cursor, questionQuery.data.questions.length));
    restored.current = true;
  }, [cursorKey, questionQuery.data, saves.ready]);

  const finish = async () => {
    if (finishing || submit.isPending) return;
    setFinishing(true);
    try {
      await saves.flush();
      if (saves.hasPending()) { toast.error("Some answers are still waiting to save. Reconnect and try again."); return; }
      await submit.mutateAsync();
    } catch (error) { toast.error("Couldn’t finish your entry", { description: (error as Error).message }); }
    finally { setFinishing(false); }
  };

  useEffect(() => {
    if (status !== "completed" || closedHandled.current || !saves.ready) return;
    closedHandled.current = true;
    const close = async () => {
      if (data?.entry.started && !data.entry.submitted) {
        try { await saves.flush(); await submit.mutateAsync(); }
        catch { toast.error("We couldn’t confirm your final submission. Your accepted answers remain saved."); }
      }
      if (saves.discardAfterClose()) toast.error("Some pending answers could not be confirmed before closing. The results show your accepted answers.");
      allowExit.current = true;
      void navigate({ to: "/competitions/$competitionId/results", params: { competitionId }, replace: true });
    };
    void close();
  }, [status, data, saves.ready, navigate, competitionId, submit, saves]);

  useEffect(() => {
    if (!submit.isSuccess || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tokens = getComputedStyle(document.documentElement);
    confetti({ particleCount: 70, spread: 65, origin: { y: 0.64 }, colors: ["--primary", "--success"].map((token) => tokens.getPropertyValue(token).trim()) });
  }, [submit.isSuccess]);

  if (!data) return <div className="flex min-h-screen items-center justify-center bg-background p-6"><div className="max-w-md text-center"><h1 className="font-display text-xl font-semibold">{arena.isPending ? "Opening competition…" : "Couldn’t load competition"}</h1>{arena.error && <><p className="mt-3 text-sm text-text-secondary">{arena.error.message}</p><Button className="mt-5" onClick={() => arena.refetch()}>Try again</Button></>}<Button asChild variant="ghost" className="mt-3"><Link to="/competitions">Back to competitions</Link></Button></div></div>;

  if (status === "scheduled" || (!acceptedRules && !data.entry.started && status === "live")) {
    const startsIn = Math.max(0, Math.ceil((new Date(data.competition.startsAt).getTime() - now - serverOffset) / 1000));
    return <div className="min-h-screen bg-background px-4 py-8"><main className="mx-auto max-w-xl rounded-xl border border-border bg-surface p-5 sm:p-8">
      <Link to="/competitions" className="text-sm text-primary">Back to competitions</Link>
      <h1 className="mt-5 font-display text-2xl font-semibold">Before you enter</h1><p className="mt-2 text-sm text-text-secondary">{data.competition.title}</p>
      <div className="my-5 rounded-lg bg-primary-soft p-3 text-sm font-medium text-primary">{status === "scheduled" ? `Starts in ${Math.floor(startsIn / 60)}m ${startsIn % 60}s` : `Arena open · ${Math.floor(secondsLeft / 60)}m ${secondsLeft % 60}s remaining`}</div>
      <CompetitionRules />
      <Button className="mt-6 w-full" disabled={status !== "live"} onClick={() => setAcceptedRules(true)}>{status === "scheduled" ? "Waiting for the shared start" : "I understand — Enter arena"}</Button>
      {arena.error && <p className="mt-3 text-sm text-error">Unable to refresh. <button className="underline" onClick={() => arena.refetch()}>Try again</button></p>}
    </main></div>;
  }

  const next = async () => {
    const question = questions[index];
    if (!question) return;
    if (!Object.prototype.hasOwnProperty.call(saves.answers, question.id)) {
      if (!(await confirm({ title: "Skip this question?", description: "You will receive zero points and cannot return to it.", confirmLabel: "Skip question" }))) return;
      saves.lock(question.id, null);
    }
    const nextIndex = index + 1;
    setIndex(nextIndex);
    try { sessionStorage.setItem(cursorKey, String(nextIndex)); } catch { /* Server position restores accepted progress. */ }
  };
  const question = questions[index];
  const selected = question ? saves.answers[question.id] : undefined;
  const locked = Boolean(question && Object.prototype.hasOwnProperty.call(saves.answers, question.id));
  const timerLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const leave = async () => {
    if (!isSpectating && status === "live" && !(await confirm({ title: "Leave the arena?", description: "The shared timer will keep running. Your accepted answers stay locked, and you can return before closing.", confirmLabel: "Leave arena", destructive: true }))) return;
    void navigate({ to: "/competitions" });
  };
  return <div className="min-h-screen bg-background">
    <header className="flex min-h-14 flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-2 sm:px-6">
      <Button size="sm" className="bg-error text-destructive-foreground hover:bg-error/90" onClick={leave}>Leave arena</Button>
      <p className="min-w-0 flex-1 truncate font-display text-sm font-semibold">{data.competition.title}</p>
      <span className="rounded-full bg-error-bg px-3 py-1 font-display text-sm font-semibold tabular-nums text-error">{timerLabel}</span>
    </header>
    <div className="mx-auto max-w-6xl px-4 py-5">
      {(arena.error || saves.error) && <div role="status" className="mb-4 rounded-lg border border-warning/30 bg-warning-bg p-3 text-sm text-foreground"><p>{saves.error ?? "Live updates are temporarily unavailable. Your saved progress is still here."}</p><p className="mt-1 text-xs">Keep this page open. Pending answers must reach the server before closing.</p><Button size="sm" variant="outline" className="mt-2" onClick={() => { void saves.flush(); void arena.refetch(); }}>Retry connection</Button></div>}
      {saves.rejected > 0 && <p role="alert" className="mb-4 rounded-lg bg-error-bg p-3 text-sm text-error">Some choices could not be accepted. Only answers confirmed by the server count towards your score.</p>}
      {status === "completed" || status === "cancelled" ? <main className="rounded-xl border border-border bg-surface p-7 text-center"><h1 className="font-display text-2xl font-semibold">{status === "cancelled" ? "Competition cancelled" : "Competition complete"}</h1><p className="mt-2 text-sm text-text-secondary">{saves.pending ? "Some answers were not confirmed before closing. Your accepted answers are saved." : "Your accepted answers are saved."}</p>{status === "completed" && <Button asChild className="mt-5"><Link to="/competitions/$competitionId/results" params={{ competitionId }}>View Hall of Fame</Link></Button>}</main> : <>
        {!isSpectating && <button onClick={() => setBoardOpen(true)} className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary-soft px-4 py-2.5 text-sm font-medium text-primary lg:hidden"><Trophy className="size-4" />Rank #{myStanding?.rank ?? "—"} · {myStanding?.score ?? 0} pts · View standings</button>}
        <div className={isSpectating ? "mx-auto max-w-3xl" : "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"}>
          {isSpectating ? <SpectatorLounge standings={standings} score={myStanding?.score ?? submit.data?.score ?? data.entry.score} {...(myStanding ? { rank: myStanding.rank } : {})} /> : <main className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-7">
            {!questionQuery.data ? <div className="py-8 text-center"><p>{questionQuery.error ? questionQuery.error.message : "Loading your questions…"}</p>{questionQuery.error && <Button className="mt-4" onClick={() => questionQuery.refetch()}>Try again</Button>}</div> : !question ? <div className="py-5 text-center"><Check className="mx-auto size-9 text-success" /><h1 className="mt-3 font-display text-xl font-semibold">You’ve reached the end</h1><p className="mt-2 text-sm text-text-secondary">Submit your entry to watch the live standings.</p><Button className="mt-5" disabled={finishing || submit.isPending} onClick={finish}>{finishing || submit.isPending ? <><Loader2 className="size-4 animate-spin" />Finishing…</> : "Finish contest"}</Button></div> : <>
              <p className="mb-4 text-xs text-text-muted">First choice is final · No going back</p>
              <QuestionCard question={{ ...question, courseSlug: "", answerIndex: -1 }} index={index} total={questions.length} selected={selected ?? undefined} disabled={locked || !saves.ready || secondsLeft === 0} onSelect={(choice) => saves.lock(question.id, choice)} />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p aria-live="polite" className="text-xs text-text-secondary">{saves.pending ? `${saves.pending} answer${saves.pending === 1 ? "" : "s"} saving in the background…` : locked ? "Answer saved" : "Choose your answer"}</p><Button disabled={!saves.ready || secondsLeft === 0} onClick={next}>{locked ? index === questions.length - 1 ? "Continue to finish" : "Next question" : "Skip question"}</Button></div>
            </>}
          </main>}
          {!isSpectating && <aside className="hidden rounded-xl border border-border bg-surface p-4 lg:sticky lg:top-6 lg:block"><h2 className="font-display text-sm font-semibold">Live standings</h2><div className="mt-4 space-y-2">{topStandings.map((entry) => <StandingRow key={entry.userId ?? `${entry.rank}-${entry.name}`} entry={entry} />)}</div>{pinnedStanding && <div className="mt-3 border-t border-border pt-3"><p className="mb-2 text-xs text-text-muted">Your position</p><StandingRow entry={pinnedStanding} /></div>}<p className="mt-4 inline-flex items-center gap-1 text-xs text-text-secondary"><Users className="size-3.5" />{standings.length} registered</p></aside>}
        </div>
      </>}
    </div>
    <Dialog open={boardOpen} onOpenChange={setBoardOpen}><DialogContent className="max-h-[80dvh]"><DialogHeader><DialogTitle>Live standings</DialogTitle><DialogDescription>Your rank can change until closing.</DialogDescription></DialogHeader><div className="space-y-2 overflow-y-auto">{standings.map((entry) => <StandingRow key={entry.userId ?? `${entry.rank}-${entry.name}`} entry={entry} />)}</div></DialogContent></Dialog>
  </div>;
}
