import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarClock, Clock3, ListChecks, Lock, RotateCcw, Trophy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StudentShell } from "@/components/prep/StudentShell";
import { Breadcrumbs, Card, EmptyState, PaidPill } from "@/components/prep/bits";
import { PurchaseDialog } from "@/features/drive/components/PurchaseDialog";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatNaira } from "@/lib/mock-data";
import { useCatalog } from "@/features/catalog/useCatalog";
import { LIVE } from "@/lib/api/config";
import { usePrep } from "@/lib/prep-store";
import { cbtStatusPill } from "@/features/cbt/utils/cbt-status";
import { useConfirm } from "@/components/common/ConfirmDialog";

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
  const { getCbt, getCourse, loading } = useCatalog();
  const cbt = getCbt(cbtId);
  if (loading) return <StudentShell>{null}</StudentShell>;
  if (!cbt)
    return (
      <StudentShell>
        <EmptyState title="CBT not found" />
      </StudentShell>
    );
  const course = getCourse(cbt.courseSlug);
  const locked = cbt.paid && !prep.ownsCbt(cbt.id);
  const canStart = !cbt.paused && (cbt.kind === "practice" || cbt.status === "live");

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
              {
                i: CalendarClock,
                l: "Schedule",
                v: cbt.scheduledFor ? formatDateTime(cbt.scheduledFor) : "Anytime",
              },
            ].map((s) => (
              <Card key={s.l} className="p-4">
                <s.i className="size-4 text-primary" />
                <p className="mt-2 text-xs text-text-muted">{s.l}</p>
                <p className="text-sm font-semibold">{s.v}</p>
              </Card>
            ))}
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

          {cbt.status === "past-results-shown" && (
            <Card className="mt-6 flex items-center gap-4 border-success/30 bg-success-bg">
              <Trophy className="size-8 text-success" />
              <div>
                <p className="text-sm text-text-secondary">Your score</p>
                <p className="font-display text-2xl font-semibold">{cbt.score}%</p>
              </div>
            </Card>
          )}
        </div>

        <Card className="h-fit lg:sticky lg:top-24">
          {locked ? (
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
              <p className="font-semibold">{canStart ? "Ready when you are" : "Not open yet"}</p>
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
              {cbt.status === "upcoming" && (
                <Button
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() =>
                    toast.success("Reminder set", {
                      description: "We'll notify you 30 minutes before.",
                    })
                  }
                >
                  Remind me
                </Button>
              )}
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
