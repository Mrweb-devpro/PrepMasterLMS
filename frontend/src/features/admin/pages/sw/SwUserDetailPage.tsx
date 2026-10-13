import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/prep/bits";
import { heardLabel } from "@/features/auth/constants/options";
import { GradeBadge } from "@/features/solidworks/components/bits";
import { swQueries } from "@/features/solidworks/hooks/queries";
import { AnsweredPill } from "@/features/solidworks/pages/QuestionsPage";
import { formatDate } from "@/lib/mock-api";
import { KV, Panel, PanelHeader, StatStrip } from "../../components/parts";

export function SwUserDetailPage({ userId }: { userId: string }) {
  const { data: users } = useSuspenseQuery(swQueries.users());
  const { data: subs } = useSuspenseQuery(swQueries.submissions());
  const { data: questions } = useSuspenseQuery(swQueries.questions());
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const user = users.find((u) => u.userId === userId);
  if (!user) return <EmptyState title="Member not found" />;

  const mine = subs.filter((s) => s.userId === userId);
  const graded = mine.filter((s) => s.grade);
  const avg = graded.length
    ? Math.round(graded.reduce((n, s) => n + (s.grade?.total ?? 0), 0) / graded.length)
    : 0;
  const asked = questions.filter((q) => q.userId === userId);
  const taskTitle = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    return t ? `#${t.number} ${t.title}` : "Task";
  };

  return (
    <div className="space-y-6">
      <StatStrip
        items={[
          { label: "Tasks submitted", value: new Set(mine.map((s) => s.taskId)).size, delta: `of ${tasks.length}` },
          { label: "Graded", value: graded.length, delta: `${mine.length - graded.length} awaiting` },
          { label: "Average score", value: graded.length ? `${avg}/100` : "—" },
          { label: "Questions asked", value: asked.length },
        ]}
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-[300px_minmax(0,1fr)] [&>*]:min-w-0">
        <Panel className="h-fit">
          <PanelHeader title="Profile" />
          <div className="px-5 py-2">
            <KV k="Name" v={user.name} />
            <KV k="Email" v={<span className="break-all">{user.email}</span>} />
            <KV k="Type" v={<span className="capitalize">{user.userType}</span>} />
            <KV k="Heard from" v={heardLabel(user.heard)} />
            <KV k="Joined" v={formatDate(user.joinedAt)} />
          </div>
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel>
            <PanelHeader title={`Submissions (${mine.length})`} />
            {mine.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-text-muted">No submissions yet.</p>
            )}
            {mine.map((s) => (
              <Link
                key={s.id}
                to="/admin/sw-submissions/$id"
                params={{ id: s.id }}
                className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0 hover:bg-surface-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{taskTitle(s.taskId)}</span>
                  <span className="block text-xs text-text-muted">
                    Submitted {formatDate(s.submittedAt)}
                  </span>
                </span>
                <GradeBadge sub={s} />
              </Link>
            ))}
          </Panel>

          <Panel>
            <PanelHeader title={`Questions (${asked.length})`} />
            {asked.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-text-muted">No questions asked.</p>
            )}
            {asked.map((q) => (
              <div key={q.id} className="border-b border-border px-5 py-3.5 last:border-b-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xs text-text-muted">{formatDate(q.createdAt)}</span>
                  <AnsweredPill count={q.responses.length} />
                </div>
                <p className="mt-1 line-clamp-2 break-words text-sm font-medium">{q.title}</p>
                <p className="mt-0.5 line-clamp-2 break-words text-sm text-text-secondary">{q.body}</p>
              </div>
            ))}
          </Panel>
        </div>
      </div>
    </div>
  );
}
