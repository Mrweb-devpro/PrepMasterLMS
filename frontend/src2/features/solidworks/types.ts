export type Difficulty = "easy" | "medium" | "hard" | "super-hard";
export type Verdict = "good" | "needs-work";

export interface SwTask {
  id: string;
  /** Sequential task number (Task #1, #2…), assigned on create. */
  number: number;
  title: string;
  summary: string;
  description: string;
  steps: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface SwFile {
  name: string;
  size: number;
  mime?: string;
  /** Local preview link before upload, or a short-lived storage link after. */
  url?: string;
  /** The picked file, kept until it's uploaded on submit. */
  file?: File;
}

export interface SwGrade {
  scores: { mass: number; volume: number; model: number };
  total: number;
  verdict: Verdict;
  remarks: string;
  gradedAt: string;
}

export interface SwSubmission {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  files: SwFile[];
  mass: string;
  volume: string;
  difficulty: Difficulty;
  challenge: string;
  submittedAt: string;
  grade?: SwGrade;
}

export interface SwResponse {
  id: string;
  body: string;
  at: string;
}

export interface SwQuestion {
  id: string;
  userId: string;
  userName: string;
  title: string;
  body: string;
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
  responses: SwResponse[];
}

/** Reference row: who joined SolidWorks. Profile data lives on the user record. */
export interface SwUser {
  userId: string;
  name: string;
  email: string;
  userType: "student" | "freelancer";
  heard?: string;
  joinedAt: string;
}

export type NewTask = Omit<SwTask, "id" | "number" | "createdAt">;
export type NewSubmission = Omit<SwSubmission, "id" | "submittedAt" | "grade">;
export type NewQuestion = Pick<SwQuestion, "userId" | "userName" | "title" | "body" | "taskIds">;
