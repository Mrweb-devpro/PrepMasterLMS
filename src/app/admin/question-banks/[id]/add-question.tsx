"use client";

import { useState } from "react";
import { Plus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createQuestion, addQuestionToBank } from "../../actions";

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export function AddQuestionForm({ bankId }: { bankId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correct, setCorrect] = useState("A");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [premium, setPremium] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setText("");
    setOptions(["", "", "", ""]);
    setCorrect("A");
    setTopic("");
    setDifficulty("");
    setPremium(false);
    setError(null);
  }

  async function submit() {
    if (text.trim() === "" || options.some((o) => o.trim() === "") || options.length < 2) {
      setError("Question text and at least options A & B are required.");
      return;
    }
    setLoading(true);
    setError(null);
    const q = await createQuestion({
      text: text.trim(),
      options: options.filter((o) => o.trim() !== ""),
      correct_answer: correct,
      explanation: null,
      topic: topic.trim() || null,
      difficulty: difficulty || null,
      is_premium: premium,
    });
    if (q.error) {
      setError(q.error);
      setLoading(false);
      return;
    }
    await addQuestionToBank(bankId, q.questionId!, topic.trim() || null);
    setLoading(false);
    reset();
    setOpen(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add question
      </Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add a question</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question</Label>
              <Textarea
                placeholder="Type the question text..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-5 font-semibold">{OPTION_LETTERS[i]}.</span>
                  <Input
                    value={opt}
                    placeholder={`Option ${OPTION_LETTERS[i]}`}
                    onChange={(e) => {
                      const next = [...options];
                      next[i] = e.target.value;
                      setOptions(next);
                    }}
                  />
                  {i >= 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setOptions(options.filter((_, x) => x !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOptions([...options, ""])}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add option
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Correct answer</Label>
                <Select value={correct} onValueChange={setCorrect}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_LETTERS.slice(0, options.length).map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  placeholder="e.g. Newton's Laws"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={premium} onCheckedChange={setPremium} />
              <Label>Premium (gated content)</Label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
