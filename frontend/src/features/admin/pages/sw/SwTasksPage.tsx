import { useSuspenseQuery } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/prep/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskThumb } from "@/features/solidworks/components/bits";
import { useCreateTask, useDeleteTask, useUpdateTask } from "@/features/solidworks/hooks/mutations";
import { swQueries } from "@/features/solidworks/hooks/queries";
import type { SwTask } from "@/features/solidworks/types";
import { formatDate } from "@/lib/mock-api";
import { TaskFormDialog } from "../../components/TaskFormDialog";

export function SwTasksActions({ onNew }: { onNew: () => void }) {
  return (
    <Button onClick={onNew}>
      <Plus className="size-4" /> New task
    </Button>
  );
}

export function SwTasksPage({
  formOpen,
  setFormOpen,
}: {
  formOpen: boolean;
  setFormOpen: (o: boolean) => void;
}) {
  const { data: tasks } = useSuspenseQuery(swQueries.tasks());
  const { data: subs } = useSuspenseQuery(swQueries.submissions());
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<SwTask | null>(null);
  const [q, setQ] = useState("");
  const list = tasks.filter((t) =>
    `#${t.number} ${t.title} ${t.summary}`.toLowerCase().includes(q.toLowerCase()),
  );

  const close = (o: boolean) => {
    setFormOpen(o);
    if (!o) setEditing(null);
  };

  return (
    <>
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks"
          className="pl-9"
        />
      </div>
      {list.length === 0 && (
        <EmptyState title="No tasks" description="Create one for your next video." />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => {
          const count = subs.filter((s) => s.taskId === t.id).length;
          return (
            <div
              key={t.id}
              className="overflow-hidden rounded-lg border border-border bg-surface shadow-sm"
            >
              <TaskThumb task={t} />
              <div className="p-4">
                <p className="font-medium"><span className="mr-1.5 font-display text-primary">#{t.number}</span>{t.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{t.summary}</p>
                <p className="mt-2 text-2xs text-text-muted">
                  {formatDate(t.createdAt)} · {count} submission{count === 1 ? "" : "s"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(t);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Delete “${t.title}”?`,
                        description:
                          "Students will no longer see this task. Existing submissions stay.",
                        confirmLabel: "Delete",
                        destructive: true,
                      });
                      if (ok) remove.mutate(t);
                    }}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <TaskFormDialog
        open={formOpen}
        onOpenChange={close}
        task={editing}
        onSave={(data) => {
          if (editing) update.mutate({ id: editing.id, data });
          else create.mutate(data);
          close(false);
        }}
      />
    </>
  );
}
