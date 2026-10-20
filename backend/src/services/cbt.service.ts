import { SUBMIT_GRACE_MS } from "../config/env.js";
import {
  badRequest,
  conflict,
  forbidden,
  must,
  notFound,
} from "../lib/errors.js";
import { db } from "../lib/supabase.js";
import type {
  Attempt,
  Cbt,
  PublicQuestion,
  Question,
} from "../models/types.js";
import { hasAccess } from "./access.service.js";

// The server owns the clock. The browser timer is only a display.

const now = () => Date.now();
const isOpen = (a: Attempt, graceMs = 0) =>
  now() <= new Date(a.deadline).getTime() + graceMs;

async function getCbt(cbtId: string) {
  return must<Cbt>(
    await db.from("cbts").select("*").eq("id", cbtId).maybeSingle(),
    "CBT not found.",
  );
}

async function getOwnAttempt(attemptId: string, userId: string) {
  const a = must<Attempt>(
    await db.from("cbt_attempts").select("*").eq("id", attemptId).maybeSingle(),
    "Attempt not found.",
  );
  if (a.user_id !== userId) throw forbidden();
  return a;
}

async function publicQuestions(cbtId: string): Promise<PublicQuestion[]> {
  return must(
    await db
      .from("cbt_questions")
      .select("id, cbt_id, position, text, options, topic")
      .eq("cbt_id", cbtId)
      .order("position"),
  );
}

/** Starts (or resumes) an attempt. Deadline = start + duration, capped at the CBT close time. */
export async function startAttempt(cbtId: string, userId: string) {
  const cbt = await getCbt(cbtId);
  if (!cbt.published) throw notFound("CBT not found.");
  if (cbt.paused) throw forbidden("This CBT is pending release.");
  if (new Date(cbt.opens_at).getTime() > now())
    throw forbidden("This CBT hasn't opened yet.");
  if (cbt.closes_at && new Date(cbt.closes_at).getTime() <= now())
    throw forbidden("This CBT has closed.");
  if (!(await hasAccess(userId, "cbt", cbt.id, cbt.price_kobo)))
    throw forbidden("Buy this CBT to start it.");

  const { data: open } = await db
    .from("cbt_attempts")
    .select("*")
    .eq("cbt_id", cbtId)
    .eq("user_id", userId)
    .eq("status", "in_progress")
    .maybeSingle();

  let attempt = open as Attempt | null;
  if (attempt && !isOpen(attempt)) {
    await finalize(attempt);
    attempt = null;
  }
  if (!attempt) {
    const limit = cbt.mode === "live" ? 1 : cbt.max_attempts;
    if (limit) {
      const { count } = await db
        .from("cbt_attempts")
        .select("id", { count: "exact", head: true })
        .eq("cbt_id", cbtId)
        .eq("user_id", userId);
      if ((count ?? 0) >= limit) {
        throw conflict(
          cbt.mode === "live"
            ? "Live CBTs can only be taken once."
            : `You've used all ${limit} attempts.`,
        );
      }
    }
    let deadline = now() + cbt.duration_minutes * 60_000;
    if (cbt.closes_at)
      deadline = Math.min(deadline, new Date(cbt.closes_at).getTime());
    attempt = must<Attempt>(
      await db
        .from("cbt_attempts")
        .insert({
          cbt_id: cbtId,
          user_id: userId,
          deadline: new Date(deadline).toISOString(),
        })
        .select()
        .single(),
    );
  }

  const [questions, answers] = await Promise.all([
    publicQuestions(cbtId),
    db
      .from("cbt_answers")
      .select("question_id, selected_index")
      .eq("attempt_id", attempt.id),
  ]);
  return {
    attempt,
    cbt,
    serverNow: new Date().toISOString(),
    questions,
    answers: answers.data ?? [],
  };
}

