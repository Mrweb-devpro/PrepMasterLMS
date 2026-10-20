import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarClock, Clock3, ListChecks, Lock, RotateCcw, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { StudentShell } from "@/components/prep/StudentShell";
import { Breadcrumbs, Card, EmptyState, PaidPill } from "@/components/prep/bits";
import { PurchaseDialog } from "@/features/drive/components/PurchaseDialog";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/mock-data";
import { useCatalog, useRefreshCatalog } from "@/features/catalog/useCatalog";
import { LIVE } from "@/lib/api/config";
import { usePrep } from "@/lib/prep-store";
import { cbtStatusPill } from "@/features/cbt/utils/cbt-status";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { formatEndTimeOnly, formatSecondsCountdown, formatSmartCbtDate } from "@/features/cbt/utils/cbt-time";

export const Route = createFileRoute("/cbts/$cbtId")({
  head: () => ({
    meta: [
      { title: "CBT details | PrepMaster" },
      { name: "description", content: "Rules, timing and access for this computer-based test." },
      { property: "og:title", content: "CBT details | PrepMaster" },
      {
        property: "og:description",
        content: "Rules, timing and access for this computer-based test.",
      },
    ],
  }),
  component: CbtDetail,
});

function CbtDetail() {
  const { cbtId } = Route.useParams();
  const prep = usePrep();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [buying, setBuying] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const refreshCatalog = useRefreshCatalog();
  const { getCbt, getCourse, loading } = useCatalog();
  const cbt = getCbt(cbtId);
  const openMs = cbt?.scheduledFor ? new Date(cbt.scheduledFor).getTime() : null;
  const closeMs = cbt?.closesAt
    ? new Date(cbt.closesAt).getTime()
    : openMs
      ? openMs + (cbt?.minutes ?? 30) * 60_000
      : null;

  useEffect(() => {
    if (!openMs && !closeMs) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (openMs && current >= openMs && current - openMs < 2_000) void refreshCatalog();
      if (closeMs && current >= closeMs && current - closeMs < 2_000) void refreshCatalog();
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [closeMs, openMs, refreshCatalog]);

  if (loading) return <StudentShell>{null}</StudentShell>;
  if (!cbt)
    return (
      <StudentShell>
        <EmptyState title="CBT not found" />
      </StudentShell>
    );
  const course = getCourse(cbt.courseSlug);
  const locked = cbt.paid && !prep.ownsCbt(cbt.id);
  const isUpcoming = Boolean(openMs && nowMs < openMs);
  const isLiveNow = Boolean(openMs && closeMs && nowMs >= openMs && nowMs < closeMs);
  const isClosed = Boolean(cbt.kind === "live" && closeMs && nowMs >= closeMs);
  const secondsToOpen = openMs ? Math.floor((openMs - nowMs) / 1000) : null;
  const secondsToClose = closeMs ? Math.floor((closeMs - nowMs) / 1000) : null;
  const showOpenCountdown = Boolean(isUpcoming && secondsToOpen !== null && secondsToOpen <= 60 && secondsToOpen > 0);
  const showCloseCountdown = Boolean(isLiveNow && secondsToClose !== null && secondsToClose <= 60 && secondsToClose > 0);
  const canStart = !cbt.paused && !isClosed && (cbt.kind === "practice" || isLiveNow || cbt.status === "live");
  const isLiveClosed =
    cbt.kind === "live" && (isClosed || (cbt.status !== "live" && cbt.status !== "upcoming"));
  const completedAttempt = prep.attempts.find((attempt) => attempt.cbtId === cbt.id);
  const score =
    completedAttempt?.correct !== null && completedAttempt?.correct !== undefined && completedAttempt.total > 0
      ? Math.round((completedAttempt.correct / completedAttempt.total) * 100)
      : null;

  return (
    <StudentShell>
      <Breadcrumbs items={[{ label: "CBTs", to: "/cbts" }, { label: cbt.title }]} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="rounded-sm bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
              {course?.code}
            </span>
            {cbtStatusPill(cbt)}
            <PaidPill paid={cbt.paid} owned={prep.ownsCbt(cbt.id)} />
          </div>
          <h1 className="text-3xl font-semibold">{cbt.title}</h1>
          <p className="mt-2 text-text-secondary">
            {course?.title} · {cbt.kind === "live" ? "Live exam" : "Practice set"}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { i: ListChecks, l: "Questions", v: cbt.questionCount },
              { i: Clock3, l: "Duration", v: `${cbt.minutes} min` },
              { i: RotateCcw, l: "Retakes", v: cbt.retakePolicy },
            ].map((s) => (
              <Card key={s.l} className="p-4">
                <s.i className="size-4 text-primary" />
                <p className="mt-2 text-xs text-text-muted">{s.l}</p>
                <p className="text-sm font-semibold">{s.v}</p>
              </Card>
            ))}
            {cbt.kind === "practice" && !cbt.scheduledFor ? (
              <Card className="p-4">
                <CalendarClock className="size-4 text-primary" />
                <p className="mt-2 text-xs text-text-muted">Schedule</p>
                <p className="text-sm font-semibold">Anytime</p>
              </Card>
            ) : isLiveNow ? (
              <Card className="border-error/40 bg-error-bg/50 p-4 text-error dark:bg-error-bg/25">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-error opacity-75" />
                    <span className="relative inline-flex size-2 rounded-full bg-error" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider">Live now</span>
                </div>
                <p className="mt-1.5 text-xs text-error/80">{showCloseCountdown ? "Ending soon" : "CBT is active"}</p>
                <p className="text-sm font-bold">
                  {showCloseCountdown
                    ? `Ends in ${formatSecondsCountdown(secondsToClose!)}`
                    : `Ends at ${formatEndTimeOnly(cbt.closesAt ?? (closeMs ? new Date(closeMs).toISOString() : null))}`}
                </p>
              </Card>
            ) : isUpcoming ? (
              <Card className="border-warning/30 bg-warning-bg p-4 text-warning">
                <CalendarClock className="size-4" />
                <p className="mt-2 text-xs text-warning/80">Scheduled</p>
                <p className="text-sm font-semibold">
                  {showOpenCountdown ? `Starts in ${formatSecondsCountdown(secondsToOpen!)}` : formatSmartCbtDate(cbt.scheduledFor)}
                </p>
                {closeMs && !showOpenCountdown && (
                  <p className="mt-0.5 text-[11px] text-warning/80">Ends {formatEndTimeOnly(new Date(closeMs).toISOString())}</p>
                )}
              </Card>
            ) : (
              <Card className="p-4 opacity-75">
                <CalendarClock className="size-4 text-text-muted" />
                <p className="mt-2 text-xs text-text-muted">Status</p>
                <p className="text-sm font-semibold text-text-secondary">Exam closed</p>
              </Card>
            )}
          </div>

          <Card className="mt-6">
            <h2 className="text-lg font-semibold">Before you begin</h2>
            <ul className="mt-3 space-y-2 text-sm text-text-secondary">
              <li>• The timer starts as soon as you open the first question.</li>
              <li>• You can flag questions and come back to them before submitting.</li>
              <li>• Your answers save automatically if you lose connection.</li>
              <li>
                •{" "}
                {cbt.revealResults === false
                  ? "Results are released by your instructor later."
                  : "You'll see your score right after submitting."}
              </li>
            </ul>
          </Card>

          {cbt.status === "past-results-shown" && score !== null && (
            <Card className="mt-6 flex items-center gap-4 border-success/30 bg-success-bg">
              <Trophy className="size-8 text-success" />
              <div>
                <p className="text-sm text-text-secondary">Your score</p>
                <p className="font-display text-2xl font-semibold">{score}%</p>
              </div>
            </Card>
          )}
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          {isLiveClosed ? (
            <>
              <p className="font-semibold">Exam ended</p>
              <p className="mt-1 text-sm text-text-secondary">
                {cbt.closesAt
                  ? `This live exam closed on ${formatSmartCbtDate(cbt.closesAt)}. Access and purchases are closed.`
                  : "The testing window for this scheduled exam has ended."}
              </p>
              <Button className="mt-4 w-full" disabled>
                Exam closed
              </Button>
              {cbt.status === "past-results-shown" && completedAttempt && (
                <Link
                  to="/attempts/$attemptId"
                  params={{ attemptId: completedAttempt.id }}
                  className="mt-3 block text-center text-sm font-medium text-primary hover:underline"
                >
                  View results
                </Link>
              )}
            </>
          ) : isUpcoming ? (
            <>
              <p className="font-semibold">Scheduled to open soon</p>
              <p className="mt-1 text-sm text-text-secondary">
                This live exam opens {showOpenCountdown ? `in ${formatSecondsCountdown(secondsToOpen!)}` : formatSmartCbtDate(cbt.scheduledFor)}.
              </p>
              <Button className="mt-4 w-full" disabled>
                Exam opens soon
              </Button>
              <Button
                variant="outline"
                className="mt-2 w-full"
                onClick={() => toast.success("Reminder set", { description: "We'll notify you 30 minutes before." })}
              >
                Remind me
              </Button>
            </>
          ) : locked ? (
            <>
              <span className="flex size-10 items-center justify-center rounded-full bg-gold-bg text-gold-text">
                <Lock className="size-5" />
              </span>
              <p className="mt-3 font-semibold">This is a paid CBT</p>
              <p className="mt-1 text-sm text-text-secondary">
                Unlock once and keep access in your library.
              </p>
              <p className="mt-4 font-display text-3xl font-semibold text-gold-text">
                {formatNaira(cbt.price ?? 0)}
              </p>
              <Button
                className="mt-4 w-full bg-gold text-foreground hover:bg-gold/85"
                onClick={() => setBuying(true)}
              >
                Unlock CBT
              </Button>
            </>
          ) : (
            <>
              <p className="font-semibold">{isLiveNow ? "Live exam in progress" : canStart ? "Ready when you are" : "Not open yet"}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {canStart
                  ? `${cbt.questionCount} questions · ${cbt.minutes} minutes`
                  : cbt.paused
                    ? "Pending release — your instructor will open it soon."
                    : "This exam isn't available to take right now."}
              </p>
              <Button
                className="mt-4 w-full"
                disabled={!canStart}
                onClick={async () => {
                  const ok = await confirm({
                    title: cbt.kind === "live" ? "Start this exam?" : "Start this practice?",
                    description: `The ${cbt.minutes}-minute timer starts as soon as you begin and can't be paused.`,
                    confirmLabel: "Start now",
                  });
                  if (ok) navigate({ to: "/attempt/$cbtId", params: { cbtId: cbt.id } });
                }}
              >
                {cbt.status === "live" ? "Enter exam" : "Start practice"}
              </Button>
            </>
          )}
          <Link
            to="/cbts"
            className="mt-4 block text-center text-sm text-text-muted hover:text-foreground"
          >
            Back to all CBTs
          </Link>
        </Card>
      </div>

      <PurchaseDialog
        open={buying}
        onOpenChange={setBuying}
        itemName={cbt.title}
        price={cbt.price ?? 0}
        onConfirm={async () => {
          await prep.purchaseCbt(cbt.id);
          if (!LIVE) toast.success("Payment confirmed", { description: `${cbt.title} is now unlocked.` });
        }}
      />
    </StudentShell>
  );
}
