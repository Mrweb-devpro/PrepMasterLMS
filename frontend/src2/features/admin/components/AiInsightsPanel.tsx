import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, PanelHeader } from "@/features/admin/components/parts";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeCbtResults } from "@/lib/ai/insights.functions";
import type { InsightReport } from "@/lib/ai/insights.server";
import type { Cbt, Student } from "@/lib/mock-data";

function sampleResults(cbt: Cbt, students: Student[]) {
  const n = cbt.questions.length;
  return students
    .slice(0, 8)
    .map((s, si) => {
      const missed = cbt.questions
        .map((_, i) => i + 1)
        .filter((q) => (q * 7 + si * 3) % 5 < 2 + (si % 2));
      const score = Math.round(((n - missed.length) / Math.max(n, 1)) * 100);
      return `${s.name} — ${score}% — missed ${missed.length ? missed.join(", ") : "none"}`;
    })
    .join("\n");
}

const cache: Record<string, InsightReport> = {};

export function AiInsightsPanel({ cbt, students }: { cbt: Cbt; students: Student[] }) {
  const initial = useMemo(() => sampleResults(cbt, students), [cbt, students]);
  const [results, setResults] = useState(initial);
  const [report, setReport] = useState<InsightReport | undefined>(cache[cbt.id]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const analyze = useServerFn(analyzeCbtResults);

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await analyze({
        data: {
          cbtTitle: cbt.title,
          questions: cbt.questions
            .map((q, i) => `${i + 1}. ${q.text} (answer: ${q.options[q.answerIndex]})`)
            .join("\n"),
          results,
        },
      });
      if (res.ok) {
        cache[cbt.id] = res.report;
        setReport(res.report);
      } else setError(res.error);
    } catch {
      setError("Couldn't reach the AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const byName = (name: string) =>
    students.find((s) => s.name.toLowerCase() === name.toLowerCase());

  return (
    <Panel>
      <PanelHeader title="AI insights" />
      <div className="space-y-4 px-5 py-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-medium">Attempt results</p>
            <button
              className="text-xs text-text-muted hover:text-foreground"
              onClick={() => setResults(initial)}
            >
              Use sample results
            </button>
          </div>
          <Textarea
            rows={6}
            value={results}
            onChange={(e) => setResults(e.target.value)}
            className="font-mono text-xs"
            placeholder="Name — score — missed question numbers"
          />
        </div>
        <Button onClick={run} disabled={loading || !results.trim()}>
          {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {loading ? "Analyzing…" : "Analyze weak topics"}
        </Button>
        {error && (
          <p className="flex items-center gap-2 rounded-md bg-error-bg px-3 py-2 text-sm text-error">
            <AlertCircle className="size-4" />
            {error}
          </p>
        )}
        {report && (
          <div className="space-y-5 animate-fade-in">
            {report.summary && <p className="text-sm text-text-secondary">{report.summary}</p>}
            <div className="space-y-3">
              {report.topics.map((t, i) => (
                <div key={i} className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {i + 1}. {t.topic}
                    </p>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {t.struggling} struggling
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{t.why}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {t.actions.map((a, ai) => (
                      <li key={ai}>{a}</li>
                    ))}
                  </ul>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/admin/cbts/new">Create practice CBT</Link>
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/admin/courses/$slug" params={{ slug: cbt.courseSlug }}>
                        Course materials
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {report.students.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Students needing attention</p>
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {report.students.map((s, i) => {
                    const st = byName(s.name);
                    return (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                      >
                        <div>
                          <p className="font-medium">{s.name}</p>
                          <p className="text-text-muted">{s.reason}</p>
                        </div>
                        {st && (
                          <Button size="sm" variant="ghost" asChild>
                            <Link to="/admin/students/$studentId" params={{ studentId: st.id }}>
                              Profile
                            </Link>
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
