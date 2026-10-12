import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { routes } from "./routes/index.js";

export const app = new Hono()
  .use(logger())
  .use(secureHeaders()) // Hono's built-in equivalent of Helmet
  .use("/v1/*", cors({ origin: env.CORS_ORIGINS.split(",").map((o) => o.trim()), allowHeaders: ["Authorization", "Content-Type"] }))
  .route("/v1", routes)
  .notFound((c) => c.json({ error: "Not found." }, 404))
  .onError(errorHandler);
