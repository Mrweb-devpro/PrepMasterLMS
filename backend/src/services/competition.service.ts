import { badRequest, conflict, forbidden, must, notFound } from "../lib/errors.js";
import type { z } from "zod";
import type { updateCompetitionSchema } from "../validators/competition.validator.js";
import { db } from "../lib/supabase.js";
import { createCbt, updateCbt } from "./cbt.service.js";

const COMPETITION_RELEASE_BUFFER_MS = 90 * 60_000;
const releaseAtFor = (startsAt: string, durationMinutes: number) =>
  new Date(new Date(startsAt).getTime() + durationMinutes * 60_000 + COMPETITION_RELEASE_BUFFER_MS).toISOString();

type CompetitionQuestion = { text: string; options: string[]; answerIndex: number; topic?: string; explanation?: string };
type CompetitionSettingsRow = {
  id: string;
  title: string;
  course_id: string | null;
  cbt_id: string | null;
  starts_at: string;
  duration_minutes: number;
  ends_at: string | null;
  status: "scheduled" | "live" | "completed" | "cancelled";
};

async function createCustomPracticeSet(input: {
  competitionId: string;
  courseId: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  questions: CompetitionQuestion[];
}) {
  return createCbt({
    courseId: input.courseId,
    title: `🏆 Practice: ${input.title}`,
    mode: "practice",
    durationMinutes: Math.max(1, input.durationMinutes),
    priceKobo: 0,
    maxAttempts: null,
    revealResults: true,
    published: false,
    competitionId: input.competitionId,
    releasesAt: releaseAtFor(input.startsAt, input.durationMinutes),
    questions: input.questions,
  });
}

async function assertEligible(id: string, userId: string) {
  const contest = must<{ level: string }>(await db.from("competitions").select("level").eq("id", id).single());
  const profile = must<{ level: string | null }>(await db.from("profiles").select("level").eq("id", userId).single());
  if (contest.level !== "all" && contest.level !== profile.level) throw forbidden("This competition is for a different study level.");
}

async function assertQuestionBankReady(cbtId: string | null | undefined) {
  if (!cbtId) throw badRequest("Choose a CBT question bank before scheduling this competition.");
  const { data: cbt, error: cbtError } = await db.from("cbts").select("id").eq("id", cbtId).maybeSingle();
  if (cbtError) throw new Error(cbtError.message);
  if (!cbt) throw badRequest("The selected CBT question bank was not found.");
  const { count, error } = await db.from("cbt_questions").select("id", { count: "exact", head: true }).eq("cbt_id", cbtId);
  if (error) throw new Error(error.message);
  if (!count) throw badRequest("The selected CBT needs at least one question before it can power a competition.");
}

