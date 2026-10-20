import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import * as student from "../services/student.service.js";
import { checkEmailBody } from "../validators/schemas.js";

/** Public registration helpers. These routes must not require a session. */
export const authController = new Hono().post(
  "/check-email",
  zValidator("json", checkEmailBody),
  async (c) => {
    const { email } = c.req.valid("json");
    const available = await student.isEmailAvailable(email);
    return c.json({ available, inUse: !available });
  },
);
