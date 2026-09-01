import { FileArchive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { AddPastPaperForm } from "./add-past-paper";
import { DeletePastPaperButton } from "./delete-past-paper";

export default async function PastPapersPage() {
  const supabase = await createClient();
  const { data: papers } = await supabase
    .from("past_papers")
    .select("id, subject_id, exam_type, year, file_url, extracted")
    .order("year", { ascending: false });
  const { data: subjects } = await supabase
    .from("subjects")
    .select("id, name");

  const subjectName = (id: string) =>
    subjects?.find((s) => s.id === id)?.name ?? "Unknown";

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Past Papers</h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            WAEC, JAMB, NECO and other past papers for secondary subjects.
          </p>
        </div>
        <div className="shrink-0">
          <AddPastPaperForm subjects={subjects ?? []} />
        </div>
      </div>

      {papers && papers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          {papers.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-3 border-b p-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <FileArchive className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-semibold">
                    {subjectName(p.subject_id)} · {p.exam_type} · {p.year}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant={p.extracted ? "default" : "secondary"}>
                      {p.extracted ? "Extracted" : "Not extracted"}
                    </Badge>
                    {p.file_url && (
                      <a
                        href={p.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Open file
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <DeletePastPaperButton id={p.id} />
            </div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-20 text-center">
            <FileArchive className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No past papers yet.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
