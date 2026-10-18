import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/prep/AdminShell";
import { Card, StatusPill } from "@/components/prep/bits";
import { StatStrip } from "@/features/admin/components/parts";
import { formatNaira } from "@/lib/mock-data";
import { useTransactions } from "@/features/payments/useTransactions";
import type { Transaction } from "@/features/payments/payments.api";
import { useCatalog } from "@/features/catalog/useCatalog";
import { useAdmin } from "@/lib/admin-store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Overview | PrepMaster Admin" },
      { name: "description", content: "Revenue, students and content at a glance." },
      { property: "og:title", content: "Overview | PrepMaster Admin" },
      { property: "og:description", content: "Revenue, students and content at a glance." },
    ],
  }),
  component: AdminHome,
});

interface WeekBucket {
  label: string;
  startDate: Date;
  endDate: Date;
  revenue: number;
  count: number;
}

function getWeeklyRevenueData(transactions: Transaction[]): WeekBucket[] {
  const now = new Date();
  const buckets: WeekBucket[] = [];

  for (let i = 11; i >= 0; i--) {
    const endDate = new Date(now);
    endDate.setDate(now.getDate() - i * 7);
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    buckets.push({
      label: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      startDate,
      endDate,
      revenue: 0,
      count: 0,
    });
  }

  for (const transaction of transactions) {
    if (transaction.status !== "verified") continue;
    const transactionDate = new Date(transaction.date.replace(" ", "T"));
    const bucket = buckets.find(
      (week) => transactionDate >= week.startDate && transactionDate <= week.endDate,
    );
    if (!bucket) continue;
    bucket.revenue += transaction.amount;
    bucket.count += 1;
  }

  return buckets;
}

function RevenueTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as WeekBucket;
  return (
    <div className="rounded-lg border border-border bg-surface p-2.5 shadow-md">
      <p className="text-xs font-medium text-text-secondary">{data.label}</p>
      <p className="mt-1 font-display text-base font-bold text-foreground">
        {formatNaira(data.revenue)}
      </p>
      <p className="text-[11px] text-text-muted">
        {data.count} {data.count === 1 ? "payment" : "payments"}
      </p>
    </div>
  );
}

function AdminHome() {
  const transactions = useTransactions("all");
  const { files } = useCatalog();
  const { cbts, students } = useAdmin();
  const revenue = transactions
    .filter((t) => t.status === "verified")
    .reduce((a, t) => a + t.amount, 0);
  const weeklyData = useMemo(() => getWeeklyRevenueData(transactions), [transactions]);
  return (
    <AdminShell
      title="Overview"
      description="How PrepMaster is doing this month."
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/admin/courses/new">
              <Plus />
              New course
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/cbts/new">
              <Plus />
              Create CBT
            </Link>
          </Button>
        </>
      }
    >
      <StatStrip
        items={[
          { label: "Revenue", value: formatNaira(revenue), delta: "+18%" },
          { label: "Students", value: students.length, delta: "+2" },
          { label: "Files", value: files.length },
          { label: "CBTs", value: cbts.length },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Revenue trend</h2>
              <p className="text-xs text-text-muted">Last 12 weeks of verified student payments</p>
            </div>
            <span className="rounded-md border border-border bg-surface-subtle px-2 py-0.5 text-xs font-medium text-text-secondary">
              Total: {formatNaira(revenue)}
            </span>
          </div>
          <div className="mt-6 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--border)"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  tickFormatter={(value) =>
                    value >= 1000 ? `₦${(value / 1000).toFixed(0)}k` : `₦${value}`
                  }
                />
                <Tooltip
                  content={<RevenueTooltip />}
                  cursor={{ fill: "var(--surface-hover)", opacity: 0.5 }}
                />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-0">
          <div className="flex items-center justify-between px-5 pt-5">
            <h2 className="text-lg font-semibold">Recent payments</h2>
            <Link to="/admin/payments" className="text-sm text-primary">
              View all
            </Link>
          </div>
          <div className="mt-3 divide-y divide-border">
            {transactions.slice(0, 5).map((t) => (
              <Link
                key={t.id}
                to="/admin/payments"
                className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-surface-hover"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{t.student}</span>
                  <span className="block truncate text-xs text-text-muted">{t.item}</span>
                </span>
                <StatusPill
                  tone={
                    t.status === "verified"
                      ? "success"
                      : t.status === "failed"
                        ? "error"
                        : "warning"
                  }
                >
                  {formatNaira(t.amount)}
                </StatusPill>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
