import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { PaidPill, StatusPill } from "@/components/prep/bits";
import { cbtStatusPill } from "@/features/cbt/utils/cbt-status";
import { Panel, StatStrip, Td, Th } from "@/features/admin/components/parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "@/lib/admin-store";
import { formatNaira } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/cbts/")({
  head: () => ({
    meta: [
      { title: "CBTs | PrepMaster Admin" },
      { name: "description", content: "Create CBTs, schedule live exams and release results." },
      { property: "og:title", content: "CBTs | PrepMaster Admin" },
      {
        property: "og:description",
        content: "Create CBTs, schedule live exams and release results.",
      },
    ],
  }),
  component: AdminCbts,
});

const tabs = ["all", "practice", "live"] as const;

function AdminCbts() {
  const admin = useAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof tabs)[number]>("all");
  const [q, setQ] = useState("");
  const list = admin.cbts
    .filter(
      (c) => (tab === "all" || c.kind === tab) && c.title.toLowerCase().includes(q.toLowerCase()),
    )
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (a.scheduledFor && b.scheduledFor) {
        return new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime();
      }
      return 0;
    });

  return (
    <AdminShell
      title="CBTs"
      description="Practice sets and live exams."
      actions={
        <Button asChild>
          <Link to="/admin/cbts/new">
            <Plus />
            New CBT
          </Link>
        </Button>
      }
    >
      <StatStrip
        items={[
          { label: "Total CBTs", value: admin.cbts.length },
          { label: "Practice", value: admin.cbts.filter((c) => c.kind === "practice").length },
          { label: "Live", value: admin.cbts.filter((c) => c.kind === "live").length },
          { label: "Paid", value: admin.cbts.filter((c) => c.paid).length },
        ]}
      />
      <div className="my-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border bg-surface p-0.5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "h-8 rounded-sm px-3 text-sm capitalize",
                tab === t ? "bg-surface-subtle font-medium" : "text-text-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search CBTs…"
            className="bg-surface pl-9"
          />
        </div>
      </div>
      <Panel className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-surface-subtle/60">
            <tr>
              <Th>Title</Th>
              <Th>Type</Th>
              <Th>Price</Th>
              <Th>Status</Th>
              <Th>Show results</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((c) => (
              <tr
                key={c.id}
                onClick={() => navigate({ to: "/admin/cbts/$cbtId", params: { cbtId: c.id } })}
                className="cursor-pointer transition-colors hover:bg-surface-hover"
              >
                <Td>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-text-muted">
                    {admin.courses.find((x) => x.slug === c.courseSlug)?.code} ·{" "}
                    {c.questions.length} Qs · {c.minutes} min
                  </p>
                </Td>
                <Td>
                  <StatusPill tone={c.kind === "live" ? "primary" : "neutral"}>{c.kind}</StatusPill>
                </Td>
                <Td>
                  {c.paid ? (
                    <span className="font-medium text-gold-text">{formatNaira(c.price ?? 0)}</span>
                  ) : (
                    <PaidPill paid={false} />
                  )}
                </Td>
                <Td>{cbtStatusPill(c) ?? <span className="text-text-muted">Always open</span>}</Td>
                <Td>
                  <span onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={c.revealResults !== false}
                      onCheckedChange={(v) => {
                        admin.toggleReveal(c.id);
                        toast.success(v ? "Results released" : "Results hidden");
                      }}
                    />
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AdminShell>
  );
}
