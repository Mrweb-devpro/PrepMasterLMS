import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/prep/AdminShell";
import { StatusPill } from "@/components/prep/bits";
import { formatNaira, transactions } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "Payments — PrepMaster Admin" },
      { name: "description", content: "Track verified, pending and failed student payments." },
      { property: "og:title", content: "Payments — PrepMaster Admin" },
      { property: "og:description", content: "Track verified, pending and failed student payments." },
    ],
  }),
  component: AdminPayments,
});

const filters = ["all", "verified", "initiated", "failed"] as const;

function AdminPayments() {
  const [f, setF] = useState<(typeof filters)[number]>("all");
  const list = transactions.filter((t) => f === "all" || t.status === f);
  return (
    <AdminShell title="Payments" description="Every transaction across the platform.">
      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((x) => (
          <button key={x} onClick={() => setF(x)} className={cn("rounded-full border px-3.5 py-1.5 text-sm capitalize", f === x ? "border-ink bg-ink text-ink-foreground" : "border-border bg-surface text-text-secondary")}>
            {x}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-surface-subtle text-left text-xs uppercase tracking-wider text-text-muted">
            <tr><th className="px-5 py-3">Reference</th><th className="px-5 py-3">Student</th><th className="px-5 py-3">Item</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((t) => (
              <tr key={t.id}>
                <td className="px-5 py-3.5 font-mono text-xs text-text-muted">{t.id}</td>
                <td className="px-5 py-3.5 font-medium">{t.student}</td>
                <td className="px-5 py-3.5 text-text-secondary">{t.item}</td>
                <td className="px-5 py-3.5 font-medium">{formatNaira(t.amount)}</td>
                <td className="px-5 py-3.5"><StatusPill tone={t.status === "verified" ? "success" : t.status === "failed" ? "error" : "warning"}>{t.status}</StatusPill></td>
                <td className="px-5 py-3.5 text-text-muted">{t.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
