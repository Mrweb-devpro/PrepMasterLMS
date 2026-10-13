// One switch for the whole app: when these env values are set, every service
// talks to the real backend; when they're missing, the dummy data is used.
//
//   VITE_API_URL=http://localhost:4000/v1
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJ...   (the public "anon" key — safe in the browser)

export const API_URL = (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";
export const SUPABASE_URL = (import.meta.env["VITE_SUPABASE_URL"] as string | undefined) ?? "";
export const SUPABASE_ANON_KEY =
  (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined) ??
  (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
  "";

/** true = real backend, false = dummy data. */
export const LIVE = Boolean(API_URL && SUPABASE_URL && SUPABASE_ANON_KEY);
