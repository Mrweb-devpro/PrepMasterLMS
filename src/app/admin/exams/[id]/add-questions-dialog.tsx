"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { addQuestionsToExam } from "../../actions";

type BankOption = { id: string; name: string };
type Q = { id: string; text: string; options: string[] };

export function AddQuestionsDialog({
  examId,
  existingIds,
  banks,
}: {
  examId: string;
  existingIds: string[];
  banks: BankOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bankId, setBankId] = useState("");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBank(id: string) {
    if (!id) {
      setQuestions([]);
      setSelected(new Set());
      return;
    }
    setBankId(id);
    setSelected(new Set());
    setLoading(true);
    const res = await fetch(`/api/admin/questions?bank=${id}`);
    const data = await res.json();
    const available = (data.questions ?? []).filter(
      (q: Q) => !existingIds.includes(q.id)
    );
    setQuestions(available);
    setLoading(false);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function addAll() {
    if (selected.size === 0) return;
    setBusy(true);
    const res = await addQuestionsToExam(examId, [...selected]);
    setBusy(false);
    if ("error" in res) {
      setError(res.error ?? "Failed to add questions");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button
        onClick={() => {
          setBankId("");
          setQuestions([]);
          setSelected(new Set());
          setError(null);
          setOpen(true);
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add questions
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add questions from a bank</DialogTitle>
            <DialogDescription>
              Pick a question bank, then select questions to include.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Question bank</Label>
            <Select value={bankId} onValueChange={loadBank}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a bank" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : questions.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  {questions.length} available · {selected.size} selected
                </p>
                <div className="max-h-80 space-y-1 overflow-y-auto rounded-lg border p-2">
                  {questions.map((q, i) => (
                    <label
                      key={q.id}
                      className="flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-muted/60"
                    >
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={selected.has(q.id)}
                        onChange={() => toggle(q.id)}
                      />
                      <span className="text-sm font-medium">
                        Q{i + 1}. {q.text}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            ) : bankId ? (
              <p className="text-sm text-muted-foreground">
                No new questions available in this bank.
              </p>
            ) : null}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addAll} disabled={busy || selected.size === 0}>
              {busy ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Add {selected.size > 0 ? `${selected.size} ` : ""}selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
