import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { analyzeResults } from "./insights.server";

export const analyzeCbtResults = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        cbtTitle: z.string(),
        questions: z.string(),
        results: z.string().min(1).max(20000),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, error: "AI is not configured." };
    const prompt = `CBT: ${data.cbtTitle}\n\nQuestions:\n${data.questions}\n\nAttempt results (student — score — missed question numbers):\n${data.results}`;
    return analyzeResults(key, prompt);
  });
