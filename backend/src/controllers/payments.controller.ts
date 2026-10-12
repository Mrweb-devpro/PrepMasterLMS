import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { isValidSignature } from "../lib/paystack.js";
import { requireAdmin } from "../middleware/auth.js";
import * as payment from "../services/payment.service.js";
import type { AppEnv } from "../models/types.js";
import { checkoutBody, referenceParam } from "../validators/schemas.js";

export const paymentsController = new Hono<AppEnv>()
  .post("/checkout", zValidator("json", checkoutBody), async (c) => {
    const { itemType, itemId, callbackUrl } = c.req.valid("json");
    return c.json(await payment.checkout(c.get("user"), itemType, itemId, callbackUrl));
  })
  .get("/admin/all", requireAdmin, async (c) => c.json(await payment.listAll()))
  .get("/:reference", zValidator("param", referenceParam), async (c) =>
    c.json(await payment.status(c.req.valid("param").reference, c.get("user").id)))
  .post("/:reference/verify", zValidator("param", referenceParam), async (c) =>
    c.json(await payment.verify(c.req.valid("param").reference, c.get("user").id)));

/** Public: Paystack calls this. The signature check is the security boundary. */
export const paystackWebhook = new Hono().post("/", async (c) => {
  const raw = await c.req.text();
  if (!isValidSignature(raw, c.req.header("x-paystack-signature"))) return c.json({ error: "Invalid signature" }, 401);
  const event = JSON.parse(raw) as { event: string; data: { reference: string } };
  if (event.event === "charge.success") await payment.confirm(event.data.reference).catch((e) => console.error(e));
  return c.json({ received: true });
});
