import { badRequest, conflict, must } from "../lib/errors.js";
import { db } from "../lib/supabase.js";

type CompetitionRow = {
  id: string;
  title: string;
  description: string;
  cbt_id: string | null;
  starts_at: string;
  duration_minutes: number;
  level: string;
  prize_pool_naira: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
  courses: { code: string } | null;
  competition_entries: {
    user_id: string;
    score: number;
    speed_seconds: number;
    final_rank: number | null;
    profiles: { first_name: string; last_name: string } | null;
  }[];
};

/** Lists competition cards with safely calculated participant counts and standings. */
export async function listCompetitions(userId: string) {
  const rows = must<CompetitionRow[]>(
    await db
      .from("competitions")
      .select("*, courses(code), competition_entries(user_id, score, speed_seconds, final_rank, profiles(first_name, last_name))")
      .neq("status", "cancelled")
      .order("starts_at", { ascending: false }),
  );
  return rows.map((competition) => {
    const start = new Date(competition.starts_at).getTime();
    const end = start + competition.duration_minutes * 60_000;
    const effectiveStatus =
      competition.status === "scheduled" && Date.now() >= end
        ? "completed"
        : competition.status === "scheduled" && Date.now() >= start
          ? "live"
          : competition.status;
    const standings = [...competition.competition_entries]
      .sort((left, right) => right.score - left.score || Number(left.speed_seconds) - Number(right.speed_seconds))
      .map((entry, index) => ({
        rank: entry.final_rank ?? index + 1,
        name: [entry.profiles?.first_name, entry.profiles?.last_name].filter(Boolean).join(" ") || "Student",
        score: entry.score,
        speedSeconds: Number(entry.speed_seconds),
        ...(entry.user_id === userId ? { isCurrentUser: true } : {}),
      }));
    return {
      id: competition.id,
      title: competition.title,
      description: competition.description,
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
}) {
  return must(
    await db
      .from("competitions")
      .insert({
        title: input.title,
        description: input.description,
        course_id: input.courseId ?? null,
        cbt_id: input.cbtId ?? null,
        starts_at: input.startsAt,
        duration_minutes: input.durationMinutes,
        level: input.level,
        prize_pool_naira: input.prizePoolNaira,
      })
      .select()
      .single(),
  );
}

type ArenaCompetition = {
  id: string;
  cbt_id: string | null;
  title: string;
  starts_at: string;
  duration_minutes: number;
  status: "scheduled" | "live" | "completed" | "cancelled";
};
type ArenaEntry = {
  id: string;
  started_at: string | null;
  submitted_at: string | null;
  score: number;
  answers: Record<string, number>;
  question_answered_at: Record<string, string>;
};

const deadlineFor = (competition: ArenaCompetition) =>
  new Date(competition.starts_at).getTime() + competition.duration_minutes * 60_000;

async function getArenaCompetition(competitionId: string) {
  return must<ArenaCompetition>(
    await db.from("competitions").select("id, cbt_id, title, starts_at, duration_minutes, status").eq("id", competitionId).maybeSingle(),
    "Competition not found.",
  );
}

async function getEntry(competitionId: string, userId: string) {
  return must<ArenaEntry>(
    await db.from("competition_entries").select("id, started_at, submitted_at, score, answers, question_answered_at").eq("competition_id", competitionId).eq("user_id", userId).maybeSingle(),
    "Register for this competition before entering the arena.",
  );
}

function assertArenaOpen(competition: ArenaCompetition) {
  const start = new Date(competition.starts_at).getTime();
  if (competition.status === "cancelled" || Date.now() < start) throw conflict("This competition has not started yet.");
  if (Date.now() >= deadlineFor(competition)) throw conflict("This competition has ended.");
  if (!competition.cbt_id) throw badRequest("This competition does not have a question bank yet.");
}

async function standingsFor(competitionId: string, currentUserId: string) {
  const rows = must<{ user_id: string; score: number; speed_seconds: number; final_rank: number | null; profiles: { first_name: string; last_name: string }[] | null }[]>(
    await db.from("competition_entries").select("user_id, score, speed_seconds, final_rank, profiles(first_name, last_name)").eq("competition_id", competitionId),
  );
  return rows.sort((a, b) => b.score - a.score || Number(a.speed_seconds) - Number(b.speed_seconds)).map((row, index) => ({
    rank: row.final_rank ?? index + 1,
    name: [row.profiles?.[0]?.first_name, row.profiles?.[0]?.last_name].filter(Boolean).join(" ") || "Student",
    score: row.score,
    speedSeconds: Number(row.speed_seconds),
    ...(row.user_id === currentUserId ? { isCurrentUser: true } : {}),
  }));
}

/** Starts an already registered contestant and exposes only public question fields. */
export async function enterArena(competitionId: string, userId: string) {
  const competition = await getArenaCompetition(competitionId);
  assertArenaOpen(competition);
  const entry = await getEntry(competitionId, userId);
  if (entry.submitted_at) throw conflict("You have already completed this competition.");
  const startedAt = entry.started_at ?? new Date().toISOString();
  if (!entry.started_at) await db.from("competition_entries").update({ started_at: startedAt }).eq("id", entry.id);
  const questions = must<{ id: string; position: number; text: string; options: string[]; topic: string }[]>(
    await db.from("cbt_questions").select("id, position, text, options, topic").eq("cbt_id", competition.cbt_id!).order("position"),
  );
  return {
    competition: { id: competition.id, title: competition.title, deadline: new Date(deadlineFor(competition)).toISOString() },
    questions,
    answers: entry.answers ?? {},
    standings: await standingsFor(competitionId, userId),
  };
}

/** Saves a first answer only and calculates its score entirely on the server clock. */
export async function saveArenaAnswer(competitionId: string, userId: string, questionId: string, selectedIndex: number) {
  const competition = await getArenaCompetition(competitionId);
  assertArenaOpen(competition);
  const entry = await getEntry(competitionId, userId);
  if (entry.submitted_at) throw conflict("This competition entry is complete.");
  if (entry.answers?.[questionId] !== undefined) return { saved: true, score: entry.score };
  const question = must<{ cbt_id: string; options: string[]; answer_index: number }>(
    await db.from("cbt_questions").select("cbt_id, options, answer_index").eq("id", questionId).maybeSingle(),
    "Question not found.",
  );
  if (question.cbt_id !== competition.cbt_id || selectedIndex >= question.options.length) throw badRequest("Invalid answer.");
  const answeredAt = new Date();
  const secondsRemaining = Math.max(0, Math.floor((deadlineFor(competition) - answeredAt.getTime()) / 1_000));
  const awarded = selectedIndex === question.answer_index ? 100 + Math.floor(secondsRemaining * 2) : 0;
  const answers = { ...(entry.answers ?? {}), [questionId]: selectedIndex };
  const answeredAtByQuestion = { ...(entry.question_answered_at ?? {}), [questionId]: answeredAt.toISOString() };
  const score = entry.score + awarded;
  await db.from("competition_entries").update({ answers, question_answered_at: answeredAtByQuestion, score, speed_seconds: Math.max(0, Math.floor((answeredAt.getTime() - new Date(entry.started_at ?? answeredAt).getTime()) / 1_000)) }).eq("id", entry.id);
  return { saved: true, score, awarded };
}

/** Locks a completed entry and returns rank data for the victory screen. */
export async function submitArena(competitionId: string, userId: string) {
  const competition = await getArenaCompetition(competitionId);
  const entry = await getEntry(competitionId, userId);
  if (!entry.submitted_at) await db.from("competition_entries").update({ submitted_at: new Date().toISOString() }).eq("id", entry.id);
  const standings = await standingsFor(competitionId, userId);
  const mine = standings.find((row) => row.isCurrentUser);
  if (mine) await db.from("competition_entries").update({ final_rank: mine.rank }).eq("id", entry.id);
  return { score: entry.score, rank: mine?.rank ?? null, participantCount: standings.length, standings };
}
