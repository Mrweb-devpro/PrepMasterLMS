import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** Browser-only auth client (sign in, sign up, Google, session tokens). Data goes through the API. */
export function supabase(): SupabaseClient {
  if (typeof window === "undefined") throw new Error("Auth is only available in the browser");
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}
