import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { heardLabel } from "@/features/auth/constants/options";
import { swQueries } from "@/features/solidworks/hooks/queries";
import { formatDate } from "@/lib/mock-api";
import { cn } from "@/lib/utils";
import { Panel, StatStrip, Td, Th } from "../../components/parts";

const TYPES = ["all", "student", "freelancer"] as const;

export function SwUsersPage() {
  const { data: users } = useSuspenseQuery(swQueries.users());
  const { data: subs } = useSuspenseQuery(swQueries.submissions());
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]>("all");
  const list = users.filter(
    (u) =>
      (type === "all" || u.userType === type) &&
      `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <StatStrip
        items={[
          { label: "Members", value: users.length },
          { label: "Students", value: users.filter((u) => u.userType === "student").length },
          { label: "Freelancers", value: users.filter((u) => u.userType === "freelancer").length },
          { label: "From YouTube", value: users.filter((u) => u.heard === "youtube").length },
        ]}
      />
      <div className="my-5 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "h-8 rounded-full border px-3 text-xs capitalize",
                type === t
                  ? "border-primary bg-primary-soft font-medium text-primary"
                  : "border-border bg-surface",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <Panel className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border">
            <tr>
              <Th>Name</Th>
              <Th>Type</Th>
              <Th>Heard from</Th>
              <Th>Submissions</Th>
              <Th>Joined</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr
                key={u.userId}
                onClick={() => navigate({ to: "/admin/sw-users/$userId", params: { userId: u.userId } })}
                className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-subtle"
              >
                <Td>
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </Td>
                <Td className="capitalize">{u.userType}</Td>
                <Td>{heardLabel(u.heard)}</Td>
                <Td>{subs.filter((s) => s.userId === u.userId).length}</Td>
                <Td>{formatDate(u.joinedAt)}</Td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <Td className="py-10 text-center text-text-muted">No members match.</Td>
              </tr>
            )}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