/** Autosave one answer. Rejected once the deadline (+ grace) has passed. */
export async function saveAnswer(
  attemptId: string,
  userId: string,
  questionId: string,
  selectedIndex: number,
) {
  const attempt = await getOwnAttempt(attemptId, userId);
  if (attempt.status !== "in_progress")
    throw conflict("This attempt is already submitted.");
  const cbt = await getCbt(attempt.cbt_id);
  if (cbt.mode === "live" && cbt.closes_at && new Date(cbt.closes_at).getTime() <= now()) {
    await finalize(attempt);
    throw forbidden("This CBT has closed.");
  }
  if (!isOpen(attempt, SUBMIT_GRACE_MS)) {
    await finalize(attempt);
    throw conflict(
      "Time is up. Your answers up to the deadline were submitted.",
    );
  }

  const q = must<Pick<Question, "cbt_id" | "options">>(
    await db
      .from("cbt_questions")
      .select("cbt_id, options")
      .eq("id", questionId)
      .maybeSingle(),
    "Question not found.",
  );
  if (q.cbt_id !== attempt.cbt_id)
    throw badRequest("Question is not part of this CBT.");
  if (selectedIndex < 0 || selectedIndex >= q.options.length)
    throw badRequest("Invalid option.");

  must(
    await db
      .from("cbt_answers")
      .upsert({
        attempt_id: attemptId,
        question_id: questionId,
        selected_index: selectedIndex,
        saved_at: new Date().toISOString(),
      })
      .select()
      .single(),
  );
  return { saved: true, serverNow: new Date().toISOString() };
}

/** Submit. Late submits are still graded, but only on answers saved before the deadline + grace. */
export async function submitAttempt(attemptId: string, userId: string, flaggedQuestionIds?: string[]) {
  const attempt = await getOwnAttempt(attemptId, userId);
  const { reveal_results } = await getCbt(attempt.cbt_id);
  if (attempt.status !== "in_progress") return result(attempt, reveal_results);
  await db
    .from("cbt_attempts")
    .update({
      submit_attempted_at: new Date().toISOString(),
      ...(flaggedQuestionIds !== undefined ? { flagged_question_ids: flaggedQuestionIds } : {}),
    })
    .eq("id", attemptId);
  return result(await finalize(attempt), reveal_results);
}

/** Grades and locks an attempt. Safe to call more than once. */
async function finalize(attempt: Attempt): Promise<Attempt> {
  const late = !isOpen(attempt, SUBMIT_GRACE_MS);
  const cutoff = new Date(
    new Date(attempt.deadline).getTime() + SUBMIT_GRACE_MS,
  ).toISOString();

  const [questions, answers] = await Promise.all([
    must<Pick<Question, "id" | "answer_index">[]>(
      await db
        .from("cbt_questions")
        .select("id, answer_index")
        .eq("cbt_id", attempt.cbt_id),
    ),
    must<{ question_id: string; selected_index: number }[]>(
      await db
        .from("cbt_answers")
        .select("question_id, selected_index")
        .eq("attempt_id", attempt.id)
        .lte("saved_at", cutoff),
    ),
  ]);
  const key = new Map(questions.map((q) => [q.id, q.answer_index]));
  const score = answers.filter(
    (a) => key.get(a.question_id) === a.selected_index,
  ).length;

  const { data } = await db
    .from("cbt_attempts")
    .update({
      status: late ? "expired" : "submitted",
      submitted_at: late ? attempt.deadline : new Date().toISOString(),
      score,
      total: questions.length,
    })
    .eq("id", attempt.id)
    .eq("status", "in_progress") // only the first finalize wins
    .select()
    .maybeSingle();

  return (
    (data as Attempt | null) ??
    must<Attempt>(
      await db.from("cbt_attempts").select("*").eq("id", attempt.id).single(),
    )
  );
}

function result(a: Attempt, reveal = true) {
  return {
    attemptId: a.id,
    cbtId: a.cbt_id,
    status: a.status,
    revealed: reveal,
    score: reveal ? a.score : null,
    total: a.total,
    startedAt: a.started_at,
    deadline: a.deadline,
    submittedAt: a.submitted_at,
    submitAttemptedAt: a.submit_attempted_at,
    autoSubmitted: a.status === "expired",
  };
}

