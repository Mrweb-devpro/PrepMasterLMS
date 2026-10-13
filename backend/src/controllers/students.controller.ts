import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import * as student from "../services/student.service.js";
import type { AppEnv } from "../models/types.js";
import { idParam, moderationBody, restoreBody, swRegisterBody, updateMeBody } from "../validators/schemas.js";

export const meController = new Hono<AppEnv>()
  .get("/", async (c) => c.json({ ...(await student.me(c.get("user").id)), role: c.get("user").role }))
  .patch("/", zValidator("json", updateMeBody), async (c) => c.json(await student.updateMe(c.get("user").id, c.req.valid("json"))))
  .post("/solidworks", zValidator("json", swRegisterBody), async (c) => {
    const { userType, heard } = c.req.valid("json");
    return c.json(await student.swRegister(c.get("user").id, userType, heard));
  })
  .get("/library", async (c) => c.json(await student.library(c.get("user").id)))
  .get("/payments", async (c) => c.json(await student.myPayments(c.get("user").id)));

export const adminStudentsController = new Hono<AppEnv>()
  .use(requireAdmin)
  .get("/stats", async (c) => c.json(await student.stats()))
  .get("/", zValidator("query", z.object({ search: z.string().max(100).optional() })), async (c) =>
    c.json(await student.listStudents(c.req.valid("query").search)))
  .get("/:id", zValidator("param", idParam), async (c) => c.json(await student.getStudent(c.req.valid("param").id)))
  .post("/suspend", zValidator("json", moderationBody), async (c) => {
    const { ids, reason } = c.req.valid("json");
    return c.json(await student.suspend(ids, reason));
  })
  .post("/restore", zValidator("json", restoreBody), async (c) => c.json(await student.restore(c.req.valid("json").ids)))
  .post("/warn", zValidator("json", moderationBody), async (c) => {
    const { ids, reason } = c.req.valid("json");
    return c.json(await student.warn(ids, reason, c.get("user").id), 201);
  });
