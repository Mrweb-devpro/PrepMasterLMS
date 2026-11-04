import { competitionBody } from "./schemas.js";
import { z } from "zod";

export const updateCompetitionSchema = competitionBody.partial().extend({ endsAt: z.string().datetime().optional() }).strict().refine(
  (value) => Object.keys(value).length > 0,
  "Choose a setting to update.",
);
