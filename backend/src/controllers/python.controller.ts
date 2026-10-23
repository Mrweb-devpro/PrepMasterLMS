import { Hono } from "hono";
import type { AppEnv } from "../models/types.js";
import * as python from "../services/python.service.js";

export const pythonController = new Hono<AppEnv>()
  .get("/waitlist/status", async (c) => c.json(await python.getWaitlistStatus(c.get("user").id)))
  .post("/waitlist", async (c) => {
    const result = await python.joinWaitlist(c.get("user").id);
    return c.json({
      success: true,
      alreadyJoined: result.alreadyJoined,
      message: result.alreadyJoined ? "Already on waitlist" : "Added to waitlist",
    });
  });
