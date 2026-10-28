import { api } from "@/lib/api/client";
import { LIVE } from "@/lib/api/config";
import { cbts, mockCompetitions, type Competition, type Question } from "@/lib/mock-data";

export type CompetitionListResponse = { competitions: Competition[] };

export async function fetchCompetitions(): Promise<Competition[]> {
  if (!LIVE) return mockCompetitions;
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
  title: string;
  description: string;
  courseId?: string | null;
  cbtId?: string | null;
  startsAt: string;
  durationMinutes: number;
  level: string;
  prizePoolNaira: number;
}

export async function createCompetition(input: CreateCompetitionInput) {
  if (!LIVE) {
    const id = `competition-${Date.now()}`;
    mockCompetitions.unshift({
      id,
      title: input.title,
      description: input.description,
      courseCode: "New contest",
      ...(input.cbtId ? { cbtId: input.cbtId } : {}),
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

export interface ArenaData {
  competition: { id: string; title: string; deadline: string };
  questions: Pick<Question, "id" | "text" | "options" | "topic">[];
  answers: Record<string, number>;
  standings: Competition["standings"];
}

const mockAnswers = new Map<string, Record<string, number>>();
let mockScoreShift = 0;

export async function enterCompetitionArena(competitionId: string): Promise<ArenaData> {
  if (!LIVE) {
    const competition = mockCompetitions.find((item) => item.id === competitionId);
    if (!competition) throw new Error("Competition not found.");
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
  return api.post<ArenaData>(`/competitions/${competitionId}/enter`);
}

export async function saveCompetitionAnswer(competitionId: string, questionId: string, selectedIndex: number) {
  if (!LIVE) {
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
