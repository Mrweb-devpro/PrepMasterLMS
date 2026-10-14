import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/prep/AdminShell";
import { Card, StatusPill } from "@/components/prep/bits";
import { StatStrip } from "@/features/admin/components/parts";
import { formatNaira } from "@/lib/mock-data";
import { useTransactions } from "@/features/payments/useTransactions";
import { useCatalog } from "@/features/catalog/useCatalog";
import { useAdmin } from "@/lib/admin-store";

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
  const transactions = useTransactions("all");
  const { files } = useCatalog();
  const { cbts, students } = useAdmin();
  const revenue = transactions
    .filter((t) => t.status === "verified")
    .reduce((a, t) => a + t.amount, 0);
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
            <h2 className="text-lg font-semibold">Revenue trend</h2>
            <span className="text-xs text-text-muted">Last 12 weeks</span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-primary/15 transition-colors hover:bg-primary"
                style={{ height: `${h}%` }}
              >
                <div className="h-1.5 rounded-t-sm bg-primary" />
              </div>
            ))}
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