export async function updateCompetition(id: string, patch: z.infer<typeof updateCompetitionSchema>) {
  const existing = must<CompetitionSettingsRow>(await db.from("competitions").select("*").eq("id", id).single());
  const updates: Record<string, unknown> = {};
  const mapping = { title: "title", description: "description", courseId: "course_id", cbtId: "cbt_id", startsAt: "starts_at", durationMinutes: "duration_minutes", level: "level", prizePoolNaira: "prize_pool_naira", prizeDescription: "prize_description", questionLimit: "question_limit" } as const;
  for (const key of Object.keys(mapping) as (keyof typeof mapping)[]) if (patch[key] !== undefined) updates[mapping[key]] = patch[key];
  const now = Date.now();
  const startsAt = patch.startsAt ?? existing.starts_at;
  const durationMinutes = patch.durationMinutes ?? existing.duration_minutes;
  // A normal settings save never restarts the clock. Live edits use an explicit closing time.
  const scheduleChanged = patch.startsAt !== undefined || patch.durationMinutes !== undefined;
  const endsAt = patch.endsAt ?? (scheduleChanged
    ? new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString()
    : existing.ends_at ?? new Date(new Date(startsAt).getTime() + durationMinutes * 60_000).toISOString());
  if (new Date(endsAt).getTime() <= new Date(startsAt).getTime()) throw badRequest("Closing time must be after the start time.");
  if (patch.endsAt !== undefined || scheduleChanged) updates.ends_at = endsAt;
  const courseId = patch.courseId !== undefined ? patch.courseId : existing.course_id;
  const changesQuestionBank =
    patch.questionSource !== undefined ||
    patch.customQuestions !== undefined ||
    patch.questionLimit !== undefined ||
    (patch.cbtId !== undefined && patch.cbtId !== existing.cbt_id);

  if (changesQuestionBank) {
    const { count, error } = await db
      .from("competition_entries")
      .select("id", { count: "exact", head: true })
      .eq("competition_id", id)
      .not("started_at", "is", null);
    if (error) throw new Error(error.message);
    if (count) {
      throw conflict("The question bank cannot be changed after students have started this competition.");
    }
  }

  if (patch.questionSource === "bank" && patch.cbtId) {
    await assertQuestionBankReady(patch.cbtId);
    if (existing.cbt_id !== patch.cbtId) {
      const previous = await db.from("cbts").select("id, competition_id").eq("id", existing.cbt_id ?? "").maybeSingle();
      if (previous.error) throw new Error(previous.error.message);
      if (previous.data?.competition_id === id) {
        await db.from("cbts").update({ competition_id: null, releases_at: null, published: false, paused: true }).eq("id", previous.data.id);
      }
    }
  }
  if (patch.questionSource === "custom" || patch.customQuestions !== undefined) {
    const questions = patch.customQuestions;
    if (!questions?.length) throw badRequest("Add at least one custom question.");
    if (!courseId) throw badRequest("Choose a course before creating custom competition questions.");
    const linked = existing.cbt_id
      ? await db.from("cbts").select("id, competition_id").eq("id", existing.cbt_id).maybeSingle()
      : { data: null, error: null };
    if (linked.error) throw new Error(linked.error.message);
    if (linked.data?.competition_id === id) {
      await updateCbt(linked.data.id, {
        title: `🏆 Practice: ${patch.title ?? existing.title}`,
        durationMinutes,
        questions,
      });
      updates.cbt_id = linked.data.id;
    } else {
      const cbt = await createCustomPracticeSet({ competitionId: id, courseId, title: patch.title ?? existing.title, startsAt, durationMinutes, questions });
      updates.cbt_id = cbt.id;
    }
    updates.question_limit = null;
  }
  if (existing.status !== "cancelled") updates.status = now >= new Date(endsAt).getTime() ? "completed" : now >= new Date(startsAt).getTime() ? "live" : "scheduled";
  const query = db.from("competitions").update(updates).eq("id", id).eq("starts_at", existing.starts_at).eq("duration_minutes", existing.duration_minutes);
  const result = await query.select("id").maybeSingle();
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw conflict("Competition changed. Refresh and try again.");
  return { updated: true };
}

type CompetitionRow = {
  id: string;
  title: string;
  description: string;
  cbt_id: string | null;
  course_id: string | null;
  prize_description: string;
  question_limit: number | null;
  starts_at: string;
  duration_minutes: number;
  ends_at: string | null;
  level: string;
  prize_pool_naira: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  courses: { code: string } | null;
  cbts: { competition_id: string | null } | null;
  competition_entries: {
    user_id: string;
    score: number;
    speed_seconds: number;
    started_at: string | null;
    submitted_at: string | null;
    final_rank: number | null;
    profiles: { first_name: string; last_name: string; avatar_url: string | null } | null;
  }[];
};

/** Lists competition cards with safely calculated participant counts and standings. */
export async function listCompetitions(userId: string, isAdmin = false) {
  const profile = isAdmin ? null : must<{ level: string | null }>(await db.from("profiles").select("level").eq("id", userId).single());
  const rows = must<CompetitionRow[]>(
    await db
      .from("competitions")
      .select("*, courses(code), cbts!competitions_cbt_id_fkey(competition_id), competition_entries(user_id, score, speed_seconds, started_at, submitted_at, final_rank, profiles(first_name, last_name, avatar_url))")
      .neq("status", "cancelled")
      .order("starts_at", { ascending: false }),
  );
  return rows.filter((row) => isAdmin || row.level === "all" || row.level === profile?.level || row.competition_entries.some((entry) => entry.user_id === userId && entry.started_at)).map((competition) => {
    const start = new Date(competition.starts_at).getTime();
    const end = competition.ends_at ? new Date(competition.ends_at).getTime() : start + competition.duration_minutes * 60_000;
    const effectiveStatus =
      (competition.status === "scheduled" || competition.status === "live") && Date.now() >= end
        ? "completed"
        : competition.status === "scheduled" && Date.now() >= start
          ? "live"
          : competition.status;
    const standings = competition.competition_entries.map((entry) => ({ ...entry,
      speed_seconds: effectiveStatus === "completed" && entry.started_at && !entry.submitted_at
        ? Math.max(0, Math.floor((end - new Date(entry.started_at).getTime()) / 1000)) : Number(entry.speed_seconds),
    }))
      .sort((left, right) => right.score - left.score || Number(Boolean(right.started_at)) - Number(Boolean(left.started_at)) || Number(left.speed_seconds) - Number(right.speed_seconds) || left.user_id.localeCompare(right.user_id))
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.user_id,
        started: Boolean(entry.started_at),
        submittedAt: entry.submitted_at,
        name: [entry.profiles?.first_name, entry.profiles?.last_name].filter(Boolean).join(" ") || "Student",
        ...(entry.profiles?.avatar_url ? { avatarUrl: entry.profiles.avatar_url } : {}),
        score: entry.score,
        speedSeconds: Number(entry.speed_seconds),
        ...(entry.user_id === userId ? { isCurrentUser: true } : {}),
      }));
    return {
      id: competition.id,
      title: competition.title,
      description: competition.description,
      courseId: competition.course_id,
      prizeDescription: competition.prize_description,
      questionLimit: competition.question_limit,
      questionSource: competition.cbts?.competition_id === competition.id ? "custom" : "bank",
      courseCode: competition.courses?.code ?? "General",
      ...(competition.cbt_id ? { cbtId: competition.cbt_id } : {}),
      startsAt: competition.starts_at,
      durationMinutes: competition.duration_minutes,
      endsAt: new Date(end).toISOString(),
      hasStarted: competition.competition_entries.some((entry) => Boolean(entry.started_at)),
      level: competition.level,
      prizePoolNaira: competition.prize_pool_naira,
      status: effectiveStatus,
      participantCount: competition.competition_entries.length,
      registered: competition.competition_entries.some((entry) => entry.user_id === userId),
      standings,
    };
  });
}

