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
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Past Papers</h1>
          <p className="mt-1 text-muted-foreground">
            WAEC, JAMB, NECO and other past papers for secondary subjects.
          </p>
        </div>
        <AddPastPaperForm subjects={subjects ?? []} />
      </div>

      {papers && papers.length > 0 ? (
        <div className="overflow-hidden rounded-xl border bg-card">
          {papers.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between border-b p-4 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <FileArchive className="h-5 w-5 text-muted-foreground" />
                <div>
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
