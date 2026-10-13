import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, FileText, MonitorCheck, Users } from "lucide-react";
import { AdminShell } from "@/components/prep/AdminShell";
import { Card, StatCard, StatusPill } from "@/components/prep/bits";
import { cbts, files, formatNaira, students, transactions } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin overview — PrepMaster" },
      { name: "description", content: "Revenue, students and content at a glance." },
      { property: "og:title", content: "Admin overview — PrepMaster" },
      { property: "og:description", content: "Revenue, students and content at a glance." },
    ],
  }),
  component: AdminHome,
});

const bars = [42, 58, 35, 72, 64, 88, 76, 94, 70, 82, 100, 90];

function AdminHome() {
  const revenue = transactions.filter((t) => t.status === "verified").reduce((a, t) => a + t.amount, 0);
  return (
    <AdminShell title="Overview" description="How PrepMaster is doing this month.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={formatNaira(revenue)} hint="+18% vs last month" icon={CreditCard} />
        <StatCard label="Students" value={students.length} hint="2 joined this week" icon={Users} />
        <StatCard label="Files" value={files.length} hint="Across 4 courses" icon={FileText} />
        <StatCard label="CBTs" value={cbts.length} hint="1 live right now" icon={MonitorCheck} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Revenue trend</h2>
            <span className="text-xs text-text-muted">Last 12 weeks</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm bg-primary/15 transition-colors hover:bg-primary" style={{ height: `${h}%` }}>
                <div className="h-1.5 rounded-t-sm bg-primary" />
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-0">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-lg font-semibold">Recent payments</h2>
            <Link to="/admin/payments" className="text-sm text-primary">View all</Link>
          </div>
          <div className="mt-3 divide-y divide-border">
            {transactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{t.student}</span><span className="block truncate text-xs text-text-muted">{t.item}</span></span>
                <StatusPill tone={t.status === "verified" ? "success" : t.status === "failed" ? "error" : "warning"}>{formatNaira(t.amount)}</StatusPill>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
