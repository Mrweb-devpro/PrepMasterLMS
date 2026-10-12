import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAdmin } from "../middleware/auth.js";
import * as cbt from "../services/cbt.service.js";
import type { AppEnv } from "../models/types.js";
import { createCbtBody, idParam, saveAnswerBody, updateCbtBody } from "../validators/schemas.js";

// Controllers only read the request, call a service, and send the response.

export const cbtsController = new Hono<AppEnv>()
  .post("/:id/start", zValidator("param", idParam), async (c) =>
    c.json(await cbt.startAttempt(c.req.valid("param").id, c.get("user").id)))
  .post("/admin", requireAdmin, zValidator("json", createCbtBody), async (c) =>
    c.json(await cbt.createCbt(c.req.valid("json")), 201))
  .get("/admin/:id", requireAdmin, zValidator("param", idParam), async (c) =>
    c.json(await cbt.adminGetCbt(c.req.valid("param").id)))
  .patch("/admin/:id", requireAdmin, zValidator("param", idParam), zValidator("json", updateCbtBody), async (c) =>
    c.json(await cbt.updateCbt(c.req.valid("param").id, c.req.valid("json"))))
  .delete("/admin/:id", requireAdmin, zValidator("param", idParam), async (c) =>
    c.json(await cbt.deleteCbt(c.req.valid("param").id)));

export const attemptsController = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await cbt.myAttempts(c.get("user").id)))
  .put("/:id/answers", zValidator("param", idParam), zValidator("json", saveAnswerBody), async (c) => {
    const { questionId, selectedIndex } = c.req.valid("json");
    return c.json(await cbt.saveAnswer(c.req.valid("param").id, c.get("user").id, questionId, selectedIndex));
  })
  .post("/:id/submit", zValidator("param", idParam), async (c) =>
    c.json(await cbt.submitAttempt(c.req.valid("param").id, c.get("user").id)))
  .get("/:id/result", zValidator("param", idParam), async (c) =>
    c.json(await cbt.getResult(c.req.valid("param").id, c.get("user").id)));
