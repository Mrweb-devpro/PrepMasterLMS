import { Link } from "@tanstack/react-router";
import { Plus, Trophy, Users, Pencil, TriangleAlert } from "lucide-react";
import { AdminShell } from "@/components/prep/AdminShell";
import { Card, EmptyState, StatusPill } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/mock-data";
import { useCompetitions } from "../hooks/useCompetitions";

export function AdminCompetitionsPage() {
  const competitions = useCompetitions();
  return (
    <AdminShell
      title="Competitions"
      description="Schedule contest arenas, monitor registration, and review completed clashes."
      actions={<Button asChild><Link to="/admin/competitions/new"><Plus />New competition</Link></Button>}
    >
      {competitions.isPending ? <div className="h-48 animate-pulse rounded-lg bg-surface-subtle" /> : competitions.data?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {competitions.data.map((competition) => (
            <Card key={competition.id}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs text-text-muted">{competition.courseCode} · {competition.level === "all" ? "All levels" : `${competition.level} level`}</p><h2 className="mt-1 font-display text-lg font-semibold"><Link to="/admin/competitions/$competitionId" params={{ competitionId: competition.id }} className="hover:underline">{competition.title}</Link></h2></div>
                <div className="flex flex-wrap items-center gap-2"><StatusPill tone={competition.status === "live" ? "error" : competition.status === "completed" ? "neutral" : "primary"}>{competition.status}</StatusPill><Button size="sm" variant="outline" asChild><Link to="/admin/competitions/$competitionId/edit" params={{ competitionId: competition.id }}><Pencil className="size-3.5" />Edit</Link></Button></div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-sm text-text-secondary"><span className="inline-flex items-center gap-1.5"><Users className="size-4" />{competition.participantCount} registered</span><span className="font-medium text-gold-text">{formatNaira(competition.prizePoolNaira)}</span></div>
              {!competition.cbtId && competition.status !== "completed" && <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-warning-bg px-2.5 py-1.5 text-xs font-medium text-warning"><TriangleAlert className="size-3.5" />Add a linked CBT question bank before this contest starts.</p>}
            </Card>
          ))}
        </div>
      ) : <EmptyState illustration={<Trophy className="size-8 text-primary" />} title="No competitions yet" description="Create the first scheduled contest for your students." action={<Button asChild><Link to="/admin/competitions/new">Create competition</Link></Button>} />}
    </AdminShell>
  );
}
