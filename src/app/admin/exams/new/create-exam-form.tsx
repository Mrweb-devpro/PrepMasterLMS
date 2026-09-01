"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Sparkles,
  Check,
  FileQuestion,
  ClipboardPaste,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createExam, createQuestion, addQuestionsToExam } from "../../actions";
import { generateQuestionsFromText, type GeneratedQuestion } from "../../ai";

type Track = { id: string; name: string };
type Subject = { id: string; name: string };
type Course = { id: string; code: string; name: string; track_id: string | null };
type Bank = { id: string; name: string; subject_id: string | null; course_id: string | null };

type BankQuestion = {
  id: string;
  text: string;
  options: string[];
  correct_answer: string;
  topic: string | null;
  is_premium: boolean;
};

const EXAM_TYPES = [
  { value: "cbt", label: "CBT (Computer Based Test)" },
  { value: "mock_exam", label: "Mock Exam" },
  { value: "past_paper", label: "Past Paper" },
  { value: "quiz", label: "Quiz" },
];

const TAGS = [
  { value: "cbt", label: "CBT" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
  { value: "test", label: "Test" },
  { value: "mock_exam", label: "Mock Exam" },
];

export function CreateExamForm({
  tracks,
  subjects,
  courses,
  banks,
}: {
  tracks: Track[];
  subjects: Subject[];
  courses: Course[];
  banks: Bank[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [type, setType] = useState("cbt");
  const [tag, setTag] = useState("cbt");
  const [trackId, setTrackId] = useState("");
  const [scope, setScope] = useState<"subject" | "course">("subject");
  const [subjectId, setSubjectId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [duration, setDuration] = useState(30);
  const [year, setYear] = useState("");
  const [review, setReview] = useState(true);
  const [retry, setRetry] = useState(true);
  const [explanations, setExplanations] = useState(true);
  const [free, setFree] = useState(true);
  const [premium, setPremium] = useState(false);
  const [price, setPrice] = useState(0);
  const [status, setStatus] = useState("draft");

  const [source, setSource] = useState<"bank" | "ai" | "paste">("bank");

  const [bankId, setBankId] = useState("");
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [aiCount, setAiCount] = useState(10);
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [genText, setGenText] = useState("");
  const [genError, setGenError] = useState<string | null>(null);
  const [genBusy, setGenBusy] = useState(false);

  const [pasteText, setPasteText] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const trackCourses = useMemo(
    () => (trackId ? courses.filter((c) => c.track_id === trackId) : courses),
    [trackId, courses]
  );
  const filterBanks = useMemo(() => {
    if (scope === "subject" && subjectId)
      return banks.filter((b) => b.subject_id === subjectId);
    if (scope === "course" && courseId)
      return banks.filter((b) => b.course_id === courseId);
    return banks;
  }, [banks, scope, subjectId, courseId]);

  async function loadBank(id: string) {
    setBankId(id);
    setSelected(new Set());
    if (!id) {
      setBankQuestions([]);
      return;
    }
    const res = await fetch(`/api/admin/questions?bank=${id}`);
    const data = await res.json();
    setBankQuestions(data.questions ?? []);
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (!genText.trim()) {
      setGenError("Paste some notes or past-paper content first.");
      return;
    }
    setGenBusy(true);
    setGenError(null);
    const res = await generateQuestionsFromText(genText, {
      count: aiCount,
      mode: source === "ai" ? "notes" : "past_paper",
      examType: `${scope} ${type}`,
    });
    setGenBusy(false);
    if ("error" in res) {
      setGenError(res.error);
      return;
    }
    setGenerated(res.questions);
  }

  function parsePasted(): { ok: boolean; error?: string } {
    const lines = pasteText.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: GeneratedQuestion[] = [];
    let block: string[] = [];
    const flush = () => {
      if (block.length < 3) return;
      const question = block[0];
      const opts = block.slice(1, 5).filter((o) => o);
      const corrLine = block[5] ?? "";
      const m = corrLine.match(/([A-E])/i);
      if (!question || opts.length < 2) return;
      parsed.push({
        text: question,
        options: opts.map((o) => o.replace(/^[A-E][.)\s:-]*/i, "").trim()),
        correct_answer: m ? m[1].toUpperCase() : "A",
        explanation: "",
      });
    };
    for (const line of lines) {
      if (/^\d+[.).]/.test(line) && block.length) {
        flush();
        block = [];
      }
      block.push(line);
    }
    flush();
    if (parsed.length === 0) {
      return {
        ok: false,
        error:
          "Could not parse. Format each question as:\n1. Question text\nA. opt\nB. opt\nC. opt\nD. opt\nCorrect: B",
      };
    }
    setGenerated(parsed);
    return { ok: true };
  }

  async function handleCreate() {
    if (!title.trim()) {
      setSaveError("Title is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    const exam = await createExam({
      title,
      type,
      tag,
      subject_id: scope === "subject" ? subjectId || null : null,
      course_id: scope === "course" ? courseId || null : null,
      duration_minutes: duration,
      review_enabled: review,
      re_attempts_enabled: retry,
      show_explanations: explanations,
      free,
      is_premium: premium,
      price: free || premium ? null : price,
      year: year ? Number(year) : null,
      status: status as never,
    });
    if ("error" in exam) {
      setSaveError(exam.error ?? "Failed to create exam");
      setSaving(false);
      return;
    }
    const examId = exam.examId!;

    let qids: string[] = [];

    if (source === "bank") {
      qids = [...selected];
    } else {
      for (const g of generated) {
        const q = await createQuestion({
          text: g.text,
          options: g.options,
          correct_answer: g.correct_answer,
          explanation: g.explanation ?? null,
          topic: g.topic ?? null,
          difficulty: g.difficulty ?? null,
          is_premium: premium,
        });
        if (q.questionId) qids.push(q.questionId);
      }
    }

    if (qids.length) await addQuestionsToExam(examId, qids);

    router.push(`/admin/exams/${examId}`);
    router.refresh();
  }

  function renderSettings() {
    return (
      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            placeholder="e.g. Physics CBT - Motion & Forces"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Exam type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Tag</Label>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAGS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-2">
          <Label>Year (past papers)</Label>
          <Input
            placeholder="e.g. 2023"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  function renderScope() {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Track</Label>
          <Select value={trackId} onValueChange={setTrackId}>
            <SelectTrigger>
              <SelectValue placeholder="All tracks" />
            </SelectTrigger>
            <SelectContent>
              {tracks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={scope === "subject" ? "default" : "outline"}
            onClick={() => setScope("subject")}
          >
            Subject
          </Button>
          <Button
            type="button"
            variant={scope === "course" ? "default" : "outline"}
            onClick={() => setScope("course")}
          >
            Course
          </Button>
        </div>
        {scope === "subject" ? (
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
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
        ) : (
          <div className="space-y-2">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={setCourseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {trackCourses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.code} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  }

  function renderBank() {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Question bank</Label>
          <Select value={bankId} onValueChange={loadBank}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a bank" />
            </SelectTrigger>
            <SelectContent>
              {filterBanks.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {bankQuestions.length > 0 && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>{bankQuestions.length} questions available</Label>
              <span className="text-sm text-muted-foreground">
                {selected.size} selected
              </span>
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border p-3">
              {bankQuestions.map((q, i) => (
                <label
                  key={q.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/60"
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={selected.has(q.id)}
                    onChange={() => toggleSelected(q.id)}
                  />
                  <div>
                    <p className="text-sm font-medium">
                      Q{i + 1}. {q.text}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {typeof q.options === "string" ? q.options : (q.options ?? []).join(" · ")}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderAI() {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{source === "ai" ? "Lecture notes" : "Past-paper content"}</Label>
          <Textarea
            rows={6}
            placeholder={
              source === "ai"
                ? "Paste lecture notes here to generate questions..."
                : "Paste past-paper questions/content here to regenerate questions..."
            }
            value={genText}
            onChange={(e) => setGenText(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-2">
            <Label>Questions</Label>
            <Input
              type="number"
              min={1}
              max={40}
              className="w-24"
              value={aiCount}
              onChange={(e) => setAiCount(Math.min(40, Number(e.target.value) || 1))}
            />
          </div>
          <Button onClick={handleGenerate} disabled={genBusy}>
            {genBusy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generate with AI
          </Button>
        </div>
        {genError && <p className="text-sm text-destructive">{genError}</p>}
        {generated.length > 0 && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">
              {generated.length} questions generated
            </p>
            {generated.slice(0, 4).map((g, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium">Q{i + 1}.</span> {g.text}{" "}
                <span className="text-muted-foreground">
                  (Answer: {g.correct_answer})
                </span>
              </div>
            ))}
            {generated.length > 4 && (
              <p className="text-xs text-muted-foreground">
                +{generated.length - 4} more…
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderPaste() {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Paste questions (format)</Label>
          <Textarea
            rows={8}
            placeholder={
              "1. What is the SI unit of force?\nA. Joule\nB. Newton\nC. Pascal\nD. Watt\nCorrect: B"
            }
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
        </div>
        <Button type="button" onClick={parsePasted}>
          {generated.length > 0 ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <ClipboardPaste className="mr-2 h-4 w-4" />
          )}
          {generated.length > 0
            ? `${generated.length} parsed`
            : "Parse questions"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/exams"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exams
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create exam</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the details, then choose how to build the question set.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Exam details</Label>
        {renderSettings()}
      </div>

      <div className="space-y-2">
        <Label>Scope</Label>
        {renderScope()}
      </div>

      <div className="grid grid-cols-2 gap-4 max-lg:grid-cols-1">
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="space-y-1">
            <Label>Review answers</Label>
            <p className="text-xs text-muted-foreground">
              Show result review after submit
            </p>
          </div>
          <Switch checked={review} onCheckedChange={setReview} />
        </div>
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="space-y-1">
            <Label>Allow re-attempts</Label>
            <p className="text-xs text-muted-foreground">
              Let students retake in practice mode
            </p>
          </div>
          <Switch checked={retry} onCheckedChange={setRetry} />
        </div>
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="space-y-1">
            <Label>Show explanations</Label>
            <p className="text-xs text-muted-foreground">
              Display explanations in review
            </p>
          </div>
          <Switch checked={explanations} onCheckedChange={setExplanations} />
        </div>
        <div className="flex items-center justify-between rounded-xl border p-4">
          <div className="space-y-1">
            <Label>Free access</Label>
            <p className="text-xs text-muted-foreground">
              Appears in free-practice listings
            </p>
          </div>
          <Switch checked={free} onCheckedChange={setFree} />
        </div>
        {!free && (
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div className="space-y-1">
              <Label>Premium / paid</Label>
              <p className="text-xs text-muted-foreground">
                Gate behind premium subscription
              </p>
            </div>
            <Switch checked={premium} onCheckedChange={setPremium} />
          </div>
        )}
        {!free && !premium && (
          <div className="flex items-center justify-between rounded-xl border p-4">
            <Label>Price (NGN)</Label>
            <Input
              type="number"
              min={0}
              className="w-28"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
            />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Label>Add questions from</Label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { v: "bank", label: "Question bank", icon: FileQuestion },
              { v: "ai", label: "AI from notes", icon: Sparkles },
              { v: "ai_past", label: "AI from past papers", icon: Sparkles },
              { v: "paste", label: "Paste manually", icon: ClipboardPaste },
            ] as const
          ).map((t) => (
            <Button
              key={t.v}
              type="button"
              variant={source === t.v || (source === "ai" && t.v === "ai_past") ? "default" : "outline"}
              onClick={() => {
                if (t.v === "ai_past") setSource("ai");
                else setSource(t.v as "bank" | "ai" | "paste");
              }}
            >
              <t.icon className="mr-2 h-4 w-4" />
              {t.label}
            </Button>
          ))}
        </div>
        {source === "bank" && renderBank()}
        {source === "ai" && renderAI()}
        {source === "paste" && renderPaste()}
      </div>

      {saveError && <p className="text-sm text-destructive">{saveError}</p>}

      <div className="flex justify-end gap-3 pb-10">
        <Button variant="outline" asChild>
          <Link href="/admin/exams">Cancel</Link>
        </Button>
        <Button onClick={handleCreate} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create exam
        </Button>
      </div>
    </div>
  );
}
