import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GradeBadge } from "@/features/solidworks/components/bits";
import { swQueries } from "@/features/solidworks/hooks/queries";
import { formatDate } from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import { Panel, Td, Th } from "../../components/parts";

const FILTERS = [
  { v: "pending", label: "Needs grading" },
  { v: "graded", label: "Graded" },
  { v: "all", label: "All" },
] as const;

export function SwSubmissionsPage() {
  const navigate = useNavigate();
  const { data: subs } = useSuspenseQuery(swQueries.submissions());
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const [q, setQ] = useState("");
  const [f, setF] = useState<(typeof FILTERS)[number]["v"]>("pending");
  const title = (id: string) => tasks.find((t) => t.id === id)?.title ?? "Deleted task";
  const list = subs.filter(
    (s) =>
      (f === "all" || (f === "graded" ? !!s.grade : !s.grade)) &&
      `${s.userName} ${title(s.taskId)}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search student or task"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((x) => (
            <button
              key={x.v}
              onClick={() => setF(x.v)}
              className={cn(
                "h-8 rounded-full border px-3 text-xs",
                f === x.v
                  ? "border-primary bg-primary-soft font-medium text-primary"
                  : "border-border bg-surface",
              )}
            >
              {x.label} {x.v === "pending" && `(${subs.filter((s) => !s.grade).length})`}
            </button>
          ))}
        </div>
      </div>
      <Panel className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <Th>Student</Th>
              <Th>Task</Th>
              <Th>Files</Th>
              <Th>Submitted</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr
                key={s.id}
                onClick={() => navigate({ to: "/admin/sw-submissions/$id", params: { id: s.id } })}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-subtle"
              >
                <Td className="font-medium">{s.userName}</Td>
                <Td>{title(s.taskId)}</Td>
                <Td>{s.files.length}</Td>
                <Td>{formatDate(s.submittedAt)}</Td>
                <Td>
                  <GradeBadge sub={s} />
                </Td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <Td className="py-10 text-center text-text-muted">Nothing here.</Td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
