import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { PaidPill, StatusPill } from "@/components/prep/bits";
import { cbtStatusPill } from "@/components/prep/cbt-status";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cbts, formatNaira, getCourse } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/cbts")({
  head: () => ({
    meta: [
      { title: "CBTs — PrepMaster Admin" },
      { name: "description", content: "Create CBTs, schedule live exams and release results." },
      { property: "og:title", content: "CBTs — PrepMaster Admin" },
      { property: "og:description", content: "Create CBTs, schedule live exams and release results." },
    ],
  }),
  component: AdminCbts,
});

function AdminCbts() {
  return (
    <AdminShell title="CBTs" description="Practice sets and live exams." actions={<Button onClick={() => toast("New CBT", { description: "Preview only." })}><Plus className="size-4" />New CBT</Button>}>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle text-left text-xs uppercase tracking-wider text-text-muted">
            <tr><th className="px-5 py-3">Title</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Show results</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cbts.map((c) => (
              <tr key={c.id} className="hover:bg-surface-subtle/60">
                <td className="px-5 py-3.5"><p className="font-medium">{c.title}</p><p className="text-xs text-text-muted">{getCourse(c.courseSlug)?.code} · {c.questionCount} Qs · {c.minutes} min</p></td>
                <td className="px-5 py-3.5"><StatusPill tone={c.kind === "live" ? "primary" : "neutral"}>{c.kind}</StatusPill></td>
                <td className="px-5 py-3.5">{c.paid ? <span className="font-medium text-gold-text">{formatNaira(c.price ?? 0)}</span> : <PaidPill paid={false} />}</td>
                <td className="px-5 py-3.5">{cbtStatusPill(c) ?? <span className="text-text-muted">Always open</span>}</td>
                <td className="px-5 py-3.5"><Switch defaultChecked={c.revealResults !== false} onCheckedChange={(v) => toast.success(v ? "Results released" : "Results hidden")} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