/** Registers a student once; contest scoring stays server-owned. */
export async function registerForCompetition(competitionId: string, userId: string) {
  await assertEligible(competitionId, userId);
  const competition = must<{ id: string; status: string; starts_at: string }>(
    await db.from("competitions").select("id, status, starts_at").eq("id", competitionId).maybeSingle(),
    "Competition not found.",
  );
  if (competition.status !== "scheduled" || new Date(competition.starts_at).getTime() <= Date.now()) {
    throw conflict("Registration is closed for this competition.");
  }
  const { error } = await db.from("competition_entries").upsert(
    { competition_id: competitionId, user_id: userId },
    { onConflict: "competition_id,user_id", ignoreDuplicates: true },
  );
  if (error) throw new Error(error.message);
  return { registered: true };
}

export async function createCompetition(input: {
  title: string;
  description: string;
  courseId?: string | null;
  cbtId?: string | null;
  startsAt: string;
  durationMinutes: number;
  level: string;
  prizePoolNaira: number;
  prizeDescription?: string;
  questionSource?: "bank" | "custom";
  questionLimit?: number | null;
  customQuestions?: CompetitionQuestion[];
}) {
  const custom = input.questionSource === "custom";
  if (custom) {
    if (!input.courseId) throw badRequest("Choose a course before creating custom competition questions.");
    if (!input.customQuestions?.length) throw badRequest("Add at least one custom question.");
  } else {
    await assertQuestionBankReady(input.cbtId);
  }
  const competition = must<CompetitionSettingsRow>(
    await db
      .from("competitions")
      .insert({
        title: input.title,
        description: input.description,
        course_id: input.courseId ?? null,
        cbt_id: custom ? null : input.cbtId ?? null,
        starts_at: input.startsAt,
        duration_minutes: input.durationMinutes,
        level: input.level,
        prize_pool_naira: input.prizePoolNaira,
        prize_description: input.prizeDescription ?? "",
        question_limit: custom ? null : input.questionLimit ?? null,
      })
      .select()
      .single(),
  );
  if (!custom) return competition;
  const cbt = await createCustomPracticeSet({
    competitionId: competition.id,
    courseId: input.courseId!,
    title: input.title,
    startsAt: input.startsAt,
    durationMinutes: input.durationMinutes,
    questions: input.customQuestions!,
  });
  must(await db.from("competitions").update({ cbt_id: cbt.id }).eq("id", competition.id).select("id").single());
  return { ...competition, cbt_id: cbt.id };
}

type ArenaCompetition = {
  id: string; cbt_id: string | null; title: string; starts_at: string;
  duration_minutes: number; ends_at: string | null; scoring_ends_at: string | null;
  question_limit: number | null; level: string;
  status: "scheduled" | "live" | "completed" | "cancelled";
};
type ArenaEntry = {
  id: string; started_at: string | null; submitted_at: string | null; score: number;
  answers: Record<string, number | null>; next_index: number;
  question_snapshot: { id: string; text: string; options: string[]; topic: string; answer_index: number }[];
};
const deadlineFor = (competition: ArenaCompetition) => competition.ends_at
  ? new Date(competition.ends_at).getTime()
  : new Date(competition.starts_at).getTime() + competition.duration_minutes * 60_000;

