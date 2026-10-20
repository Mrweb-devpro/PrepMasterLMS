export type Role = "student" | "admin";
export type UserType = "student" | "freelancer";
export type Provider = "email" | "google";
export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export interface AccountWarning {
  id: string;
  reason: string;
  created_at: string;
}

/** One shape for every user — students, SolidWorks-only users and admins alike. */
export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  provider: Provider;
  gender?: Gender;
  avatarUrl?: string;
  emailVerified: boolean;
  school?: string;
  faculty?: string;
  course?: string;
  level?: string;
  dob?: string;
  heard?: string;
  userType?: UserType;
  swRegistered: boolean;
  joinedAt: string;
  warnings?: AccountWarning[];
}
