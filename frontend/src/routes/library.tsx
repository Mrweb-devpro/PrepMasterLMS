import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, MonitorCheck } from "lucide-react";
import { useState } from "react";
import { FileViewerDialog, type ViewableFile } from "@/features/files/components/FileViewer";
import { loadViewable } from "@/features/drive/utils/files";
import { toast } from "sonner";
import { useCatalog } from "@/features/catalog/useCatalog";

import { StudentShell } from "@/components/prep/StudentShell";
import { EmptyState, FileIcon, PageHeader, SectionTitle } from "@/components/prep/bits";
import { usePrep } from "@/lib/prep-store";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Library — PrepMaster" },
      { name: "description", content: "Every file and CBT you've unlocked, in one place." },
      { property: "og:title", content: "My Library — PrepMaster" },
      { property: "og:description", content: "Every file and CBT you've unlocked, in one place." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const prep = usePrep();
  const { getCbt, getCourse, getFile, loading } = useCatalog();
  const [viewing, setViewing] = useState<ViewableFile | null>(null);
  const ownedFiles = prep.ownedFileIds.map(getFile).filter((f) => !!f);
  const ownedCbts = prep.ownedCbtIds.map(getCbt).filter((c) => !!c);

  return (
    <StudentShell>
      <PageHeader title="My Library" subtitle="Everything you've unlocked stays here forever." />

      {loading ? (
        <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-text-muted">
          <Loader2 className="size-4 animate-spin" /> Loading your library…
        </div>
      ) : (
        <>
          <section className="mb-10">
            <SectionTitle
              aside={<span className="text-sm text-text-muted">{ownedCbts.length} items</span>}
            >
              CBTs
            </SectionTitle>
            {ownedCbts.length === 0 ? (
              <EmptyState
                title="No CBTs yet"
                description="Unlock a paid CBT and it will appear here."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {ownedCbts.map((cbt) => (
                  <Link
                    key={cbt.id}
                    to="/cbts/$cbtId"
                    params={{ cbtId: cbt.id }}
                    className="card-hover flex items-center gap-4 rounded-lg border border-border bg-surface p-5 shadow-sm"
                  >
                    <span className="flex size-11 items-center justify-center rounded-md bg-ink text-ink-foreground">
                      <MonitorCheck className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-text-muted">
                        {getCourse(cbt.courseSlug)?.code}
                      </span>
                      <span className="block truncate font-semibold">{cbt.title}</span>
                    </span>
                    <ArrowRight className="size-4 text-text-muted" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionTitle
              aside={<span className="text-sm text-text-muted">{ownedFiles.length} items</span>}
            >
              Files
            </SectionTitle>
            {ownedFiles.length === 0 ? (
              <EmptyState
                title="No files yet"
                description="Paid files you unlock in Drive show up here."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ownedFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => loadViewable(file).then(setViewing, (e: Error) => toast.error(e.message))}
                    className="card-hover flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 text-left shadow-sm"
                  >
                    <span className="flex size-10 items-center justify-center rounded-md bg-secondary">
                      <FileIcon type={file.type} />
                    </span>
                    <span className="line-clamp-2 text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-text-muted">
                      {getCourse(file.courseSlug)?.code} · {file.size}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
          <FileViewerDialog file={viewing} onClose={() => setViewing(null)} />
        </>
      )}
    </StudentShell>
  );
}