async function getArenaCompetition(id: string) {
  return must<ArenaCompetition>(await db.from("competitions").select("*").eq("id", id).maybeSingle(), "Competition not found.");
}

async function arenaAction<T>(competitionId: string, userId: string, action: string, questionId?: string, selectedIndex?: number | null): Promise<T> {
  const { data, error } = await db.rpc("competition_arena_action", {
    p_competition_id: competitionId, p_user_id: userId, p_action: action,
    p_question_id: questionId ?? null, p_selected_index: selectedIndex ?? null,
  });
  if (error) {
    if (error.message === "Competition not found.") throw notFound(error.message);
    if (error.message.includes("different study level")) throw forbidden(error.message);
    if (error.code === "P0001") throw conflict(error.message);
    throw new Error("The arena could not save your progress. Please try again.");
  }
  return data as T;
}

async function standingsFor(competitionId: string, currentUserId: string, competition: ArenaCompetition) {
  const rows = must<{
    user_id: string; score: number; speed_seconds: number; started_at: string | null; submitted_at: string | null;
    profiles: { first_name: string; last_name: string; avatar_url: string | null } | { first_name: string; last_name: string; avatar_url: string | null }[] | null;
  }[]>(await db.from("competition_entries").select("user_id, score, speed_seconds, started_at, submitted_at, profiles(first_name, last_name, avatar_url)").eq("competition_id", competitionId));
  const ended = competition.status === "completed" || Date.now() >= deadlineFor(competition);
  for (const row of rows) if (ended && row.started_at && !row.submitted_at) row.speed_seconds = Math.max(0, Math.floor((deadlineFor(competition) - new Date(row.started_at).getTime()) / 1000));
  return rows.sort((a, b) => b.score - a.score || Number(Boolean(b.started_at)) - Number(Boolean(a.started_at)) || Number(a.speed_seconds) - Number(b.speed_seconds) || a.user_id.localeCompare(b.user_id)).map((row, index) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      rank: index + 1, userId: row.user_id, started: Boolean(row.started_at), submittedAt: row.submitted_at,
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Student",
      ...(profile?.avatar_url ? { avatarUrl: profile.avatar_url } : {}),
      score: row.score, speedSeconds: Number(row.speed_seconds),
      ...(row.user_id === currentUserId ? { isCurrentUser: true } : {}),
    };
  });
}

/** Read-only updates: polling never re-enters the contest or downloads question banks. */
export async function arenaState(competitionId: string, userId: string) {
  const competition = await getArenaCompetition(competitionId);
  const entry = must<{ started_at: string | null; submitted_at: string | null; score: number; next_index: number; answers: Record<string, number | null> }[]>(
    await db.from("competition_entries").select("started_at, submitted_at, score, next_index, answers").eq("competition_id", competitionId).eq("user_id", userId),
  )[0];
  if (!entry?.started_at) await assertEligible(competitionId, userId);
  const stamp = Date.now();
  const deadline = deadlineFor(competition);
  const status = competition.status === "cancelled" ? "cancelled" : competition.status === "completed" || stamp >= deadline ? "completed" : stamp < new Date(competition.starts_at).getTime() ? "scheduled" : "live";
  return {
    serverNow: new Date(stamp).toISOString(),
    competition: { id: competition.id, title: competition.title, startsAt: competition.starts_at, deadline: new Date(deadline).toISOString(), scoringEndsAt: competition.scoring_ends_at, status },
    entry: { started: Boolean(entry?.started_at), submitted: Boolean(entry?.submitted_at), score: entry?.score ?? 0, nextIndex: entry?.next_index ?? 0 },
    answers: entry?.answers ?? {}, standings: await standingsFor(competitionId, userId, competition),
  };
}

/** A single entry request snapshots questions. Answer keys never leave the service. */
export async function enterArena(competitionId: string, userId: string) {
  const entry = await arenaAction<ArenaEntry>(competitionId, userId, "enter");
  return {
    ...await arenaState(competitionId, userId),
    questions: entry.submitted_at ? [] : entry.question_snapshot.map(({ answer_index: _answer, ...question }) => question),
  };
}

export async function saveArenaAnswer(competitionId: string, userId: string, questionId: string, selectedIndex: number | null) {
  return arenaAction<{ saved: boolean; score: number; selectedIndex: number | null; awarded: number }>(competitionId, userId, "answer", questionId, selectedIndex);
}

export async function submitArena(competitionId: string, userId: string) {
  const entry = await arenaAction<ArenaEntry>(competitionId, userId, "submit");
  const standings = await standingsFor(competitionId, userId, await getArenaCompetition(competitionId));
  return { score: entry.score, rank: standings.find((row) => row.isCurrentUser)?.rank ?? null, participantCount: standings.length, standings };
}
