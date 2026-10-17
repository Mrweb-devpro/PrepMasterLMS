import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  Clock3,
} from "lucide-react";
import { StudentShell } from "@/components/prep/StudentShell";
import { Card, FileIcon, LiveBadge, PaidPill, SectionTitle } from "@/components/prep/bits";
import { usePrep } from "@/lib/prep-store";
import { formatDateTime } from "@/lib/mock-data";
import { useCatalog } from "@/features/catalog/useCatalog";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — PrepMaster" },
      {
        name: "description",
        content:
          "Your upcoming live CBTs, newest study materials and unfinished practice attempts.",
      },
      { property: "og:title", content: "Home — PrepMaster" },
      {
        property: "og:description",
        content:
          "Your upcoming live CBTs, newest study materials and unfinished practice attempts.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const prep = usePrep();
  const { cbts, getCbt, getCourse, recentFiles } = useCatalog();
  const liveCbts = cbts.filter(
    (c) => c.kind === "live" && (c.status === "live" || c.status === "upcoming"),
  );
  const lastAttempt = [...prep.attempts]
    .filter((attempt) => Boolean(attempt.submittedAt))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  const lastCbt = lastAttempt ? getCbt(lastAttempt.cbtId) : undefined;
  const lastCourse = lastCbt ? getCourse(lastCbt.courseSlug) : undefined;
  const lastScore =
    lastAttempt &&
    lastAttempt.correct !== null &&
    lastAttempt.total > 0 &&
    lastCbt?.revealResults !== false
      ? Math.round((lastAttempt.correct / lastAttempt.total) * 100)
      : null;

  return (
    <StudentShell>
      <div className="relative mb-10 overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-8 md:p-10">
        <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Hi {prep.name.split(" ")[0]}, ready to ace this week?
            </h1>
            <p className="mt-2.5 max-w-md text-sm text-text-secondary sm:text-base">
              You have {liveCbts.length} live CBTs coming up and {prep.unfinishedAttempts.length}{" "}
              practice sets waiting.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link
                to="/cbts"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Browse CBTs <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/drive"
                className="inline-flex items-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-subtle"
              >
                Open Drive
              </Link>
            </div>
          </div>
          <div>
            <div className="rounded-lg border border-border bg-surface-subtle/60 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  Latest Test Result
                </span>
                <span className="max-w-32 truncate rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-medium text-text-secondary">
                  {lastCourse ? `${lastCourse.code} · Test` : "No attempt yet"}
                </span>
              </div>
              <p className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {lastScore === null ? "—" : `${lastScore}%`}
              </p>
              <p className="mt-1 truncate text-xs text-text-secondary">
                {lastAttempt
                  ? lastScore === null
                    ? "Results pending"
                    : lastCbt?.title ?? "Completed CBT"
                  : "Take a CBT to see your score"}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-surface-subtle/60 p-3.5">
                <p className="font-display text-2xl font-bold text-foreground">
                  {prep.ownedFileIds.length}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">Files owned</p>
              </div>
              <div className="rounded-lg border border-border bg-surface-subtle/60 p-3.5">
                <p className="font-display text-2xl font-bold text-foreground">
                  {prep.ownedCbtIds.length}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">CBTs owned</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-10">
        <SectionTitle
          aside={
            <Link to="/cbts" className="text-sm text-primary hover:text-primary-hover">
              View all
            </Link>
          }
        >
          Upcoming Live CBTs
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {liveCbts.map((cbt) => {
            const course = getCourse(cbt.courseSlug);
            return (
              <Card key={cbt.id} className="card-hover flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-text-secondary">{course?.code}</p>
                    <h3 className="text-lg font-semibold leading-tight">{cbt.title}</h3>
                  </div>
                  {cbt.status === "live" ? (
                    <LiveBadge />
                  ) : (
                    <PaidPill paid={cbt.paid} owned={prep.ownsCbt(cbt.id)} />
                  )}
                </div>
                <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <CalendarClock className="size-4" />
                  {cbt.scheduledFor ? formatDateTime(cbt.scheduledFor) : "Schedule TBC"} ·{" "}
                  {cbt.minutes} min
                </p>
                <Link
                  to="/cbts/$cbtId"
                  params={{ cbtId: cbt.id }}
                  className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                >
                  {cbt.status === "live" ? "Enter exam" : "View details"}
                  <ArrowRight className="size-4" />
                </Link>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle
          aside={
            <Link to="/drive" className="text-sm text-primary hover:text-primary-hover">
              Open Drive
            </Link>
          }
        >
          Recently added materials
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {recentFiles.map((file) => {
            const course = getCourse(file.courseSlug);
            return (
              <Link
                key={file.id}
                to="/drive/$course/$category/$subfolder"
                params={{
                  course: file.courseSlug,
                  category: file.category,
                  subfolder: file.subfolderSlug,
                }}
                className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 shadow-sm transition-colors hover:border-border-strong hover:bg-surface-subtle"
              >
                <div className="flex items-center justify-between">
                  <FileIcon type={file.type} />
                  <PaidPill paid={file.paid} owned={prep.ownsFile(file.id)} />
                </div>
                <p className="line-clamp-2 text-sm font-medium">{file.name}</p>
                <p className="text-xs text-text-muted">
                  {course?.code} · {file.addedAt}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle>Continue where you left off</SectionTitle>
        {prep.unfinishedAttempts.length === 0 ? (
          <Card className="text-sm text-text-muted">No unfinished attempts. Nice work.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {prep.unfinishedAttempts.map((attempt) => {
              const cbt = getCbt(attempt.cbtId);
              if (!cbt) return null;
              const course = getCourse(cbt.courseSlug);
              const pct = Math.round((attempt.answered / (attempt.total || 1)) * 100);
              return (
                <Card key={attempt.cbtId} className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-secondary">{course?.code}</p>
                    <p className="font-medium">{cbt.title}</p>
                    <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-subtle">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                      <Clock3 className="size-3.5" />
                      {attempt.answered} of {attempt.total} answered · last opened{" "}
                      {attempt.lastOpened}
                    </p>
                  </div>
                  <Link
                    to="/attempt/$cbtId"
                    params={{ cbtId: cbt.id }}
                    className="rounded-md border border-primary px-3.5 py-2 text-sm font-medium text-primary transition-colors hover:bg-secondary"
                  >
                    Resume
                  </Link>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </StudentShell>
  );
}
