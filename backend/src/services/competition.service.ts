import { badRequest, conflict, forbidden, must } from "../lib/errors.js";
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
  const existingEndsAt = new Date(existing.starts_at).getTime() + existing.duration_minutes * 60_000;
  const isLive = existing.status !== "cancelled" && now >= new Date(existing.starts_at).getTime() && now < existingEndsAt;
  const changesStartTime =
    patch.startsAt !== undefined && new Date(patch.startsAt).getTime() !== new Date(existing.starts_at).getTime();
  // During a live contest, a duration change means "minutes remaining". Moving
  // the effective start to now keeps the existing deadline calculation intact.
  const startsAt = changesStartTime
    ? patch.startsAt!
    : isLive && patch.durationMinutes !== undefined
      ? new Date(now).toISOString()
      : existing.starts_at;
  const durationMinutes = patch.durationMinutes ?? existing.duration_minutes;
  const courseId = patch.courseId !== undefined ? patch.courseId : existing.course_id;
  if (isLive && patch.durationMinutes !== undefined && !changesStartTime) {
    updates.starts_at = startsAt;
  }
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
      const releasesAt = releaseAtFor(startsAt, durationMinutes);
      await db.from("cbts").update({ course_id: courseId, releases_at: releasesAt, published: new Date(releasesAt).getTime() <= Date.now() }).eq("id", linked.data.id);
      updates.cbt_id = linked.data.id;
    } else {
      const cbt = await createCustomPracticeSet({ competitionId: id, courseId, title: patch.title ?? existing.title, startsAt, durationMinutes, questions });
      updates.cbt_id = cbt.id;
    }
    updates.question_limit = null;
  } else if (existing.cbt_id && (patch.startsAt !== undefined || patch.durationMinutes !== undefined || patch.title !== undefined || patch.courseId !== undefined)) {
    const linked = await db.from("cbts").select("id, competition_id").eq("id", existing.cbt_id).maybeSingle();
    if (linked.error) throw new Error(linked.error.message);
    if (linked.data?.competition_id === id) {
      const releasesAt = releaseAtFor(startsAt, durationMinutes);
      await db.from("cbts").update({ title: `🏆 Practice: ${patch.title ?? existing.title}`, ...(courseId ? { course_id: courseId } : {}), releases_at: releasesAt, published: new Date(releasesAt).getTime() <= Date.now() }).eq("id", linked.data.id);
    }
  }
  const endsAt = new Date(startsAt).getTime() + durationMinutes * 60_000;
  if (existing.status !== "cancelled") updates.status = now >= endsAt ? "completed" : now >= new Date(startsAt).getTime() ? "live" : "scheduled";
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
  level: string;
  prize_pool_naira: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  courses: { code: string } | null;
  cbts: { competition_id: string | null } | null;
  competition_entries: {
    user_id: string;
    score: number;
    speed_seconds: number;
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
      .select("*, courses(code), cbts!competitions_cbt_id_fkey(competition_id), competition_entries(user_id, score, speed_seconds, final_rank, profiles(first_name, last_name, avatar_url))")
      .neq("status", "cancelled")
      .order("starts_at", { ascending: false }),
  );
  return rows.filter((row) => isAdmin || row.level === "all" || row.level === profile?.level).map((competition) => {
    const start = new Date(competition.starts_at).getTime();
    const end = start + competition.duration_minutes * 60_000;
    const effectiveStatus =
      (competition.status === "scheduled" || competition.status === "live") && Date.now() >= end
        ? "completed"
        : competition.status === "scheduled" && Date.now() >= start
          ? "live"
          : competition.status;
    const standings = [...competition.competition_entries]
      .sort((left, right) => right.score - left.score || Number(left.speed_seconds) - Number(right.speed_seconds) || left.user_id.localeCompare(right.user_id))
      .map((entry, index) => ({
        rank: index + 1,
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
  await db.from("competitions").update({ cbt_id: cbt.id }).eq("id", competition.id);
  return { ...competition, cbt_id: cbt.id };
}

type ArenaCompetition = {
  id: string;
  cbt_id: string | null;
  title: string;
  starts_at: string;
  duration_minutes: number;
  question_limit: number | null;
  status: "scheduled" | "live" | "completed" | "cancelled";
};
type ArenaEntry = {
  id: string;
  started_at: string | null;
  submitted_at: string | null;
  score: number;
  answers: Record<string, number>;
  question_answered_at: Record<string, string>;
  question_ids: string[];
};

const deadlineFor = (competition: ArenaCompetition) =>
  new Date(competition.starts_at).getTime() + competition.duration_minutes * 60_000;

async function getArenaCompetition(competitionId: string) {
  return must<ArenaCompetition>(
    await db.from("competitions").select("id, cbt_id, title, starts_at, duration_minutes, question_limit, status").eq("id", competitionId).maybeSingle(),
    "Competition not found.",
  );
}

async function getEntry(competitionId: string, userId: string) {
  const fields = "id, started_at, submitted_at, score, answers, question_answered_at, question_ids";
  const { data: existing, error: existingError } = await db.from("competition_entries").select(fields).eq("competition_id", competitionId).eq("user_id", userId).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;
  const created = await db.from("competition_entries").upsert(
    { competition_id: competitionId, user_id: userId },
    { onConflict: "competition_id,user_id", ignoreDuplicates: true },
  ).select(fields).maybeSingle();
  if (created.data) return created.data as ArenaEntry;
  return must<ArenaEntry>(
    await db.from("competition_entries").select(fields).eq("competition_id", competitionId).eq("user_id", userId).single(),
  );
}

/** Chooses a question subset once and stores its ids so refreshes cannot reshuffle a live arena. */
async function questionsForEntry(competition: ArenaCompetition, entry: ArenaEntry) {
  const all = must<{ id: string; position: number; text: string; options: string[]; topic: string }[]>(
    await db.from("cbt_questions").select("id, position, text, options, topic").eq("cbt_id", competition.cbt_id!).order("position"),
  );
  if (!all.length) throw badRequest("This competition's question bank has no questions.");
  let ids = entry.question_ids ?? [];
  if (!ids.length) {
    const limit = Math.min(competition.question_limit ?? all.length, all.length);
    ids = [...all].sort(() => Math.random() - 0.5).slice(0, limit).map((question) => question.id);
    const { error } = await db.from("competition_entries").update({ question_ids: ids }).eq("id", entry.id);
    if (error) throw new Error(error.message);
  }
  const byId = new Map(all.map((question) => [question.id, question]));
  // Older edits could rebuild a custom bank and replace its question IDs after
  // entrants had started. Recover those entries from the current bank instead
  // of leaving the arena with an empty question set.
  if (ids.some((id) => !byId.has(id))) {
    const limit = Math.min(competition.question_limit ?? all.length, all.length);
    ids = all.slice(0, limit).map((question) => question.id);
    const { error } = await db.from("competition_entries").update({ question_ids: ids }).eq("id", entry.id);
    if (error) throw new Error(error.message);
  }
  return ids.map((id) => byId.get(id)).filter((question): question is (typeof all)[number] => Boolean(question));
}

function assertArenaOpen(competition: ArenaCompetition) {
  const start = new Date(competition.starts_at).getTime();
  if (competition.status === "cancelled" || Date.now() < start) throw conflict("This competition has not started yet.");
  if (competition.status === "completed" || Date.now() >= deadlineFor(competition)) throw conflict("This competition has ended.");
  if (!competition.cbt_id) throw badRequest("This competition does not have a question bank yet.");
}

async function standingsFor(competitionId: string, currentUserId: string) {
  const rows = must<{
    user_id: string;
    score: number;
    speed_seconds: number;
    final_rank: number | null;
    profiles: { first_name: string; last_name: string; avatar_url: string | null } | { first_name: string; last_name: string; avatar_url: string | null }[] | null;
  }[]>(
    await db.from("competition_entries").select("user_id, score, speed_seconds, final_rank, profiles(first_name, last_name, avatar_url)").eq("competition_id", competitionId),
  );
  return rows.sort((a, b) => b.score - a.score || Number(a.speed_seconds) - Number(b.speed_seconds) || a.user_id.localeCompare(b.user_id)).map((row, index) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      rank: index + 1,
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "Student",
      ...(profile?.avatar_url ? { avatarUrl: profile.avatar_url } : {}),
      score: row.score,
      speedSeconds: Number(row.speed_seconds),
      ...(row.user_id === currentUserId ? { isCurrentUser: true } : {}),
    };
  });
}

/** Starts an eligible contestant and exposes only public question fields. */
export async function enterArena(competitionId: string, userId: string) {
  await assertEligible(competitionId, userId);
  const competition = await getArenaCompetition(competitionId);
  assertArenaOpen(competition);
  const entry = await getEntry(competitionId, userId);
  const startedAt = entry.started_at ?? new Date().toISOString();
  if (!entry.started_at) await db.from("competition_entries").update({ started_at: startedAt }).eq("id", entry.id);
  const submitted = Boolean(entry.submitted_at);
  const questions = submitted ? [] : await questionsForEntry(competition, entry);
  return {
    competition: { id: competition.id, title: competition.title, deadline: new Date(deadlineFor(competition)).toISOString() },
    questions,
    answers: entry.answers ?? {},
    entry: { submitted, score: entry.score },
    standings: await standingsFor(competitionId, userId),
  };
}

/** Saves a first answer only and calculates its score entirely on the server clock. */
export async function saveArenaAnswer(competitionId: string, userId: string, questionId: string, selectedIndex: number) {
  await assertEligible(competitionId, userId);
  const competition = await getArenaCompetition(competitionId);
  assertArenaOpen(competition);
  const entry = await getEntry(competitionId, userId);
  if (entry.submitted_at) throw conflict("This competition entry is complete.");
  if (entry.answers?.[questionId] !== undefined) return { saved: true, score: entry.score };
  const question = must<{ cbt_id: string; options: string[]; answer_index: number }>(
    await db.from("cbt_questions").select("cbt_id, options, answer_index").eq("id", questionId).maybeSingle(),
    "Question not found.",
  );
  if (question.cbt_id !== competition.cbt_id || !entry.question_ids.includes(questionId) || selectedIndex >= question.options.length) throw badRequest("Invalid answer.");
  const answeredAt = new Date();
  const secondsRemaining = Math.max(0, Math.floor((deadlineFor(competition) - answeredAt.getTime()) / 1_000));
  const awarded = selectedIndex === question.answer_index ? 100 + Math.floor(secondsRemaining * 2) : 0;
  const answers = { ...(entry.answers ?? {}), [questionId]: selectedIndex };
  const answeredAtByQuestion = { ...(entry.question_answered_at ?? {}), [questionId]: answeredAt.toISOString() };
  const score = entry.score + awarded;
  const saved = await db.from("competition_entries").update({ answers, question_answered_at: answeredAtByQuestion, score, speed_seconds: Math.max(0, Math.floor((answeredAt.getTime() - new Date(entry.started_at ?? answeredAt).getTime()) / 1_000)) }).eq("id", entry.id);
  if (saved.error) throw conflict("Answer could not be saved. The contest may have ended.");
  return { saved: true, score, awarded };
}

/** Locks a completed entry and returns rank data for the victory screen. */
export async function submitArena(competitionId: string, userId: string) {
  await assertEligible(competitionId, userId);
  const competition = await getArenaCompetition(competitionId);
  const entry = await getEntry(competitionId, userId);
  if (!entry.submitted_at) await db.from("competition_entries").update({ submitted_at: new Date().toISOString() }).eq("id", entry.id);
  const standings = await standingsFor(competitionId, userId);
  const mine = standings.find((row) => row.isCurrentUser);
  return { score: entry.score, rank: mine?.rank ?? null, participantCount: standings.length, standings };
}
