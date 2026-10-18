import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Pencil } from "lucide-react";
import { useState } from "react";
import { CbtEditDialog } from "@/features/admin/components/CbtEditDialog";
import { toast } from "sonner";
import { AdminShell } from "@/components/prep/AdminShell";
import { EmptyState } from "@/components/prep/bits";
import { KV, Panel, PanelHeader } from "@/features/admin/components/parts";
import { AiInsightsPanel } from "@/features/admin/components/AiInsightsPanel";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "@/lib/admin-store";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import { formatDateTime, formatNaira } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/cbts/$cbtId")({
  head: () => ({
    meta: [
      { title: "CBT details | PrepMaster Admin" },
      { name: "description", content: "Settings and questions for this CBT." },
      { property: "og:title", content: "CBT details | PrepMaster Admin" },
      { property: "og:description", content: "Settings and questions for this CBT." },
    ],
  }),
  component: CbtDetail,
});

const letters = ["A", "B", "C", "D", "E"];

function CbtDetail() {
  const { cbtId } = Route.useParams();
  const admin = useAdmin();
  const [editing, setEditing] = useState(false);
  const detail = useQuery({
    queryKey: ["admin-cbt", cbtId],
    queryFn: () =>
      api.get<{ questions: { id: string; text: string; options: string[]; answer_index: number; topic: string }[] }>(
        `/cbts/admin/${cbtId}`,
      ),
    enabled: LIVE,
  });
  const found = admin.cbts.find((c) => c.id === cbtId);
  const cbt =
    found && LIVE && detail.data
      ? {
          ...found,
          questions: detail.data.questions.map((q) => ({
            id: q.id,
            courseSlug: found.courseSlug,
            text: q.text,
            options: q.options,
            answerIndex: q.answer_index,
            topic: q.topic,
          })),
        }
      : found;
  if (!cbt)
    return (
      <AdminShell title="CBT not found" back={{ to: "/admin/cbts", label: "All CBTs" }}>
        <EmptyState title="This CBT doesn't exist" />
      </AdminShell>
    );
  const course = admin.courses.find((c) => c.slug === cbt.courseSlug);

  return (
    <AdminShell
      title={cbt.title}
      description={`${course?.code ?? ""} · ${cbt.kind === "live" ? "Live exam" : "Practice set"}`}
      back={{ to: "/admin/cbts", label: "All CBTs" }}
      actions={
        <>
          <Button variant="outline" asChild>
            <Link to="/cbts/$cbtId" params={{ cbtId: cbt.id }}>
              <Eye />
              View as student
            </Link>
          </Button>
          <Button onClick={() => setEditing(true)} disabled={LIVE && detail.isLoading}>
            <Pencil />
            Edit CBT
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="lg:col-span-2">
          <AiInsightsPanel cbt={cbt} students={admin.students} />
        </div>
        <Panel>
          <PanelHeader title={`Questions (${cbt.questions.length})`} />
          <ol className="divide-y divide-border">
            {cbt.questions.map((q, i) => (
              <li key={q.id} className="px-5 py-4">
                <p className="text-sm font-medium">
                  {i + 1}. {q.text}
                </p>
                <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                  {q.options.map((o, oi) => (
                    <span
                      key={oi}
                      className={cn(
                        "rounded-sm px-2.5 py-1.5 text-sm",
                        oi === q.answerIndex
                          ? "bg-success-bg font-medium text-success"
                          : "bg-surface-subtle text-text-secondary",
                      )}
                    >
                      {letters[oi]}. {o}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel className="h-fit">
          <PanelHeader title="Settings" />
          <div className="px-5 py-2">
            <KV k="Duration" v={`${cbt.minutes} min`} />
            <KV k="Retakes" v={cbt.retakePolicy} />
            <KV
              k="Price"
              v={
                cbt.paid ? (
                  <span className="text-gold-text">{formatNaira(cbt.price ?? 0)}</span>
                ) : (
                  "Free"
                )
              }
            />
            {cbt.scheduledFor && <KV k="Starts" v={formatDateTime(cbt.scheduledFor)} />}
            <div className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0">
                <span className="block text-text-muted">Open to students</span>
                <span className="block text-2xs text-text-muted">
                  {cbt.paused ? "Shown as “Pending release”" : "Students can start it"}
                </span>
              </span>
              <Switch
                checked={!cbt.paused}
                onCheckedChange={(v) => {
                  admin.togglePause(cbt.id);
                  toast.success(v ? "CBT is open to students" : "CBT set to pending release");
                }}
              />
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-text-muted">Show results</span>
              <Switch
                checked={cbt.revealResults !== false}
                onCheckedChange={(v) => {
                  admin.toggleReveal(cbt.id);
                  toast.success(v ? "Results released" : "Results hidden");
                }}
              />
            </div>
          </div>
        </Panel>
      </div>
      <CbtEditDialog
        cbt={cbt}
        open={editing}
        onOpenChange={setEditing}
        onSave={(patch) => admin.updateCbt(cbt.id, patch)}
      />
    </AdminShell>
  );
}
