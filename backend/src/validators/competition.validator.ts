import { competitionBody } from "./schemas.js";

export const updateCompetitionSchema = competitionBody.partial().strict().refine(
  (value) => Object.keys(value).length > 0,
  "Choose a setting to update.",
);
