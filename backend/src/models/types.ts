// Models: the shape of rows and the data the API sends back.

export type Role = "admin" | "student";
export type ItemType = "material" | "cbt";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  provider: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say" | null;
  avatar_url: string | null;
  faculty: string | null;
  department: string | null;
  level: string | null;
  dob: string | null;
  heard: string | null;
  user_type: "student" | "freelancer" | null;
  sw_registered: boolean;
  sw_joined_at: string | null;
  suspended_at: string | null;
  suspend_reason: string | null;
  created_at: string;
}

export interface Cbt {
  id: string;
  course_id: string;
  title: string;
  mode: "practice" | "live";
  duration_minutes: number;
  opens_at: string;
  closes_at: string | null;
  price_kobo: number;
  max_attempts: number | null;
  reveal_results: boolean;
  published: boolean;
  paused: boolean;
  /** Present only for a practice CBT generated from a competition. */
  competition_id?: string | null;
  /** A hidden competition CBT becomes student-visible after this instant. */
  releases_at?: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  slug: string;
  code: string;
  title: string;
  color: string;
  description: string;
  level: string;
  departments: string[];
  created_at: string;
}

export interface Question {
  id: string;
  cbt_id: string;
  position: number;
  text: string;
  options: string[];
  answer_index: number;
  topic: string;
  explanation: string;
}

/** What students receive during an exam — live exams never include answer data. */
export type PublicQuestion = Omit<Question, "answer_index" | "explanation"> & {
  /** Present only for a practice session with instant-feedback support. */
  correct_index?: number;
  /** Present only for a practice session. */
  explanation?: string;
};

export interface Attempt {
  id: string;
  cbt_id: string;
  user_id: string;
  started_at: string;
  deadline: string;
  submitted_at: string | null;
  submit_attempted_at: string | null;
  status: "in_progress" | "submitted" | "expired";
  score: number | null;
  total: number | null;
  flagged_question_ids: string[];
}

export interface Material {
  id: string;
  course_id: string;
  category: string;
  subfolder: string;
  title: string;
  file_type: string;
  r2_key: string;
  size_bytes: number;
  price_kobo: number;
  created_at: string;
}

export interface SwFileRow {
  name: string;
  size: number;
  mime?: string | undefined;
  r2Key: string;
}

export type AppEnv = { Variables: { user: AuthUser } };
