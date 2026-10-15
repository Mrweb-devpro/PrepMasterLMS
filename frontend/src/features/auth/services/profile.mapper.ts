import type { AccountWarning, Profile } from "../types";

/** Row shape returned by GET /v1/me. */
export interface ApiProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  provider: string;
  faculty: string | null;
  department: string | null;
  level: string | null;
  dob: string | null;
  heard: string | null;
  user_type: "student" | "freelancer" | null;
  sw_registered: boolean;
  created_at: string;
}

export interface MeResponse {
  profile: ApiProfile;
  role: "admin" | "student";
  warnings: AccountWarning[];
}

export function toProfile(me: MeResponse, emailVerified = true): Profile {
  const p = me.profile;
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email,
    role: me.role,
    provider: p.provider === "google" ? "google" : "email",
    emailVerified,
    swRegistered: p.sw_registered,
    joinedAt: p.created_at,
    warnings: me.warnings ?? [],
    ...(p.faculty ? { faculty: p.faculty } : {}),
    ...(p.department ? { course: p.department } : {}),
    ...(p.level ? { level: p.level } : {}),
    ...(p.dob ? { dob: p.dob } : {}),
    ...(p.heard ? { heard: p.heard } : {}),
    ...(p.user_type ? { userType: p.user_type } : {}),
  };
}

/** Frontend profile fields -> PATCH /v1/me body. Unknown keys are dropped. */
export function toProfilePatch(p: Partial<Profile>) {
  const out: {
    firstName?: string; lastName?: string; faculty?: string | null; department?: string | null;
    level?: string | null; dob?: string | null; heard?: string | null; userType?: string | null;
  } = {};
  if (p.firstName !== undefined) out.firstName = p.firstName;
  if (p.lastName !== undefined) out.lastName = p.lastName;
  if (p.faculty !== undefined) out.faculty = p.faculty || null;
  if (p.course !== undefined) out.department = p.course || null;
  if (p.level !== undefined) out.level = p.level || null;
  if (p.dob !== undefined) out.dob = p.dob || null;
  if (p.heard !== undefined) out.heard = p.heard || null;
  if (p.userType !== undefined) out.userType = p.userType || null;
  return out;
}
