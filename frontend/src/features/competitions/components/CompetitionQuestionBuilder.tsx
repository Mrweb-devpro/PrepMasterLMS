import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CompetitionQuestionDraft } from "../services/competitions.api";

const letters = ["A", "B", "C", "D"];
const blankQuestion = (): CompetitionQuestionDraft => ({ text: "", options: ["", "", "", ""], answerIndex: 0, explanation: "" });

export function newCompetitionQuestion() {
  return blankQuestion();
}

/** Inline four-option authoring controls for competition-only questions. */
export function CompetitionQuestionBuilder({ questions, onChange }: { questions: CompetitionQuestionDraft[]; onChange: (questions: CompetitionQuestionDraft[]) => void }) {
  const patchQuestion = (index: number, patch: Partial<CompetitionQuestionDraft>) => onChange(questions.map((question, current) => current === index ? { ...question, ...patch } : question));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  };

  return <div className="space-y-4">
    {questions.map((question, index) => <section key={`question-${index}`} className="rounded-lg border border-border bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-display text-base font-semibold">Question {index + 1}</h3><div className="flex items-center gap-1"><Button type="button" size="icon" variant="ghost" className="size-8" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move question up"><ArrowUp className="size-4" /></Button><Button type="button" size="icon" variant="ghost" className="size-8" disabled={index === questions.length - 1} onClick={() => move(index, 1)} aria-label="Move question down"><ArrowDown className="size-4" /></Button><Button type="button" size="icon" variant="ghost" className="size-8 text-error hover:text-error" disabled={questions.length === 1} onClick={() => onChange(questions.filter((_, current) => current !== index))} aria-label="Delete question"><Trash2 className="size-4" /></Button></div></div>
      <div className="mt-4"><Label>Question prompt</Label><Textarea rows={3} className="mt-1.5" value={question.text} onChange={(event) => patchQuestion(index, { text: event.target.value })} placeholder="Write the question students should answer" /></div>
      <div className="mt-4"><Label>Answer choices</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{question.options.map((option, optionIndex) => <div key={letters[optionIndex]} className="flex min-w-0 items-center gap-2"><button type="button" aria-label={`Mark option ${letters[optionIndex]} as correct`} onClick={() => patchQuestion(index, { answerIndex: optionIndex })} className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors", question.answerIndex === optionIndex ? "border-success bg-success-bg text-success" : "border-border text-text-muted hover:border-primary")}>{letters[optionIndex]}</button><Input value={option} onChange={(event) => patchQuestion(index, { options: question.options.map((value, current) => current === optionIndex ? event.target.value : value) })} placeholder={`Option ${letters[optionIndex]}`} /></div>)}</div><p className="mt-2 text-xs text-text-muted">Tap a letter to mark the correct answer.</p></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label>Topic (optional)</Label><Input className="mt-1.5" value={question.topic ?? ""} onChange={(event) => patchQuestion(index, { topic: event.target.value })} placeholder="e.g. Differentiation" /></div><div><Label>Explanation (optional)</Label><Textarea rows={2} className="mt-1.5" value={question.explanation ?? ""} onChange={(event) => patchQuestion(index, { explanation: event.target.value })} placeholder="Explain the correct answer for practice release" /></div></div>
    </section>)}
    <Button type="button" variant="outline" className="w-full" onClick={() => onChange([...questions, blankQuestion()])}><Plus className="size-4" />Add question</Button>
  </div>;
}
