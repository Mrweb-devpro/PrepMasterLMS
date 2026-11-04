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

export type CompetitionUpdate = Partial<CreateCompetitionInput> & { endsAt?: string };
export async function updateCompetition(id: string, updates: CompetitionUpdate) {
  if (LIVE) return api.patch(`/competitions/admin/${id}`, updates);
  const item = mockCompetitions.find((row) => row.id === id);
  if (!item) throw new Error("Competition not found.");
  const { cbtId, ...settings } = updates;
  if (item.hasStarted && (updates.questionSource !== undefined || updates.customQuestions !== undefined || updates.questionLimit !== undefined)) throw new Error("The question bank is locked after students start.");
  Object.assign(item, settings);
  if (!updates.endsAt && (updates.startsAt !== undefined || updates.durationMinutes !== undefined)) item.endsAt = new Date(new Date(item.startsAt).getTime() + item.durationMinutes * 60_000).toISOString();
  if (updates.questionSource === "custom" && updates.customQuestions) {
    const course = courses.find((entry) => entry.id === (updates.courseId ?? item.courseId) || entry.slug === (updates.courseId ?? item.courseId));
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
  if (cbtId === null && updates.questionSource !== "custom") delete item.cbtId;
  else if (cbtId !== undefined) item.cbtId = cbtId;
  const linkedPractice = cbts.find((entry) => entry.id === item.cbtId && entry.competitionId === id);
  if (linkedPractice) {
    linkedPractice.title = `🏆 Practice: ${item.title}`;
    linkedPractice.releasesAt = new Date(new Date(item.endsAt ?? new Date(new Date(item.startsAt).getTime() + item.durationMinutes * 60_000).toISOString()).getTime() + 90 * 60_000).toISOString();
    linkedPractice.published = new Date(linkedPractice.releasesAt).getTime() <= Date.now();
  }
  item.status = competitionStatus({ ...item, status: "scheduled" });
  return { updated: true };
}

export interface ArenaState {
  serverNow: string;
  competition: { id: string; title: string; startsAt: string; deadline: string; scoringEndsAt: string | null; status: Competition["status"] };
  answers: Record<string, number | null>;
  entry: { started: boolean; submitted: boolean; score: number; nextIndex: number };
  standings: Competition["standings"];
}
export interface ArenaData extends ArenaState {
  questions: Pick<Question, "id" | "text" | "options" | "topic">[];
}
export interface AnswerReceipt { saved: boolean; score: number; selectedIndex: number | null; awarded: number }

type DemoEntry = { startedAt: string; submittedAt: string | null; score: number; answers: Record<string, number | null>; nextIndex: number; questions: Question[]; scoringEndsAt: string; speedSeconds: number };
const demoEntries = new Map<string, DemoEntry>();
const demoKey = (id: string, userId: string) => `pm_competition_${userId}_${id}`;
function readDemo(id: string, userId: string): DemoEntry | undefined {
  const key = demoKey(id, userId);
  if (demoEntries.has(key)) return demoEntries.get(key);
  try {
    const raw = localStorage.getItem(key);
    if (raw) { const entry = JSON.parse(raw) as DemoEntry; demoEntries.set(key, entry); return entry; }
  } catch { /* Memory fallback when storage is unavailable. */ }
}
function writeDemo(id: string, userId: string, entry: DemoEntry) {
  demoEntries.set(demoKey(id, userId), entry);
  try { localStorage.setItem(demoKey(id, userId), JSON.stringify(entry)); } catch { /* Keep the session in memory. */ }
}
function demoContest(id: string) {
  const contest = mockCompetitions.find((item) => item.id === id);
  if (!contest) throw new Error("Competition not found.");
  return contest;
}
const demoDeadline = (contest: Competition) => contest.endsAt ?? new Date(new Date(contest.startsAt).getTime() + contest.durationMinutes * 60_000).toISOString();

async function arenaRequest<T>(request: Promise<T>): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([request, new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error("The connection is taking too long. Your locked answers will retry automatically.")), 15_000);
    })]);
  } finally { clearTimeout(timeout); }
}

