import { Hono } from "hono";
import { attemptsController, cbtsController } from "../controllers/cbts.controller.js";
import { catalogController, coursesController, materialsController } from "../controllers/courses.controller.js";
import { paymentsController, paystackWebhook } from "../controllers/payments.controller.js";
import { adminStudentsController, meController } from "../controllers/students.controller.js";
import { swController } from "../controllers/sw.controller.js";
import { requireAuth } from "../middleware/auth.js";
import type { AppEnv } from "../models/types.js";

const protectedRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .route("/me", meController)
  .route("/catalog", catalogController)
  .route("/courses", coursesController)
  .route("/materials", materialsController)
  .route("/cbts", cbtsController)
  .route("/attempts", attemptsController)
  .route("/payments", paymentsController)
  .route("/solidworks", swController)
  .route("/admin/students", adminStudentsController);

export const routes = new Hono()
  .get("/health", (c) => c.json({ ok: true, serverNow: new Date().toISOString() }))
  .route("/webhooks/paystack", paystackWebhook)
  .route("/", protectedRoutes);
