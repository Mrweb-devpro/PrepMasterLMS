"use server";

export type GeneratedQuestion = {
  text: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  topic?: string;
  difficulty?: string;
};

const API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

const CANDIDATE_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-1.5-flash",
  "gemini-1.5-flash-001",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-1.0-pro",
  "gemini-pro",
];

async function callGemini(system: string, user: string): Promise<string> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${system}\n\n${user}` }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };

  let lastError = "";
  async function tryModel(model: string, ver: string): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/${ver}/models/${model}:generateContent?key=${API_KEY}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        lastError = data?.error?.message ?? `HTTP ${res.status} for ${model} (${ver})`;
        if (res.status === 404 || lastError.toLowerCase().includes("not found")) return null;
        throw new Error(lastError);
      }
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = data?.error?.message ?? "Gemini returned no content";
        return null;
      }
      return text;
    } catch (e: unknown) {
      lastError = e instanceof Error ? e.message : String(e);
      return null;
    }
  }

  for (const model of CANDIDATE_MODELS) {
    for (const ver of ["v1", "v1beta"]) {
      const out = await tryModel(model, ver);
      if (out) return out;
    }
  }

  // Fallback: discover via ListModels and try whatever the key actually supports
  for (const ver of ["v1", "v1beta"]) {
    try {
      const listRes = await fetch(
        `https://generativelanguage.googleapis.com/${ver}/models?key=${API_KEY}`
      );
      const listData = await listRes.json();
      const models: { name: string; supportedGenerationMethods?: string[] }[] = listData?.models ?? [];
      const candidates = models
        .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
        .map((m) => m.name.replace("models/", ""))
        .filter((n) => !CANDIDATE_MODELS.includes(n));
      for (const model of candidates.slice(0, 5)) {
        const out = await tryModel(model, ver);
        if (out) return out;
      }
    } catch {}
  }

  throw new Error(
    lastError ||
      "Gemini: no candidate model succeeded. Call https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_KEY to see available models for your key / API version."
  );
}

function extractJson(text: string): GeneratedQuestion[] {
  // Strip markdown fences like ```json ... ``` and ``` ... ```
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) t = fence[1].trim();

  // Try direct parse (handles pure JSON array or object with questions key)
  try {
    const direct = JSON.parse(t);
    if (Array.isArray(direct)) return direct;
    if (direct && Array.isArray((direct as { questions?: unknown }).questions)) {
      return (direct as { questions: GeneratedQuestion[] }).questions;
    }
    if (direct && typeof direct === "object" && "text" in direct) {
      return [direct as unknown as GeneratedQuestion];
    }
  } catch {}

  // Find the outermost JSON array by bracket balancing (handles extra prose before/after)
  const start = t.indexOf("[");
  const end = t.lastIndexOf("]");
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = t.slice(start, end + 1);
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    // Try to fix trailing commas / single quotes as fallback
    try {
      const fixed = candidate
        .replace(/,\s*]/g, "]")
        .replace(/,\s*}/g, "}")
        .replace(/'/g, '"');
      const parsed2 = JSON.parse(fixed);
      if (Array.isArray(parsed2)) return parsed2;
    } catch {}
  }

  // Last resort: look for JSON object wrapper { "questions": [...] }
  const objMatch = t.match(/"questions"\s*:\s*(\[[\s\S]*?\])/);
  if (objMatch) {
    try {
      const arr = JSON.parse(objMatch[1]);
      if (Array.isArray(arr)) return arr;
    } catch {}
  }

  throw new Error(
    `No JSON array found. Model returned:\n${text.slice(0, 800)}${text.length > 800 ? "…" : ""}`
  );
}

export async function generateQuestionsFromText(
  source: string,
  opts: { count: number; mode: "notes" | "past_paper"; examType: string }
): Promise<{ questions: GeneratedQuestion[] } | { error: string }> {
  const system = `You are a Nigerian exam question writer following UNILAG/JAMB/Moodle style. ` +
    `Generate exactly ${opts.count} multiple-choice questions as a JSON array. ` +
    `Each object must have: "text" (the question), "options" (array of 4 strings), ` +
    `"correct_answer" (the LETTER A-D of the correct option), "explanation" (a short explanation), ` +
    `"topic" (short topic name), "difficulty" ("easy", "medium", or "hard"). ` +
    `Output ONLY the JSON array, no markdown, no prose.`;

  const user =
    opts.mode === "past_paper"
      ? `Convert this past-paper content into practice questions for a ${opts.examType} exam:\n\n${source}`
      : `Generate study-based questions from these lecture notes for a ${opts.examType} exam:\n\n${source}`;

  try {
    const raw = await callGemini(system, user);
    const parsed = extractJson(raw) as GeneratedQuestion[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { error: "No questions generated." };
    }
    const norm = parsed.slice(0, opts.count).map((q) => ({
      ...q,
      options: (q.options ?? []).slice(0, 4),
      correct_answer: String(q.correct_answer ?? "A").toUpperCase(),
    }));
    return { questions: norm };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "AI generation failed." };
  }
}
