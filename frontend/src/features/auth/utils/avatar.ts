import type { Gender } from "../types";
export type { Gender } from "../types";

const SHORT_HAIR = Array.from({ length: 16 }, (_, i) => `short${String(i + 1).padStart(2, "0")}`).join(",");
const LONG_HAIR = Array.from({ length: 20 }, (_, i) => `long${String(i + 1).padStart(2, "0")}`).join(",");
// DiceBear's avatar palette, independent of the app's UI theme.
const BG_COLORS = "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf";

export function generateAvatarUrl(gender?: Gender | null, seed?: string): string {
  const params = new URLSearchParams({ seed: seed || crypto.randomUUID(), backgroundColor: BG_COLORS });
  if (gender === "male") params.set("hair", SHORT_HAIR);
  if (gender === "female") params.set("hair", LONG_HAIR);
  return `https://api.dicebear.com/9.x/adventurer/svg?${params}`;
}

export const buildAdventurerAvatar = generateAvatarUrl;
