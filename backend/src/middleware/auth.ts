import { createMiddleware } from "hono/factory";
import { db } from "../lib/supabase.js";
import { forbidden, unauthorized } from "../lib/errors.js";
import type { AppEnv } from "../models/types.js";

/** Verifies the Supabase login token sent by the app and loads the user's role. */
export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const token = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw unauthorized();

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw unauthorized("Your session has expired. Please sign in again.");

  const [{ data: profile }, { data: roles }] = await Promise.all([
    db.from("profiles").select("suspended_at, suspend_reason").eq("id", data.user.id).maybeSingle(),
    db.from("user_roles").select("role").eq("user_id", data.user.id),
  ]);
  const isAdmin = roles?.some((r) => r.role === "admin") ?? false;
  if (profile?.suspended_at && !isAdmin) {
    throw forbidden(`Your account is suspended: ${profile.suspend_reason ?? "contact support"}`);
  }

  c.set("user", { id: data.user.id, email: data.user.email ?? "", role: isAdmin ? "admin" : "student" });
  await next();
});

export const requireAdmin = createMiddleware<AppEnv>(async (c, next) => {
  if (c.get("user").role !== "admin") throw forbidden("Admins only.");
  await next();
});
