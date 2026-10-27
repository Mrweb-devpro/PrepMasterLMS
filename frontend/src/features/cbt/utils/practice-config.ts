export type PracticeFeedbackMode = "instant" | "review";

export interface PracticeConfig {
  questionCount: number | "all";
  timed: boolean;
  durationMinutes: number;
  feedback: PracticeFeedbackMode;
  shuffle: boolean;
  seed: number;
}

const keyFor = (cbtId: string) => `cbt_practice_config_${cbtId}`;

export function savePracticeConfig(cbtId: string, config: PracticeConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(cbtId), JSON.stringify(config));
}

export function getPracticeConfig(cbtId: string): PracticeConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(keyFor(cbtId));
    return value ? (JSON.parse(value) as PracticeConfig) : null;
  } catch {
    return null;
  }
}

export function clearPracticeConfig(cbtId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyFor(cbtId));
}

/** A deterministic shuffle keeps a chosen practice order stable after refresh. */
export function seededShuffle<T>(items: T[], seed: number) {
  const result = [...items];
  let state = seed >>> 0;
  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target]!, result[index]!];
  }
  return result;
}
