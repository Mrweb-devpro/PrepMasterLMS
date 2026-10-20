import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAdmin } from "../middleware/auth.js";
import * as course from "../services/course.service.js";
import type { AppEnv } from "../models/types.js";
import { createCourseBody, idParam, materialBody, subfolderBody, updateMaterialBody, uploadBody } from "../validators/schemas.js";

export const catalogController = new Hono<AppEnv>()
  .get("/", async (c) => c.json(await course.catalog(c.get("user").id, c.get("user").role === "admin")));

export const coursesController = new Hono<AppEnv>()
  .use(requireAdmin)
  .post("/", zValidator("json", createCourseBody), async (c) => c.json(await course.createCourse(c.req.valid("json")), 201))
  .delete("/:id", zValidator("param", idParam), async (c) => c.json(await course.deleteCourse(c.req.valid("param").id)))
  .post("/:id/subfolders", zValidator("param", idParam), zValidator("json", subfolderBody), async (c) =>
    c.json(await course.addSubfolder(c.req.valid("param").id, c.req.valid("json")), 201))
  .post("/:id/uploads", zValidator("param", idParam), zValidator("json", uploadBody), async (c) => {
    const { fileName, contentType } = c.req.valid("json");
    return c.json(await course.prepareUpload(c.req.valid("param").id, fileName, contentType));
  })
  .post("/:id/materials", zValidator("param", idParam), zValidator("json", materialBody), async (c) =>
    c.json(await course.addMaterial({ courseId: c.req.valid("param").id, ...c.req.valid("json") }), 201));

export const materialsController = new Hono<AppEnv>()
  .get("/:id/download", zValidator("param", idParam), async (c) => {
    const u = c.get("user");
    return c.json(await course.getDownloadLink(c.req.valid("param").id, u.id, u.role === "admin"));
  })
  .patch("/:id", requireAdmin, zValidator("param", idParam), zValidator("json", updateMaterialBody), async (c) =>
    c.json(await course.updateMaterial(c.req.valid("param").id, c.req.valid("json"))))
  .delete("/:id", requireAdmin, zValidator("param", idParam), async (c) =>
    c.json(await course.deleteMaterial(c.req.valid("param").id)));
