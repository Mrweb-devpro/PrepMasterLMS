import { api } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import { cbts, courses, mockCompetitions, type Competition, type Question } from "@/lib/mock-data";
import { competitionStatus } from "../utils/visibility";

export type CompetitionListResponse = { competitions: Competition[] };

export async function fetchCompetitions(): Promise<Competition[]> {
  if (!LIVE) return mockCompetitions.map((item) => ({ ...item, status: competitionStatus(item) }));
  return (await api.get<CompetitionListResponse>("/competitions")).competitions;
}

export async function registerForCompetition(competitionId: string) {
  if (!LIVE) {
    const competition = mockCompetitions.find((item) => item.id === competitionId);
    if (competition) competition.registered = true;
    return { registered: true };
  }
  return api.post<{ registered: boolean }>(`/competitions/${competitionId}/register`);
}

export interface CreateCompetitionInput {
  prizeDescription?: string;
  title: string;
  description: string;
  courseId?: string | null;
  cbtId?: string | null;
  startsAt: string;
  durationMinutes: number;
  level: string;
  prizePoolNaira: number;
  questionSource: "bank" | "custom";
  questionLimit?: number | null;
  customQuestions?: CompetitionQuestionDraft[];
}

export interface CompetitionQuestionDraft {
  text: string;
  options: string[];
  answerIndex: number;
  topic?: string;
  explanation?: string;
}

export interface AdminCompetitionQuestion extends CompetitionQuestionDraft {
  id: string;
}

export async function fetchCompetitionQuestionBank(cbtId: string): Promise<AdminCompetitionQuestion[]> {
  if (!LIVE) {
    const cbt = cbts.find((item) => item.id === cbtId);
    return (cbt?.questions ?? []).map((question) => ({
      id: question.id,
      text: question.text,
      options: question.options,
      answerIndex: question.answerIndex,
      ...(question.topic ? { topic: question.topic } : {}),
      ...(question.explanation ? { explanation: question.explanation } : {}),
    }));
  }
  const detail = await api.get<{ questions: { id: string; text: string; options: string[]; answer_index: number; topic: string; explanation: string }[] }>(`/cbts/admin/${cbtId}`);
  return detail.questions.map((question) => ({
    id: question.id,
    text: question.text,
    options: question.options,
    answerIndex: question.answer_index,
    ...(question.topic ? { topic: question.topic } : {}),
    ...(question.explanation ? { explanation: question.explanation } : {}),
  }));
}

export async function createCompetition(input: CreateCompetitionInput) {
  if (!LIVE) {
    const id = `competition-${Date.now()}`;
    let cbtId = input.cbtId ?? undefined;
    if (input.questionSource === "custom") {
      const course = courses.find((item) => item.id === input.courseId || item.slug === input.courseId);
      if (!course) throw new Error("Choose a course before creating custom competition questions.");
      cbtId = `competition-practice-${Date.now()}`;
      const releasesAt = new Date(new Date(input.startsAt).getTime() + input.durationMinutes * 60_000 + 90 * 60_000).toISOString();
      cbts.unshift({
        id: cbtId,
        title: `🏆 Practice: ${input.title}`,
        courseSlug: course.slug,
        kind: "practice",
        paid: false,
        questionCount: input.customQuestions?.length ?? 0,
        minutes: input.durationMinutes,
        retakePolicy: "Unlimited retakes",
        published: false,
        competitionId: id,
        releasesAt,
        createdAt: new Date().toISOString(),
        questions: (input.customQuestions ?? []).map((question, index) => ({ id: `${cbtId}-q${index + 1}`, courseSlug: course.slug, ...question })),
      });
    }
    mockCompetitions.unshift({
      id,
      title: input.title,
      courseId: input.courseId ?? null,
      prizeDescription: input.prizeDescription ?? "",
      questionSource: input.questionSource,
      questionLimit: input.questionSource === "bank" ? input.questionLimit ?? null : null,
      description: input.description,
      courseCode: "New contest",
      ...(cbtId ? { cbtId } : {}),
      startsAt: input.startsAt,
      durationMinutes: input.durationMinutes,
      level: input.level,
      prizePoolNaira: input.prizePoolNaira,
      status: "scheduled",
      participantCount: 0,
      standings: [],
    });
    return { id };
  }
  return api.post<{ id: string }>("/competitions/admin", { ...input });
}