export async function fetchArenaState(id: string, userId: string): Promise<ArenaState> {
  if (LIVE) return arenaRequest(api.get<ArenaState>(`/competitions/${id}/arena`));
  const contest = demoContest(id);
  const entry = readDemo(id, userId);
  const previous = contest.standings.find((row) => row.isCurrentUser);
  const standings = [...contest.standings.filter((row) => !row.isCurrentUser), ...(entry ? [{
    rank: 0, userId, name: previous?.name ?? "You", ...(previous?.avatarUrl ? { avatarUrl: previous.avatarUrl } : {}),
    score: entry.score, speedSeconds: entry.speedSeconds, started: true, submittedAt: entry.submittedAt, isCurrentUser: true,
  }] : [])].sort((a, b) => b.score - a.score || Number(b.started !== false) - Number(a.started !== false) || a.speedSeconds - b.speedSeconds).map((row, index) => ({ ...row, rank: index + 1 }));
  if (entry) { contest.standings = standings; contest.hasStarted = true; contest.participantCount = standings.length; }
  return {
    serverNow: new Date().toISOString(),
    competition: { id, title: contest.title, startsAt: contest.startsAt, deadline: demoDeadline(contest), scoringEndsAt: entry?.scoringEndsAt ?? demoDeadline(contest), status: competitionStatus(contest) },
    answers: entry?.answers ?? {}, entry: { started: Boolean(entry), submitted: Boolean(entry?.submittedAt), score: entry?.score ?? 0, nextIndex: entry?.nextIndex ?? 0 }, standings,
  };
}

export async function enterCompetitionArena(id: string, userId: string): Promise<ArenaData> {
  if (LIVE) return arenaRequest(api.post<ArenaData>(`/competitions/${id}/enter`));
  const contest = demoContest(id);
  if (competitionStatus(contest) !== "live") throw new Error("This competition is not live.");
  let entry = readDemo(id, userId);
  if (!entry) {
    const questions = (cbts.find((item) => item.id === contest.cbtId)?.questions ?? []).slice(0, contest.questionLimit ?? 300);
    if (!questions.length) throw new Error("This contest has no questions yet.");
    entry = { startedAt: new Date().toISOString(), submittedAt: null, score: 0, answers: {}, nextIndex: 0, questions, scoringEndsAt: demoDeadline(contest), speedSeconds: 0 };
    writeDemo(id, userId, entry);
  }
  return { ...await fetchArenaState(id, userId), questions: entry.questions.map(({ id, text, options, topic }) => ({ id, text, options, ...(topic ? { topic } : {}) })) };
}

export async function saveCompetitionAnswer(id: string, userId: string, questionId: string, selectedIndex: number | null): Promise<AnswerReceipt> {
  if (LIVE) return arenaRequest(api.put<AnswerReceipt>(`/competitions/${id}/answers`, { questionId, selectedIndex }));
  const contest = demoContest(id);
  const entry = readDemo(id, userId);
  if (!entry) throw new Error("Enter the arena first.");
  if (Object.prototype.hasOwnProperty.call(entry.answers, questionId)) return { saved: true, score: entry.score, selectedIndex: entry.answers[questionId] ?? null, awarded: 0 };
  if (entry.submittedAt || competitionStatus(contest) !== "live") throw new Error("This entry is closed.");
  const question = entry.questions[entry.nextIndex];
  if (question?.id !== questionId) throw new Error("Previous questions cannot be changed.");
  const awarded = selectedIndex === question.answerIndex ? 100 + 2 * Math.max(0, Math.floor((new Date(entry.scoringEndsAt).getTime() - Date.now()) / 1000)) : 0;
  entry.answers[questionId] = selectedIndex; entry.score += awarded; entry.nextIndex += 1;
  entry.speedSeconds = Math.max(0, Math.floor((Date.now() - new Date(entry.startedAt).getTime()) / 1000));
  writeDemo(id, userId, entry);
  return { saved: true, score: entry.score, selectedIndex, awarded };
}

export async function submitCompetitionArena(id: string, userId: string) {
  if (LIVE) return arenaRequest(api.post<{ score: number; rank: number | null; participantCount: number; standings: Competition["standings"] }>(`/competitions/${id}/submit`));
  const entry = readDemo(id, userId);
  if (!entry) throw new Error("Enter the arena first.");
  if (!entry.submittedAt) {
    entry.submittedAt = new Date(Math.min(Date.now(), new Date(demoDeadline(demoContest(id))).getTime())).toISOString();
    entry.speedSeconds = Math.max(0, Math.floor((new Date(entry.submittedAt).getTime() - new Date(entry.startedAt).getTime()) / 1000));
    writeDemo(id, userId, entry);
  }
  const state = await fetchArenaState(id, userId);
  return { score: entry.score, rank: state.standings.find((row) => row.isCurrentUser)?.rank ?? null, participantCount: state.standings.length, standings: state.standings };
}
