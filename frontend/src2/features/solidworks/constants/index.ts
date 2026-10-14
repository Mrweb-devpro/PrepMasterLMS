import type { Difficulty } from "../types";

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "super-hard", label: "Super hard" },
];
export const difficultyLabel = (d: Difficulty) =>
  DIFFICULTIES.find((x) => x.value === d)?.label ?? d;

/** Grading scale: mass + volume + model = 100. */
export const MAX_SCORES = { mass: 30, volume: 30, model: 40 } as const;
export const SCORE_LABELS = { mass: "Mass", volume: "Volume", model: "Model & files" } as const;

export const PREMIUM_PERKS = [
  { title: "Direct contact with Mr PrepMaster", text: "Message the instructor directly." },
  { title: "One-on-one tutorials", text: "Book private sessions on your problem areas." },
  { title: "Priority review", text: "Your submissions and questions jump the queue." },
];
