"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createPastPaper } from "../actions";

const EXAM_TYPES = ["WAEC", "NECO", "JAMB", "GCE", "BECE"];

export function AddPastPaperForm({
  subjects,
}: {
  subjects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subjectId, setSubjectId] = useState("");
  const [examType, setExamType] = useState("WAEC");
  const [year, setYear] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!subjectId || !year) {
      setError("Subject and year are required.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await createPastPaper({
      subject_id: subjectId,
      exam_type: examType,
      year: Number(year),
      file_url: fileUrl || null,
    });
    setLoading(false);
    if ("error" in res) {
      setError(res.error ?? "Failed");
      return;
    }
    setOpen(false);
    setSubjectId("");
    setYear("");
    setFileUrl("");
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add past paper
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add past paper</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Exam type</Label>
                <Select value={examType} onValueChange={setExamType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input
                  placeholder="2023"
                  value={year}
                  onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>File URL (optional)</Label>
              <Input
                placeholder="https://…/2023-waec.pdf"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