export type CompetitionUpdate = Partial<CreateCompetitionInput>;
export async function updateCompetition(id: string, updates: CompetitionUpdate) {
  if (LIVE) return api.patch(`/competitions/admin/${id}`, updates);
  const item = mockCompetitions.find((row) => row.id === id);
  if (!item) throw new Error("Competition not found.");
  const { cbtId, ...settings } = updates;
  Object.assign(item, settings);
  if (updates.questionSource === "custom" && updates.customQuestions) {
    const course = courses.find((entry) => entry.id === updates.courseId || entry.slug === updates.courseId);
    if (!course) throw new Error("Choose a course before creating custom competition questions.");
    const linked = cbts.find((entry) => entry.id === item.cbtId && entry.competitionId === id);
    const practiceId = linked?.id ?? `competition-practice-${Date.now()}`;
    const releasesAt = new Date(new Date(item.startsAt).getTime() + item.durationMinutes * 60_000 + 90 * 60_000).toISOString();
    const practice = {
      id: practiceId,
      title: `🏆 Practice: ${item.title}`,
      courseSlug: course.slug,
      kind: "practice" as const,
      paid: false,
      questionCount: updates.customQuestions.length,
      minutes: item.durationMinutes,
      retakePolicy: "Unlimited retakes",
      published: new Date(releasesAt).getTime() <= Date.now(),
      competitionId: id,
      releasesAt,
      createdAt: linked?.createdAt ?? new Date().toISOString(),
      questions: updates.customQuestions.map((question, index) => ({ id: `${practiceId}-q${index + 1}`, courseSlug: course.slug, ...question })),
    };
    if (linked) Object.assign(linked, practice);
    else cbts.unshift(practice);
    item.cbtId = practiceId;
    item.questionLimit = null;
  }
  if (cbtId === null) delete item.cbtId;
  else if (cbtId !== undefined) item.cbtId = cbtId;
  item.status = competitionStatus(item);
  return { updated: true };
}

export interface ArenaData {
  competition: { id: string; title: string; deadline: string };
  questions: Pick<Question, "id" | "text" | "options" | "topic">[];
  answers: Record<string, number>;
  standings: Competition["standings"];
}

const mockAnswers = new Map<string, Record<string, number>>();
let mockScoreShift = 0;

async function withinArenaTimeout<T>(operation: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof window.setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error("The arena is taking too long to respond. Please try again.")), 15_000);
  });
  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timer) window.clearTimeout(timer);
  }
}

export async function enterCompetitionArena(competitionId: string): Promise<ArenaData> {
  if (!LIVE) {
    const competition = mockCompetitions.find((item) => item.id === competitionId);
    if (!competition) throw new Error("Competition not found.");
    if (competitionStatus(competition) !== "live") throw new Error("This competition is not live.");
    const cbt = cbts.find((item) => item.id === competition.cbtId);
    mockScoreShift += 1;
    return {
      competition: { id: competition.id, title: competition.title, deadline: new Date(new Date(competition.startsAt).getTime() + competition.durationMinutes * 60_000).toISOString() },
      questions: (cbt?.questions ?? []).map(({ id, text, options, topic }) => ({
        id,
        text,
        options,
        ...(topic ? { topic } : {}),
      })),
      answers: mockAnswers.get(competitionId) ?? {},
      standings: competition.standings.map((entry, index) => entry.isCurrentUser ? entry : { ...entry, score: entry.score + ((mockScoreShift + index) % 3) * 10 }),
    };
  }
  return withinArenaTimeout(api.post<ArenaData>(`/competitions/${competitionId}/enter`));
}

export async function saveCompetitionAnswer(competitionId: string, questionId: string, selectedIndex: number) {
  if (!LIVE) {
    const competition = mockCompetitions.find((item) => item.id === competitionId);
    if (!competition || competitionStatus(competition) !== "live") throw new Error("This competition is not live.");
    const answers = { ...(mockAnswers.get(competitionId) ?? {}), [questionId]: selectedIndex };
    mockAnswers.set(competitionId, answers);
    return { saved: true, score: 0, awarded: 0 };
  }
  return api.put<{ saved: boolean; score: number; awarded: number }>(`/competitions/${competitionId}/answers`, { questionId, selectedIndex });
}

export async function submitCompetitionArena(competitionId: string) {
  if (!LIVE) return { score: 825, rank: 8, participantCount: 86, standings: mockCompetitions.find((item) => item.id === competitionId)?.standings ?? [] };
  return api.post<{ score: number; rank: number | null; participantCount: number; standings: Competition["standings"] }>(`/competitions/${competitionId}/submit`);
}
