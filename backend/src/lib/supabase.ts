import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/** Service-role client. Server only — bypasses RLS, so every service checks ownership itself. */
export const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
