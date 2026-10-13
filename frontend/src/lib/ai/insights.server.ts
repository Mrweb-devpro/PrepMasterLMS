import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, streamText } from "ai";

export interface InsightReport {
  summary: string;
  topics: { topic: string; struggling: number; why: string; actions: string[] }[];
  students: { name: string; reason: string }[];
}

export type InsightResult = { ok: true; report: InsightReport } | { ok: false; error: string };

const SYSTEM = `You are an exam analyst for a tutorial platform. Given CBT questions and student attempt results, identify weak topics and recommend targeted follow-up actions for the instructor.
Reply with ONLY JSON of this shape:
{"summary": string, "topics": [{"topic": string, "struggling": number, "why": string, "actions": string[]}], "students": [{"name": string, "reason": string}]}
Rank topics weakest first, max 5 topics, 2-3 short actions each (e.g. share revision notes, create a short practice CBT, run a recap session). List up to 5 students needing most attention. Keep every string under 160 characters.`;

export async function analyzeResults(apiKey: string, prompt: string): Promise<InsightResult> {
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  try {
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: SYSTEM,
      prompt,
      maxRetries: 0,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = await result.text;
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const report = JSON.parse(json) as InsightReport;
    return {
      ok: true,
      report: {
        summary: report.summary ?? "",
        topics: report.topics ?? [],
        students: report.students ?? [],
      },
    };
  } catch (e) {
    const status = APICallError.isInstance(e) ? e.statusCode : undefined;
    if (status === 402)
      return { ok: false, error: "Out of AI credits. Add credits in Settings → Plans & credits." };
    if (status === 429)
      return { ok: false, error: "Too many requests — please try again in a moment." };
    if (status === 403)
      return { ok: false, error: "AI access is blocked for this workspace right now." };
    if (e instanceof SyntaxError)
      return { ok: false, error: "The AI returned an unreadable report. Please try again." };
    return { ok: false, error: "Couldn't analyze results right now. Please try again." };
  }
}