/** Review screen: answers + correct options, only after the attempt is finished. */
export async function getResult(attemptId: string, userId: string) {
  let attempt = await getOwnAttempt(attemptId, userId);
  const cbt = await getCbt(attempt.cbt_id);
  if (attempt.status === "in_progress") {
    if (isOpen(attempt, SUBMIT_GRACE_MS))
      throw conflict("Finish the CBT to see your result.");
    attempt = await finalize(attempt);
  }
  const [questions, answers] = await Promise.all([
    must<Question[]>(
      await db
        .from("cbt_questions")
        .select("*")
        .eq("cbt_id", attempt.cbt_id)
        .order("position"),
    ),
    must<{ question_id: string; selected_index: number }[]>(
      await db
        .from("cbt_answers")
        .select("question_id, selected_index")
        .eq("attempt_id", attempt.id),
    ),
  ]);
  const picked = new Map(answers.map((a) => [a.question_id, a.selected_index]));
  const reveal = cbt.reveal_results;
  return {
    ...result(attempt, reveal),
    cbtTitle: cbt.title,
    courseId: cbt.course_id,
    // Results held back by the admin: no answers or correct options are sent.
    questions: reveal
      ? questions.map((q) => ({
          ...q,
          selected_index: picked.get(q.id) ?? null,
        }))
      : [],
  };
}

export async function myAttempts(userId: string) {
  const rows = must<(Attempt & { cbts: { reveal_results: boolean } | null })[]>(
    await db
      .from("cbt_attempts")
      .select("*, cbts(title, mode, course_id, reveal_results)")
      .eq("user_id", userId)
      .order("started_at", { ascending: false }),
  );
  const answered = must<{ attempt_id: string }[]>(
    await db
      .from("cbt_answers")
      .select("attempt_id")
      .in(
        "attempt_id",
        rows.filter((r) => r.status === "in_progress").map((r) => r.id),
      ),
  );
  return rows.map((r) => ({
    ...r,
    score: r.cbts?.reveal_results === false ? null : r.score,
    answered: answered.filter((a) => a.attempt_id === r.id).length,
  }));
}

/** Auto-submits attempts abandoned past their deadline. Run on a schedule (e.g. every minute). */
export async function sweepExpired() {
  const cutoff = new Date(now() - SUBMIT_GRACE_MS).toISOString();
  const stale = must<Attempt[]>(
    await db
      .from("cbt_attempts")
      .select("*")
      .eq("status", "in_progress")
      .lt("deadline", cutoff),
  );
  for (const a of stale) await finalize(a);
  return stale.length;
}

// ---------- Admin ----------

export interface NewCbt {
  courseId: string;
  title: string;
  mode: "practice" | "live";
  durationMinutes: number;
  opensAt?: string | undefined;
  closesAt?: string | undefined;
  priceKobo: number;
  maxAttempts: number | null;
  revealResults: boolean;
  published: boolean;
  questions: {
    text: string;
    options: string[];
    answerIndex: number;
    topic?: string | undefined;
  }[];
}

export async function createCbt(input: NewCbt) {
  if (input.mode === "live") {
    if (!input.closesAt) throw badRequest("Live CBTs need a closing time.");
    const opensAt = new Date(input.opensAt ?? new Date().toISOString()).getTime();
    if (new Date(input.closesAt).getTime() <= opensAt) {
      throw badRequest("Closing time must be after the opening time.");
    }
  }
  for (const q of input.questions) {
    if (q.answerIndex >= q.options.length)
      throw badRequest(
        `Correct answer is missing for "${q.text.slice(0, 40)}".`,
      );
  }
  const cbt = must<Cbt>(
    await db
      .from("cbts")
      .insert({
        course_id: input.courseId,
        title: input.title,
        mode: input.mode,
        duration_minutes: input.durationMinutes,
        opens_at: input.opensAt ?? new Date().toISOString(),
        closes_at: input.closesAt ?? null,
        price_kobo: input.priceKobo,
        max_attempts: input.maxAttempts,
        reveal_results: input.revealResults,
        published: input.published,
      })
      .select()
      .single(),
  );
  const rows = input.questions.map((q, i) => ({
    cbt_id: cbt.id,
    position: i + 1,
    text: q.text,
    options: q.options,
    answer_index: q.answerIndex,
    topic: q.topic ?? "",
  }));
  const { error } = await db.from("cbt_questions").insert(rows);
  if (error) {
    await db.from("cbts").delete().eq("id", cbt.id);
    throw badRequest(error.message);
  }
  return cbt;
}

