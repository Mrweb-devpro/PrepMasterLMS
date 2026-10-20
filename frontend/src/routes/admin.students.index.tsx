import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Ban, RotateCcw, Search, X } from "lucide-react";
import {
  ModerationDialog,
  type ModerationMode,
} from "@/features/admin/components/ModerationDialog";
import { useState } from "react";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { StatusPill } from "@/components/prep/bits";
import { Panel, StatStrip, Td, Th } from "@/features/admin/components/parts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useAdmin } from "@/lib/admin-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/students/")({
  head: () => ({
    meta: [
      { title: "Students | PrepMaster Admin" },
      { name: "description", content: "See, search and suspend registered students." },
      { property: "og:title", content: "Students | PrepMaster Admin" },
      { property: "og:description", content: "See, search and suspend registered students." },
    ],
  }),
  component: AdminStudents,
});

function AdminStudents() {
  const admin = useAdmin();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const list = admin.students.filter((s) =>
    `${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase()),
  );
  const allSel = list.length > 0 && list.every((s) => sel.includes(s.id));

  const [mod, setMod] = useState<{ mode: ModerationMode; ids: string[]; label: string } | null>(
    null,
  );
  const plural = (n: number) => `${n} student${n > 1 ? "s" : ""}`;
  const restore = (ids: string[], label: string) => {
    admin.toggleSuspend(ids, false);
    toast.success(`${label} restored`);
    setSel([]);
  };
  const confirmMod = (reason: string) => {
    if (!mod) return;
    if (mod.mode === "suspend") admin.toggleSuspend(mod.ids, true, reason);
    else admin.warn(mod.ids, reason);
    toast.success(`${mod.label} ${mod.mode === "suspend" ? "suspended" : "warned"}`, {
      description: reason,
    });
    setMod(null);
    setSel([]);
  };

  return (
    <AdminShell title="Students" description={`${admin.students.length} registered students`}>
      <StatStrip
        items={[
          { label: "Total students", value: admin.students.length, delta: "+2" },
          { label: "Verified", value: admin.students.filter((s) => s.verified).length },
          { label: "Unverified", value: admin.students.filter((s) => !s.verified).length },
          { label: "Suspended", value: admin.suspended.length },
        ]}
      />
      <div className="relative my-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search students…"
          className="bg-surface pl-9"
        />
      </div>
      <Panel className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-surface-subtle/60">
            <tr>
              <Th className="w-10">
                <Checkbox
                  checked={allSel}
                  onCheckedChange={(v) => setSel(v ? list.map((s) => s.id) : [])}
                  aria-label="Select all"
                />
              </Th>
              <Th>Student</Th>
              <Th>Joined</Th>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th className="text-right">Action</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((s) => {
              const checked = sel.includes(s.id);
              const suspended = admin.isSuspended(s.id);
              return (
                <tr
                  key={s.id}
                  onClick={() =>
                    navigate({ to: "/admin/students/$studentId", params: { studentId: s.id } })
                  }
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-surface-hover",
                    checked &&
                      "bg-primary-soft shadow-[inset_2px_0_0_var(--primary)] hover:bg-primary-soft",
                  )}
                >
                  <Td>
                    <span onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(v) =>
                          setSel((p) => (v ? [...p, s.id] : p.filter((x) => x !== s.id)))
                        }
                        aria-label={`Select ${s.name}`}
                      />
                    </span>
                  </Td>
                  <Td>
                    <span className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle text-2xs font-semibold">
                        {s.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">{s.name}</span>
                        <span className="block text-xs text-text-muted">{s.email}</span>
                      </span>
                    </span>
                  </Td>
                  <Td className="text-text-secondary">{s.joinedAt}</Td>
                  <Td>
                    <StatusPill tone={s.verified ? "success" : "warning"}>
                      {s.verified ? "Verified" : "Unverified"}
                    </StatusPill>
                  </Td>
                  <Td>
                    <span className="flex flex-wrap items-center gap-1.5">
                      {suspended ? (
                        <StatusPill tone="error">Suspended</StatusPill>
                      ) : (
                        <StatusPill tone="neutral">Active</StatusPill>
                      )}
                      {(admin.warnings[s.id]?.length ?? 0) > 0 && (
                        <StatusPill tone="warning">
                          {admin.warnings[s.id]?.length ?? 0} warning
                          {(admin.warnings[s.id]?.length ?? 0) > 1 ? "s" : ""}
                        </StatusPill>
                      )}
                    </span>
                    {suspended && admin.suspendReasons[s.id] && (
                      <span className="mt-1 block max-w-[220px] truncate text-xs text-text-muted">
                        {admin.suspendReasons[s.id]?.reason}
                      </span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <span onClick={(e) => e.stopPropagation()} className="inline-flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMod({ mode: "warn", ids: [s.id], label: s.name })}
                      >
                        <AlertTriangle />
                        Warn
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          suspended
                            ? restore([s.id], s.name)
                            : setMod({ mode: "suspend", ids: [s.id], label: s.name })
                        }
                      >
                        {suspended ? (
                          <>
                            <RotateCcw />
                            Restore
                          </>
                        ) : (
                          <>
                            <Ban />
                            Suspend
                          </>
                        )}
                      </Button>
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      {sel.length > 0 && (
        <div className="fixed inset-x-3 bottom-4 z-30 mx-auto flex max-w-[calc(100vw-1.5rem)] animate-rise flex-wrap items-center justify-center gap-2 rounded-lg border border-border bg-surface p-2 shadow-lg sm:w-fit sm:flex-nowrap sm:pl-4">
          <span className="w-full text-center text-sm sm:w-auto sm:text-left">
            <span className="font-semibold">{sel.length}</span>{" "}
            <span className="text-text-muted">selected</span>
          </span>
          <Button size="sm" variant="outline" onClick={() => restore(sel, plural(sel.length))}>
            <RotateCcw />
            Restore
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMod({ mode: "warn", ids: sel, label: plural(sel.length) })}
          >
            <AlertTriangle />
            Warn
          </Button>
          <Button
            size="sm"
            onClick={() => setMod({ mode: "suspend", ids: sel, label: plural(sel.length) })}
          >
            <Ban />
            Suspend
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Clear"
            onClick={() => setSel([])}
          >
            <X />
          </Button>
        </div>
      )}
      <ModerationDialog
        open={!!mod}
        mode={mod?.mode ?? "warn"}
        targetLabel={mod?.label ?? ""}
        onOpenChange={(o) => !o && setMod(null)}
        onConfirm={confirmMod}
      />
    </AdminShell>
  );
}
