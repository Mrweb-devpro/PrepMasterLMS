import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { EmptyState, PageHeader } from "@/components/prep/bits";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/mock-api";
import { SubmittedTag, TaskNumber, TaskThumb } from "../components/bits";
import { swQueries } from "../hooks/queries";
import { useSwUser } from "../hooks/useSwUser";

export function TasksPage() {
  const user = useSwUser();
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const { data: subs } = useSuspenseQuery(swQueries.submissions(user.id));
  const [q, setQ] = useState("");
  const done = new Set(subs.map((s) => s.taskId));
  const list = tasks.filter((t) =>
    `#${t.number} ${t.number} ${t.title} ${t.summary}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Tasks" subtitle="One task per video. Draw it, then submit your work." />
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by task number or title"
          className="pl-9"
        />
      </div>
      {list.length === 0 && <EmptyState title="No tasks match your search" />}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <Link
            key={t.id}
            to="/solidworks/tasks/$taskId"
            params={{ taskId: t.id }}
            className="group overflow-hidden rounded-lg border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative">
              <TaskThumb
                task={t}
                className="transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute left-3 top-3 flex items-center gap-1.5">
                <TaskNumber n={t.number} />
                {done.has(t.id) && <SubmittedTag />}
              </span>
            </div>
            <div className="p-4">
              <p className="font-medium leading-snug">{t.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{t.summary}</p>
              <p className="mt-3 text-2xs text-text-muted">Posted {formatDate(t.createdAt)}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
