import type { Profile } from "../types";

export const fullName = (p: Pick<Profile, "firstName" | "lastName">) =>
  `${p.firstName} ${p.lastName}`.trim();

export const initials = (p: Pick<Profile, "firstName" | "lastName">) =>
  `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase() || "?";

const NAME_FIELDS = ["firstName", "lastName"] as const;
const STUDY_FIELDS = ["faculty", "course", "level"] as const;

/** Fields still needed before the main PrepMaster dashboard opens. Admins skip this. */
export function missingMainFields(p: Profile) {
  if (p.role === "admin") return [];
  return [...NAME_FIELDS, ...STUDY_FIELDS].filter((k) => !p[k]);
}

export const isMainProfileComplete = (p: Profile) => missingMainFields(p).length === 0;

/** Light check used for the "use your student email" tip. */
export const looksLikeStudentEmail = (email: string) =>
  /\.(edu|ac)(\.[a-z]{2})?$|\.edu\.ng$|student/i.test(email);
