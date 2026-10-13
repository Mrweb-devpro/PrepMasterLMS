# Connecting the PrepMaster frontend to the backend

This guide walks through **auth** from start to finish as the worked example. Once it works, use the same steps for courses, CBTs, payments and the rest.

---

## 0. Two things to know first

1. **This app is not Next.js.** It uses React 19 with **TanStack Start** (router + server functions) and **TanStack Query** (data fetching).
   | Next.js | Here |
   |---|---|
   | `app/page.tsx` | `src/routes/*.tsx` (file routes) |
   | Server Components / `fetch` in page | Route `loader` + `ensureQueryData` |
   | Server Actions / `"use server"` | `createServerFn` |
   | `middleware.ts` redirects | Route `beforeLoad` + `redirect()` |
   | `next/navigation` | `useNavigate`, `<Link>` from `@tanstack/react-router` |
   | `<head>` metadata | route `head()` |
2. **Sign-in doesn't go through Hono.** The browser talks to **Supabase Auth** directly (sign up, sign in, sign out, reset password). Supabase returns a **token** (JWT). Every request to Hono sends `Authorization: Bearer <token>`. Hono's `requireAuth` checks it, and `GET /v1/me` returns the profile and role.

```text
Browser ──signIn──▶ Supabase Auth ──token──▶ Browser
Browser ──GET /v1/me + Bearer token──▶ Hono ──verify──▶ Supabase
```

---

## 1. Setup

### Packages
```bash
bun add @supabase/supabase-js zod react-hook-form @hookform/resolvers
```
(`@tanstack/react-query` and `sonner` are already installed.)

### Environment (`.env` at the project root)
```bash
VITE_API_URL=http://localhost:4000/v1
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...   # anon/public key ONLY
```
- Anything starting with `VITE_` ends up in the browser bundle, so it is **public**.
- **Never** put `SUPABASE_SERVICE_ROLE_KEY`, R2 or Paystack secrets in the frontend. Those belong in `backend/.env` only.

### Folder layout
```text
src/lib/
  supabase.ts          # browser Supabase client
  api/
    client.ts          # apiFetch + ApiError (the ONE place that calls fetch)
    types.ts           # response types (mirror backend/src/models/types.ts)
    me.ts              # api functions per resource: getMe(), updateMe()
    queries.ts         # queryOptions factories + query keys
src/hooks/
  use-auth.tsx         # AuthProvider + useAuth()
  use-me.ts            # useMe(), useUpdateMe()
```
Rule: **components never call `fetch` directly.** Component → hook → api function → `apiFetch`.

---

## 2. The Supabase browser client

```ts
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } },
);
```
Supabase keeps the session in `localStorage` and refreshes the token on its own.

---

## 3. One API client

```ts
// src/lib/api/client.ts
import { supabase } from "@/lib/supabase";

const BASE_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();       // always the fresh token
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const body = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(res.status, body?.error?.message ?? body?.message ?? "Something went wrong", body?.error?.code);
  }
  return body as T;
}
```
Check `backend/src/middleware/error.ts` for the exact error shape and match it here.

**How to handle each status code**
| Status | Meaning | Frontend reaction |
|---|---|---|
| 400/422 | Bad input | Show the message next to the form |
| 401 | Token missing or expired | `supabase.auth.signOut()` → go to `/login` |
| 403 | Suspended or not an admin | Show the message (it contains the suspension reason) |
| 404 | Not found | `notFound()` / an empty state |
| 5xx / network | Server problem | Toast "Try again", let Query retry |

---

## 4. Auth example, step by step

### 4.1 Types
```ts
// src/lib/api/types.ts
export type Role = "admin" | "student";
export interface Me {
  id: string; email: string; full_name: string | null; role: Role;
  suspended_at: string | null;
}
```

### 4.2 API functions (no React here)
```ts
// src/lib/api/me.ts
import { apiFetch } from "./client";
import type { Me } from "./types";

export const getMe = () => apiFetch<Me>("/me");
export const updateMe = (input: { full_name: string }) =>
  apiFetch<Me>("/me", { method: "PATCH", body: JSON.stringify(input) });
```

