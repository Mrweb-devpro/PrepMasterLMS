import type { Profile } from "../types";

/** Demo users for the "Viewing as" switcher. Removed once real sign-in exists. */
const dane: Profile = {
  id: "stu-001",
  firstName: "Dane",
  lastName: "Okonkwo",
  email: "dane.okonkwo@unilag.edu.ng",
  role: "student",
  provider: "email",
  emailVerified: true,
  faculty: "Engineering",
  course: "Mechanical Engineering",
  level: "300",
  heard: "youtube",
  userType: "student",
  swRegistered: false,
  joinedAt: "2026-06-12T09:00:00Z",
};

export const PERSONAS = {
  guest: { label: "Signed out", hint: "New visitor", profile: null },
  student: { label: "Dane — student", hint: "Main app only", profile: dane },
  swStudent: {
    label: "Dane — student + SolidWorks",
    hint: "Both apps",
    profile: { ...dane, swRegistered: true },
  },
  freelancer: {
    label: "Tobi — freelancer",
    hint: "SolidWorks only, no student details",
    profile: {
      id: "usr-tobi",
      firstName: "Tobi",
      lastName: "Adeyemi",
      email: "tobi.designs@gmail.com",
      role: "student",
      provider: "email",
      emailVerified: true,
      heard: "youtube",
      userType: "freelancer",
      swRegistered: true,
      joinedAt: "2026-09-02T09:00:00Z",
    },
  },
  google: {
    label: "Amaka — new Google sign-up",
    hint: "Setup not finished",
    profile: {
      id: "usr-amaka",
      firstName: "Amaka",
      lastName: "Eze",
      email: "amaka.eze@gmail.com",
      role: "student",
      provider: "google",
      emailVerified: true,
      swRegistered: false,
      joinedAt: "2026-10-10T09:00:00Z",
    },
  },
  admin: {
    label: "Admin",
    hint: "PrepMaster admin",
    profile: {
      id: "adm-001",
      firstName: "Mr",
      lastName: "PrepMaster",
      email: "admin@prepmaster.com",
      role: "admin",
      provider: "email",
      emailVerified: true,
      swRegistered: false,
      joinedAt: "2026-01-01T09:00:00Z",
    },
  },
} satisfies Record<string, { label: string; hint: string; profile: Profile | null }>;

export type PersonaKey = keyof typeof PERSONAS;
export const DEFAULT_PERSONA: PersonaKey = "student";
