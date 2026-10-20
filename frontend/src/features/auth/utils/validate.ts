import type { ProfileDraft } from "../components/fields";

/** Returns the first problem with a step, or null when it can continue. */
export const checks = {
  account: (d: ProfileDraft) =>
    !d.email || !/^\S+@\S+\.\S+$/.test(d.email)
      ? "Enter a valid email"
      : (d.password ?? "").length < 8
        ? "Password must be at least 8 characters"
        : null,
  names: (d: ProfileDraft) =>
    !d.firstName?.trim() || !d.lastName?.trim()
      ? "Enter your first and last name"
      : !d.gender
        ? "Select your gender"
        : null,
  study: (d: ProfileDraft) =>
    !d.faculty
        ? "Choose your faculty"
        : !d.course
          ? "Choose your department"
          : !d.level
            ? "Choose your level"
            : null,
  userType: (d: ProfileDraft) => (!d.userType ? "Tell us if you're a student or freelancer" : null),
};
