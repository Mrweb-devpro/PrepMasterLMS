import { Link } from "@tanstack/react-router";
import { Download, Pencil } from "lucide-react";
import { AdminShell } from "@/components/prep/AdminShell";
import { Card, EmptyState, StatusPill } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { useCompetitions } from "../hooks/useCompetitions";
import { formatNaira } from "@/lib/mock-data";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

/** Displays one contest's settings and exports only that contest's standings. */
export function AdminCompetitionDetailPage({ id }: { id: string }) {
  const query = useCompetitions();
  const competition = query.data?.find((item) => item.id === id);
  const exportResults = () => {
    if (!competition) return;
    const rows = [
      ["Rank", "Student", "Score", "Time taken (seconds)"],
      ...competition.standings.map((entry) => [entry.rank, entry.name, entry.score, entry.speedSeconds]),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${competition.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-results.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <AdminShell title={competition?.title ?? "Competition"} description="Contest settings and results." back={{ to: "/admin/competitions", label: "All competitions" }}>
    {query.isPending ? <p>Loading competition…</p> : query.isError ? <EmptyState title="Couldn’t load competition" action={<Button onClick={() => query.refetch()}>Try again</Button>} /> : !competition ? <EmptyState title="Competition not found" /> : <>
      <div className="mb-5 flex flex-wrap items-center gap-3"><StatusPill tone="neutral">{competition.status}</StatusPill><Button variant="outline" asChild><Link to="/admin/competitions/$competitionId/edit" params={{ competitionId: competition.id }}><Pencil className="size-4" />Edit competition</Link></Button><Button variant="outline" onClick={exportResults}><Download className="size-4" />Export results</Button></div>
      <Card><p className="text-text-secondary">{competition.description}</p><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-text-muted">Course / level</dt><dd>{competition.courseCode} · {competition.level}</dd></div><div><dt className="text-text-muted">Start / duration</dt><dd>{new Date(competition.startsAt).toLocaleString()} · {competition.durationMinutes} minutes</dd></div><div><dt className="text-text-muted">Prize pool</dt><dd>{formatNaira(competition.prizePoolNaira)} — {competition.prizeDescription || "No prize description"}</dd></div><div><dt className="text-text-muted">Participants</dt><dd>{competition.participantCount}</dd></div></dl></Card>
      <div className="mt-5 space-y-2">{competition.standings.length ? competition.standings.map((entry) => <div key={`${entry.rank}-${entry.name}`} className="flex gap-3 rounded-lg border border-border bg-surface p-3 text-sm"><span>#{entry.rank}</span><span className="flex-1">{entry.name}</span><span>{entry.score} pts</span><span className="text-text-muted">{entry.speedSeconds}s</span></div>) : <EmptyState title="No participant results yet" description="Scores will appear here once students complete the contest." />}</div>
    </>}
  </AdminShell>;
}