export async function adminGetCbt(cbtId: string) {
  const [cbt, questions, attempts] = await Promise.all([
    getCbt(cbtId),
    must(
      await db
        .from("cbt_questions")
        .select("*")
        .eq("cbt_id", cbtId)
        .order("position"),
    ),
    must(
      await db
        .from("cbt_attempts")
        .select("*, profiles(id, first_name, last_name, email)")
        .eq("cbt_id", cbtId)
        .order("started_at", { ascending: false }),
    ),
  ]);
  return { cbt, questions, attempts };
}

export interface CbtPatch {
  published?: boolean | undefined;
  revealResults?: boolean | undefined;
  paused?: boolean | undefined;
  title?: string | undefined;
  durationMinutes?: number | undefined;
  opensAt?: string | undefined;
  closesAt?: string | null | undefined;
  priceKobo?: number | undefined;
  maxAttempts?: number | null | undefined;
  questions?:
    | {
        id?: string | undefined;
        text: string;
        options: string[];
        answerIndex: number;
        topic?: string | undefined;
      }[]
    | undefined;
}

/** Edits settings and (optionally) replaces the question list. Works whether the CBT is live or not. */
export async function updateCbt(cbtId: string, patch: CbtPatch) {
  const existing = await getCbt(cbtId);
  if (existing.mode === "live") {
    const closesAt = patch.closesAt !== undefined ? patch.closesAt : existing.closes_at;
    const opensAt = patch.opensAt ?? existing.opens_at;
    if (!closesAt) throw badRequest("Live CBTs need a closing time.");
    if (new Date(closesAt).getTime() <= new Date(opensAt).getTime()) {
      throw badRequest("Closing time must be after the opening time.");
    }
  }
  const map: [keyof CbtPatch, string][] = [
    ["published", "published"],
    ["revealResults", "reveal_results"],
    ["paused", "paused"],
    ["title", "title"],
    ["durationMinutes", "duration_minutes"],
    ["opensAt", "opens_at"],
    ["closesAt", "closes_at"],
    ["priceKobo", "price_kobo"],
    ["maxAttempts", "max_attempts"],
  ];
  const row: Record<string, unknown> = {};
  for (const [k, col] of map) if (patch[k] !== undefined) row[col] = patch[k];
  const cbt = Object.keys(row).length
    ? must(
        await db
          .from("cbts")
          .update(row)
          .eq("id", cbtId)
          .select()
          .maybeSingle(),
        "CBT not found.",
      )
    : existing;

  if (patch.questions) {
    for (const q of patch.questions) {
      if (q.answerIndex >= q.options.length)
        throw badRequest(
          `Correct answer is missing for "${q.text.slice(0, 40)}".`,
        );
    }
    const existing = must<{ id: string }[]>(
      await db.from("cbt_questions").select("id").eq("cbt_id", cbtId),
    );
    const keep = new Set(
      patch.questions.map((q) => q.id).filter(Boolean) as string[],
    );
    const removed = existing.map((e) => e.id).filter((id) => !keep.has(id));
    if (removed.length)
      must(
        await db.from("cbt_questions").delete().in("id", removed).select("id"),
      );
    // Park kept rows on negative positions first so the unique (cbt_id, position) never collides.
    const kept = existing.filter((e) => keep.has(e.id));
    for (const [i, e] of kept.entries())
      must(
        await db
          .from("cbt_questions")
          .update({ position: -(i + 1) })
          .eq("id", e.id)
          .select("id"),
      );
    for (const [i, q] of patch.questions.entries()) {
      const data = {
        position: i + 1,
        text: q.text,
        options: q.options,
        answer_index: q.answerIndex,
        topic: q.topic ?? "",
      };
      if (q.id && keep.has(q.id) && existing.some((e) => e.id === q.id)) {
        must(
          await db
            .from("cbt_questions")
            .update(data)
            .eq("id", q.id)
            .select("id"),
        );
      } else {
        must(
          await db
            .from("cbt_questions")
            .insert({ ...data, cbt_id: cbtId })
            .select("id"),
        );
      }
    }
  }
  return cbt;
}

export async function deleteCbt(cbtId: string) {
  must(await db.from("cbts").delete().eq("id", cbtId).select("id"));
  return { deleted: true };
}