### 4.3 Query keys + queryOptions
```ts
// src/lib/api/queries.ts
import { queryOptions } from "@tanstack/react-query";
import { getMe } from "./me";

export const qk = {
  me: ["me"] as const,
  courses: ["courses"] as const,
  course: (slug: string) => ["courses", slug] as const,
  cbt: (id: string) => ["cbts", id] as const,
};

export const meQuery = () =>
  queryOptions({ queryKey: qk.me, queryFn: getMe, staleTime: 5 * 60_000 });
```
Writing `queryOptions` once means the loader and the component share the same key and fetcher.

### 4.4 AuthProvider: the session lives in Context
```tsx
// src/hooks/use-auth.tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext<{ session: Session | null; ready: boolean }>({ session: null, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_OUT") qc.clear();                 // wipe the previous user's data
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") router.invalidate();
    });
    return () => sub.subscription.unsubscribe();
  }, [qc, router]);

  return <AuthContext.Provider value={{ session, ready }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
```
Mount it in `src/routes/__root.tsx`, **inside** `QueryClientProvider`. You can drop `PrepProvider` once everything is real.

**Why `useState` here?** The session is client-only UI state that Supabase tells us about. The **profile** (`/me`) is server data, so it goes in Query, not in state.

### 4.5 Sign in / sign up / sign out / forgot password, with `useMutation`
```tsx
// in src/routes/login.tsx
const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

function LoginPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const signIn = useMutation({
    mutationFn: async (v: z.infer<typeof schema>) => {
      const { error } = await supabase.auth.signInWithPassword(v);
      if (error) throw error;
      return qc.fetchQuery(meQuery());                       // load the profile + role
    },
    onSuccess: (me) => navigate({ to: me.role === "admin" ? "/admin" : "/" }),
    onError: (e) => toast.error(e.message),
  });

  return (
    <form onSubmit={form.handleSubmit((v) => signIn.mutate(v))}>
      {/* inputs with {...form.register("email")} and the error text */}
      <Button disabled={signIn.isPending}>{signIn.isPending ? "Signing in…" : "Sign in"}</Button>
    </form>
  );
}
```
The others follow the same pattern:
```ts
supabase.auth.signUp({ email, password, options: { data: { full_name } } }); // the trigger creates the profile
supabase.auth.signOut();                                                     // the listener clears the cache
supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/reset-password` });
supabase.auth.updateUser({ password });                                      // on /reset-password
```
`isPending`, `error` and `onSuccess` all come from `useMutation`. **Don't** build your own `const [loading, setLoading] = useState(false)`.

### 4.6 Reading the current user
```ts
// src/hooks/use-me.ts
export function useMe() {
  const { session } = useAuth();
  return useQuery({ ...meQuery(), enabled: !!session });   // don't call /me when signed out
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateMe,
    onSuccess: (me) => qc.setQueryData(qk.me, me),          // update the cache right away
  });
}
```
Use it anywhere, for example `const { data: me } = useMe();` in the sidebar to show the name and initials.

### 4.7 Protecting pages
Signed-in pages render **in the browser only**, because the token is in `localStorage` and the server can't see it. Use a pathless layout:

```tsx
// src/routes/_authenticated/route.tsx
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: () => <Outlet />,
});

