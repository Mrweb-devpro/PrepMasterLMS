import { Link } from "@tanstack/react-router";
import { Download, Plus, Trophy, Users } from "lucide-react";
import { AdminShell } from "@/components/prep/AdminShell";
import { Card, EmptyState, StatusPill } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/mock-data";
import { useCompetitions } from "../hooks/useCompetitions";

export function AdminCompetitionsPage() {
  const competitions = useCompetitions();
  const exportResults = () => {
    const rows = (competitions.data ?? []).flatMap((competition) =>
      competition.standings.map((entry) => [competition.title, entry.rank, entry.name, entry.score, entry.speedSeconds].join(",")),
    );
    const blob = new Blob([["Competition,Rank,Student,Score,Speed seconds", ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "prepmaster-competition-results.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <AdminShell
      title="Competitions"
      description="Schedule contest arenas, monitor registration, and review completed clashes."
      actions={<><Button variant="outline" onClick={exportResults}><Download />Export results</Button><Button asChild><Link to="/admin/competitions/new"><Plus />New competition</Link></Button></>}
    >
      {competitions.isPending ? <div className="h-48 animate-pulse rounded-lg bg-surface-subtle" /> : competitions.data?.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {competitions.data.map((competition) => (
            <Card key={competition.id}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs text-text-muted">{competition.courseCode} · {competition.level === "all" ? "All levels" : `${competition.level} level`}</p><h2 className="mt-1 font-display text-lg font-semibold">{competition.title}</h2></div>
                <StatusPill tone={competition.status === "live" ? "error" : competition.status === "completed" ? "neutral" : "primary"}>{competition.status}</StatusPill>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-sm text-text-secondary"><span className="inline-flex items-center gap-1.5"><Users className="size-4" />{competition.participantCount} registered</span><span className="font-medium text-gold-text">{formatNaira(competition.prizePoolNaira)}</span></div>
            </Card>
          ))}
        </div>
      ) : <EmptyState illustration={<Trophy className="size-8 text-primary" />} title="No competitions yet" description="Create the first scheduled contest for your students." action={<Button asChild><Link to="/admin/competitions/new">Create competition</Link></Button>} />}
    </AdminShell>
  );
}
