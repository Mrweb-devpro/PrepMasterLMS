export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Role = "student" | "admin" | "instructor";
export type TrackType = "secondary" | "university";
export type ExamStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "paused"
  | "ended";
export type ExamType = "practice" | "quiz" | "cbt" | "mock";
export type ExamTag = "practice" | "mock_exam";

export type Database = {
  public: {
    Tables: {
      tracks: {
        Row: {
          id: string;
          name: string;
          type: TrackType;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: TrackType;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: TrackType;
          created_at?: string;
        };
        Relationships: [];
      };
      faculties: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string;
          faculty_id: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          faculty_id: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          faculty_id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      levels: {
        Row: {
          id: string;
          track_id: string;
          name: string;
          order: number;
          telegram_invite_link: string | null;
          is_active: boolean;
          registration_type: "free" | "paid";
          registration_price: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          name: string;
          order: number;
          telegram_invite_link?: string | null;
          is_active?: boolean;
          registration_type?: "free" | "paid";
          registration_price?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          track_id?: string;
          name?: string;
          order?: number;
          telegram_invite_link?: string | null;
          is_active?: boolean;
          registration_type?: "free" | "paid";
          registration_price?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      semesters: {
        Row: {
          id: string;
          name: string;
          order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          order: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          code: string;
          name: string;
          faculty_id: string | null;
          department_id: string | null;
          level_id: string;
          semester_id: string | null;
          track_id: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          faculty_id?: string | null;
          department_id?: string | null;
          level_id: string;
          semester_id?: string | null;
          track_id: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          faculty_id?: string | null;
          department_id?: string | null;
          level_id?: string;
          semester_id?: string | null;
          track_id?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: Role;
          track_id: string | null;
          faculty_id: string | null;
          department_id: string | null;
          level_id: string | null;
          semester_id: string | null;
          theme_preference: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: Role;
          track_id?: string | null;
          faculty_id?: string | null;
          department_id?: string | null;
          level_id?: string | null;
          semester_id?: string | null;
          theme_preference?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: Role;
          track_id?: string | null;
          faculty_id?: string | null;
          department_id?: string | null;
          level_id?: string | null;
          semester_id?: string | null;
          theme_preference?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_courses: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_subjects: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          course_id: string | null;
          subject_id: string | null;
          text: string;
          options: Json;
          correct_answer: string;
          explanation: string | null;
          topic: string | null;
          difficulty: string | null;
          is_premium: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id?: string | null;
          subject_id?: string | null;
          text: string;
          options: Json;
          correct_answer: string;
          explanation?: string | null;
          topic?: string | null;
          difficulty?: string | null;
          is_premium?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string | null;
          subject_id?: string | null;
          text?: string;
          options?: Json;
          correct_answer?: string;
          explanation?: string | null;
          topic?: string | null;
          difficulty?: string | null;
          is_premium?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      question_banks: {
        Row: {
          id: string;
          course_id: string | null;
          subject_id: string | null;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id?: string | null;
          subject_id?: string | null;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string | null;
          subject_id?: string | null;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bank_questions: {
        Row: {
          id: string;
          bank_id: string;
          question_id: string;
          topic: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bank_id: string;
          question_id: string;
          topic?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          bank_id?: string;
          question_id?: string;
          topic?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      exams: {
        Row: {
          id: string;
          title: string;
          type: ExamType;
          tag: ExamTag;
          course_id: string | null;
          subject_id: string | null;
          duration_minutes: number;
          question_count: number;
          is_premium: boolean;
          price: number | null;
          show_explanations: boolean;
          review_enabled: boolean;
          re_attempts_enabled: boolean;
          status: ExamStatus;
          schedule_start: string | null;
          schedule_end: string | null;
          free: boolean;
          exam_type: string | null;
          year: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          type: ExamType;
          tag?: ExamTag;
          course_id?: string | null;
          subject_id?: string | null;
          duration_minutes: number;
          question_count: number;
          is_premium?: boolean;
          price?: number | null;
          show_explanations?: boolean;
          review_enabled?: boolean;
          re_attempts_enabled?: boolean;
          status?: ExamStatus;
          schedule_start?: string | null;
          schedule_end?: string | null;
          free?: boolean;
          exam_type?: string | null;
          year?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          type?: ExamType;
          tag?: ExamTag;
          course_id?: string | null;
          subject_id?: string | null;
          duration_minutes?: number;
          question_count?: number;
          is_premium?: boolean;
          price?: number | null;
          show_explanations?: boolean;
          review_enabled?: boolean;
          re_attempts_enabled?: boolean;
          status?: ExamStatus;
          schedule_start?: string | null;
          schedule_end?: string | null;
          free?: boolean;
          exam_type?: string | null;
          year?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exams_subject_id_fkey",
            columns: ["subject_id"],
            isOneToOne: false,
            referencedRelation: "subjects",
            referencedColumns: ["id"],
          },
          {
            foreignKeyName: "exams_course_id_fkey",
            columns: ["course_id"],
            isOneToOne: false,
            referencedRelation: "courses",
            referencedColumns: ["id"],
          },
        ];
      };
      exam_questions: {
        Row: {
          id: string;
          exam_id: string;
          question_id: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          exam_id: string;
          question_id: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          exam_id?: string;
          question_id?: string;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      attempts: {
        Row: {
          id: string;
          user_id: string;
          exam_id: string;
          score: number | null;
          total: number | null;
          answers: Json;
          started_at: string;
          submitted_at: string | null;
          duration_seconds: number | null;
          flagged: Json;
          status: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_id: string;
          score?: number | null;
          total?: number | null;
          answers?: Json;
          started_at?: string;
          submitted_at?: string | null;
          duration_seconds?: number | null;
          flagged?: Json;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_id?: string;
          score?: number | null;
          total?: number | null;
          answers?: Json;
          started_at?: string;
          submitted_at?: string | null;
          duration_seconds?: number | null;
          flagged?: Json;
          status?: string;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          id: string;
          course_id: string | null;
          subject_id: string | null;
          title: string;
          file_url: string;
          is_premium: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id?: string | null;
          subject_id?: string | null;
          title: string;
          file_url: string;
          is_premium?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string | null;
          subject_id?: string | null;
          title?: string;
          file_url?: string;
          is_premium?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      past_papers: {
        Row: {
          id: string;
          subject_id: string;
          exam_type: string;
          year: number;
          file_url: string | null;
          extracted: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          exam_type: string;
          year: number;
          file_url?: string | null;
          extracted?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          exam_type?: string;
          year?: number;
          file_url?: string | null;
          extracted?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      packages: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          package_id: string | null;
          exam_id: string | null;
          paystack_reference: string;
          amount: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id?: string | null;
          exam_id?: string | null;
          paystack_reference: string;
          amount: number;
          status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string | null;
          exam_id?: string | null;
          paystack_reference?: string;
          amount?: number;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      telegram_groups: {
        Row: {
          id: string;
          level_id: string | null;
          course_id: string | null;
          subject_id: string | null;
          invite_link: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          level_id?: string | null;
          course_id?: string | null;
          subject_id?: string | null;
          invite_link: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          level_id?: string | null;
          course_id?: string | null;
          subject_id?: string | null;
          invite_link?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