// src/routes/_authenticated/admin/route.tsx
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(meQuery());
    if (me.role !== "admin") throw redirect({ to: "/" });
  },
  component: () => <Outlet />,
});
```
Then move protected routes under `_authenticated/` (the URLs don't change). Remember: **the route guard is just for the user experience. The real protection is Hono's `requireAuth` / `requireAdmin`.**

### 4.8 Swapping the mock store out, one piece at a time
`usePrep()` currently returns mock `name`, `email` and so on. Swap one value at a time:
```ts
const { data: me } = useMe();
const name = me?.full_name ?? "";
```
Keep the app working after each swap. Don't rewrite everything in one go.

---

## 5. Which tool, when

| Situation | Use |
|---|---|
| Read server data on a page | `useQuery` (or `useSuspenseQuery` if a loader already warmed the cache) |
| Data a page *needs* before it shows | Route `loader`: `context.queryClient.ensureQueryData(xQuery())` + `useSuspenseQuery(xQuery())` |
| Nice-to-have data | `prefetchQuery` in the loader (not awaited) + `useQuery` |
| Create / update / delete | `useMutation` + `invalidateQueries` (or `setQueryData`) in `onSuccess` |
| Instant feedback (CBT answer autosave) | `useMutation` with `onMutate` optimistic update + rollback in `onError` |
| Long lists (admin students, payments) | `useInfiniteQuery`, or page/search values in the URL (`validateSearch`) and in the query key |
| Request depends on another value | `enabled: !!value` |
| Open modal, selected tab, form draft | `useState` |
| Search box filtering a big list | `useDeferredValue(search)` |
| Slow UI change (e.g. switching a heavy tab) | `useTransition`. Not for fetching; Query already handles loading |
| Auth session, theme | React Context |
| Global client state (Zustand/Redux) | **Probably never.** Server data lives in the Query cache. Reach for Zustand only if you end up with lots of shared *client-only* state |
| Calling Hono | Directly from the browser via `apiFetch` |
| `createServerFn` | Only for things that must hide a secret *inside this app* (e.g. the current AI insights). Not a proxy to Hono |

### Server-side rendering rules
- **Public pages** (landing, course catalogue) can render on the server: the loader calls a public endpoint, and `head()` gets SEO tags.
- **Signed-in pages** use `ssr: false` (as shown above). Trying to render them on the server causes redirect loops.
- Loaders run on **both** server and client. Never put secrets in them.

---

## 6. Best practices

**Query keys**: arrays, from broad to specific: `["courses"]`, `["courses", slug]`, `["cbts", id, "attempt"]`. Invalidating `["courses"]` refreshes everything under it.

**QueryClient defaults** (in `src/router.tsx`):
```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2, // never retry 4xx
      refetchOnWindowFocus: false,
    },
  },
});
```

**`staleTime` guide**: profile 5 min · course list 5 min · CBT list 1 min · active attempt `0` · payment status: poll with `refetchInterval` until it's settled.

**Forms**: zod schema + react-hook-form. Validate on the client for the user's benefit; the backend validates again (zod in `validators/`) for security.

**Loading/error UI**: every query has 3 states. Use skeletons for loading, a friendly message plus "Try again" (`refetch()`) for errors, and empty states for empty lists.

**Never trust the browser**:
- Prices: send only the `item_id` to `/payments/checkout`. The server looks up the amount.
- Timers: show `deadline` from the server; don't compute your own end time. When the server says expired, show expired.
- Paid unlocks: after Paystack redirects back, **poll** `GET /payments/:reference` until `success`. Don't unlock just because the user landed on the success page.
- Correct answers never come before submit, so don't build UI that expects them.

**Mutations**: always handle `onError` (toast). Disable buttons while `isPending` so nobody double-submits.

**Types**: copy the backend's `models/types.ts` shapes into `src/lib/api/types.ts`. When the backend changes, update the types first and let TypeScript show you what broke.

**CORS**: if the browser shows a CORS error, add the frontend URL to `CORS_ORIGINS` in `backend/.env`.

**Debugging**: open DevTools → Network, click the request, and check the URL, the `Authorization` header and the response body. Optionally install `@tanstack/react-query-devtools` to look inside the cache.

---

## 7. Checklist for every new endpoint

1. ☐ Read the controller and service in `backend/src/` and note the path, method, input and response.
2. ☐ Add/confirm the type in `src/lib/api/types.ts`.
3. ☐ Add the api function in `src/lib/api/<resource>.ts` using `apiFetch`.
4. ☐ Add the key in `qk` and a `queryOptions` factory (reads) **or** a `useMutation` hook (writes).
5. ☐ Use it in the page. Loader + `useSuspenseQuery` if the page needs it before showing.
6. ☐ Handle loading, error and empty states.
7. ☐ After writes, invalidate or update the right keys (list **and** detail).
8. ☐ Remove the matching mock data / `usePrep` value.
9. ☐ Test it: as a student, as an admin, signed out, and suspended.

Suggested order: **auth → courses/drive → materials download → CBT list → attempt (start/autosave/submit/result) → library → payments → admin pages.**
