import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { AppEnv } from "../models/types.js";
import { competitionAnswerBody, competitionBody, idParam } from "../validators/schemas.js";
import { requireAdmin } from "../middleware/auth.js";
import * as competitions from "../services/competition.service.js";
import { updateCompetitionSchema } from "../validators/competition.validator.js";

export const competitionsController = new Hono<AppEnv>()
  .get("/", async (c) => c.json({ competitions: await competitions.listCompetitions(c.get("user").id, c.get("user").role === "admin") }))
  .patch("/admin/:id", requireAdmin, zValidator("param", idParam), zValidator("json", updateCompetitionSchema), async (c) =>
    c.json(await competitions.updateCompetition(c.req.valid("param").id, c.req.valid("json"))),
  )
  .post("/:id/register", zValidator("param", idParam), async (c) =>
    c.json(await competitions.registerForCompetition(c.req.valid("param").id, c.get("user").id)),
  )
  .post("/:id/enter", zValidator("param", idParam), async (c) =>
    c.json(await competitions.enterArena(c.req.valid("param").id, c.get("user").id)),
  )
  .put("/:id/answers", zValidator("param", idParam), zValidator("json", competitionAnswerBody), async (c) => {
    const body = c.req.valid("json");
    return c.json(await competitions.saveArenaAnswer(c.req.valid("param").id, c.get("user").id, body.questionId, body.selectedIndex));
  })
  .post("/:id/submit", zValidator("param", idParam), async (c) =>
    c.json(await competitions.submitArena(c.req.valid("param").id, c.get("user").id)),
  )
  .post("/admin", requireAdmin, zValidator("json", competitionBody), async (c) =>
    c.json(await competitions.createCompetition(c.req.valid("json")), 201),
  );
