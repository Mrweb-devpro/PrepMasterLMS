import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { AdminShell } from "@/components/prep/AdminShell";
import { StatusPill } from "@/components/prep/bits";
import { Input } from "@/components/ui/input";
import { students } from "@/lib/mock-data";

export const Route = createFileRoute("/admin/students")({
  head: () => ({
    meta: [
      { title: "Students — PrepMaster Admin" },
      { name: "description", content: "See every registered student and their verification status." },
      { property: "og:title", content: "Students — PrepMaster Admin" },
      { property: "og:description", content: "See every registered student and their verification status." },
    ],
  }),
  component: AdminStudents,
});

function AdminStudents() {
  const [q, setQ] = useState("");
  const list = students.filter((s) => `${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <AdminShell title="Students" description={`${students.length} registered students`}>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="bg-surface pl-9" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
        {list.map((s) => (
          <div key={s.id} className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0">
            <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
              {s.name.split(" ").map((n) => n[0]).join("")}
            </span>
            <span className="min-w-0 flex-1"><span className="block font-medium">{s.name}</span><span className="block truncate text-xs text-text-muted">{s.email}</span></span>
            <span className="hidden text-sm text-text-secondary sm:block">Joined {s.joinedAt}</span>
            <StatusPill tone={s.verified ? "success" : "warning"}>{s.verified ? "Verified" : "Unverified"}</StatusPill>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
