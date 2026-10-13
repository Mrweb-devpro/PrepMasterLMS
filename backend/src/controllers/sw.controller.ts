import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAdmin } from "../middleware/auth.js";
import * as sw from "../services/sw.service.js";
import type { AppEnv } from "../models/types.js";
import {
  idParam, swGradeBody, swQuestionBody, swQuestionPatchBody, swResponseBody, swSubmissionBody, swTaskBody, uploadBody,
} from "../validators/schemas.js";

const mineQuery = z.object({ mine: z.enum(["true", "false"]).optional() });

export const swController = new Hono<AppEnv>()
  // Tasks
  .get("/tasks", async (c) => c.json(await sw.listTasks()))
  .get("/tasks/:id", zValidator("param", idParam), async (c) => c.json(await sw.getTask(c.req.valid("param").id)))
  .post("/tasks", requireAdmin, zValidator("json", swTaskBody), async (c) => c.json(await sw.createTask(c.req.valid("json")), 201))
  .put("/tasks/:id", requireAdmin, zValidator("param", idParam), zValidator("json", swTaskBody), async (c) =>
    c.json(await sw.updateTask(c.req.valid("param").id, c.req.valid("json"))))
  .delete("/tasks/:id", requireAdmin, zValidator("param", idParam), async (c) => c.json(await sw.deleteTask(c.req.valid("param").id)))
  // Submissions
  .post("/uploads", zValidator("json", uploadBody), async (c) => {
    const { fileName, contentType } = c.req.valid("json");
    return c.json(await sw.prepareUpload(c.get("user").id, fileName, contentType));
  })
  .get("/submissions", zValidator("query", mineQuery), async (c) =>
    c.json(await sw.listSubmissions(c.get("user"), c.req.valid("query").mine === "true")))
  .post("/submissions", zValidator("json", swSubmissionBody), async (c) =>
    c.json(await sw.createSubmission(c.get("user").id, c.req.valid("json")), 201))
  .get("/submissions/:id", zValidator("param", idParam), async (c) => c.json(await sw.getSubmission(c.req.valid("param").id, c.get("user"))))
  .post("/submissions/:id/grade", requireAdmin, zValidator("param", idParam), zValidator("json", swGradeBody), async (c) =>
    c.json(await sw.gradeSubmission(c.req.valid("param").id, c.req.valid("json"))))
  // Questions
  .get("/questions", zValidator("query", mineQuery), async (c) =>
    c.json(await sw.listQuestions(c.get("user"), c.req.valid("query").mine === "true")))
  .post("/questions", zValidator("json", swQuestionBody), async (c) => c.json(await sw.createQuestion(c.get("user").id, c.req.valid("json")), 201))
  .get("/questions/:id", zValidator("param", idParam), async (c) => c.json(await sw.getQuestion(c.req.valid("param").id, c.get("user"))))
  .patch("/questions/:id", zValidator("param", idParam), zValidator("json", swQuestionPatchBody), async (c) =>
    c.json(await sw.updateQuestion(c.req.valid("param").id, c.get("user"), c.req.valid("json"))))
  .post("/questions/:id/responses", requireAdmin, zValidator("param", idParam), zValidator("json", swResponseBody), async (c) =>
    c.json(await sw.respond(c.req.valid("param").id, c.get("user").id, c.req.valid("json").body), 201))
  // Members
  .get("/members", requireAdmin, async (c) => c.json(await sw.listMembers()));
