import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Ban, RotateCcw } from "lucide-react";
import { useState } from "react";
import {
  ModerationDialog,
  type ModerationMode,
} from "@/features/admin/components/ModerationDialog";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { EmptyState, StatusPill } from "@/components/prep/bits";
import { KV, Panel, PanelHeader, Td, Th } from "@/features/admin/components/parts";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/lib/admin-store";
import { useTransactions } from "@/features/payments/useTransactions";
import { formatNaira } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile | PrepMaster Admin" },
      { name: "description", content: "A student's details, payments and account status." },
      { property: "og:title", content: "Student profile | PrepMaster Admin" },
      { property: "og:description", content: "A student's details, payments and account status." },
    ],
  }),
  component: StudentDetail,
});

function StudentDetail() {
  const { studentId } = Route.useParams();
  const admin = useAdmin();
  const [mode, setMode] = useState<ModerationMode | null>(null);
  const transactions = useTransactions("all");
  const s = admin.students.find((x) => x.id === studentId);
  if (!s)
    return (
      <AdminShell title="Student not found" back={{ to: "/admin/students", label: "All students" }}>
        <EmptyState title="No such student" />
      </AdminShell>
    );
  const suspended = admin.isSuspended(s.id);
  const warns = admin.warnings[s.id] ?? [];
  const pays = transactions.filter((t) => t.student === s.name);

  return (
    <AdminShell
      title={s.name}
      description={s.email}
      back={{ to: "/admin/students", label: "All students" }}
      actions={
        <>
          <Button variant="outline" onClick={() => setMode("warn")}>
            <AlertTriangle />
            Give warning
          </Button>
          <Button
            variant={suspended ? "outline" : "default"}
            onClick={() => {
              if (suspended) {
                admin.toggleSuspend([s.id], false);
                toast.success("Student restored");
              } else setMode("suspend");
            }}
          >
            {suspended ? (
              <>
                <RotateCcw />
                Restore access
              </>
            ) : (
              <>
                <Ban />
                Suspend student
              </>
            )}
          </Button>
        </>
      }
    >
      {suspended && admin.suspendReasons[s.id] && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-error/30 bg-error-bg p-4 text-sm">
          <Ban className="mt-0.5 size-4 shrink-0 text-error" />
          <div>
            <p className="font-medium text-error">
              Suspended on {admin.suspendReasons[s.id]?.date}
            </p>
            <p className="text-text-secondary">{admin.suspendReasons[s.id]?.reason}</p>
          </div>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-6">
          <Panel className="h-fit">
            <PanelHeader title="Profile" />
            <div className="px-5 py-2">
              <KV k="Joined" v={s.joinedAt} />
              <KV
                k="Email"
                v={
                  <StatusPill tone={s.verified ? "success" : "warning"}>
                    {s.verified ? "Verified" : "Unverified"}
                  </StatusPill>
                }
              />
              <KV
                k="Account"
                v={
                  suspended ? (
                    <StatusPill tone="error">Suspended</StatusPill>
                  ) : (
                    <StatusPill tone="neutral">Active</StatusPill>
                  )
                }
              />
              <KV
                k="Total spent"
                v={formatNaira(
                  pays.filter((p) => p.status === "verified").reduce((a, p) => a + p.amount, 0),
                )}
              />
            </div>
          </Panel>
          <Panel className="h-fit">
            <PanelHeader title={`Warnings (${warns.length})`} />
            <div className="px-5 py-3">
              {warns.length === 0 ? (
                <p className="py-2 text-sm text-text-muted">No warnings issued.</p>
              ) : (
                <ul className="space-y-3">
                  {warns.map((w, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                      <div>
                        <p>{w.reason}</p>
                        <p className="text-xs text-text-muted">{w.date}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>
        <Panel className="h-fit overflow-x-auto">
          <PanelHeader title="Payments" />
          {pays.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No payments yet" />
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <Th>Item</Th>
                  <Th>Amount</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pays.map((t) => (
                  <tr key={t.id}>
                    <Td className="font-medium">{t.item}</Td>
                    <Td>{formatNaira(t.amount)}</Td>
                    <Td>
                      <StatusPill
                        tone={
                          t.status === "verified"
                            ? "success"
                            : t.status === "failed"
                              ? "error"
                              : "warning"
                        }
                      >
                        {t.status}
                      </StatusPill>
                    </Td>
                    <Td className="text-text-muted">{t.date}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
      <ModerationDialog
        open={!!mode}
        mode={mode ?? "warn"}
        targetLabel={s.name}
        onOpenChange={(o) => !o && setMode(null)}
        onConfirm={(reason) => {
          if (mode === "suspend") admin.toggleSuspend([s.id], true, reason);
          else admin.warn([s.id], reason);
          toast.success(mode === "suspend" ? "Student suspended" : "Warning sent", {
            description: reason,
          });
          setMode(null);
        }}
      />
    </AdminShell>
  );
}
