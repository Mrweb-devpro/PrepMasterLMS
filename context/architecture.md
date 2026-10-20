# PrepMaster — Architecture

Two apps in one repository: the **frontend** (TanStack Start, `src/`) and the **backend** (Hono on Node, `backend/`). They talk over HTTP through one API client.

```text
Browser (TanStack Start app)
  ├─ Supabase Auth (sign-in, session JWT)
  └─ API client (Bearer JWT) ──► Hono API (backend/) ──► Supabase Postgres (service role)
                                       ├─► Cloudflare R2 (presigned URLs)
                                       └─► Paystack (init / verify / webhook)
```

## Forbidden folders (never edit, delete or import from)

- `src2/` — frozen backup of an older UI.
- `old_src/` — frozen backup of an older UI.

## Repository layout

```text
/
├─ src/                    active frontend
│  ├─ routes/              thin TanStack file routes (render feature pages)
│  ├─ features/<feature>/  pages, components, hooks, services, constants, utils
│  │   admin, auth, catalog, cbt, drive, files, payments, solidworks
│  ├─ components/ui/       shadcn primitives
│  ├─ components/prep/     shells (StudentShell, AdminShell, AuthLayout), bits
│  ├─ components/layout/   AppSidebar, ThemeToggle
│  ├─ components/common/   ConfirmDialog
│  ├─ lib/api/             config.ts (LIVE flag), client.ts (fetch + JWT), supabase.ts
│  ├─ lib/ai/              *.server.ts + *.functions.ts (server fns, LOVABLE_API_KEY)
│  ├─ lib/                 prep-store, admin-store, mock-data, mock-api, theme, seo
│  ├─ assets/              images
│  └─ router.tsx, start.ts, server.ts, styles.css
├─ src2/, old_src/         FROZEN — never touch
├─ backend/                Hono API (own package.json, own .env)
├─ public/                 favicon, robots, samples/sample-notes.pdf
├─ context/                agent docs (this folder)
└─ SETUP.md, AGENTS.md, .env.example
```

## Frontend

- **Routing**: TanStack Router file routes. Dots = path segments (`admin.cbts.$cbtId.tsx` → `/admin/cbts/:cbtId`). `solidworks.tsx` is the SolidWorks layout (`<Outlet/>`); `solidworks_.register.tsx` escapes it. Never edit `routeTree.gen.ts`.
- **Data flow**: service → TanStack Query hook → page. Each service checks `LIVE` (`src/lib/api/config.ts`; true when `VITE_API_URL` + Supabase env exist) and calls the real API or dummy data. One code path for both modes.
- **Catalog**: courses/files/CBTs come from `GET /v1/catalog` via `useCatalog()`. Pages must not import mock arrays.
- **Session**: `src/features/auth/session.tsx` — Supabase Auth + `GET /v1/me` when LIVE; demo personas + "Viewing as" switcher otherwise. Guards in `features/auth/hooks/useGuards.ts`.
- **Avatars**: gender is required during registration and onboarding (`male`, `female`, `other`, or `prefer_not_to_say`) and can be updated in settings. Every new profile receives a deterministic DiceBear 9.x Adventurer URL based on its UUID, while the avatar editor can replace it with a shuffled gender-aware URL. `profiles.gender` and `profiles.avatar_url` persist through `PATCH /v1/me` (`gender`, `avatarUrl`). Apply the idempotent avatar upgrade block at the end of `backend/schema.sql` before deploying; it also backfills existing profiles without an avatar. Both settings pages share `AvatarEditor`; sidebar chips share `ProfileAvatar` with initials fallback. Profile updates return a success boolean after persistence, then update session state before navigation; dummy mode uses local session storage.
- **Student warnings**: `/v1/me` returns warning IDs, reasons and creation timestamps, mapped into `Profile.warnings`. `StudentShell` shows the latest warning at most once per document load. `pm_warning_<id>` stores `{ viewCount, acknowledged }`: display increments the count up to three; explicit acknowledgment permanently silences that warning in this browser. Escape, outside click and the close button dismiss without acknowledgment. Settings keeps the full history. If storage is blocked, automatic popups are skipped and history remains available. The warnings table has no resolved/active flag, so all issued warnings are included in history.
- **Password recovery**: preserve the Supabase session after updating the password. `useAuthActions().refreshSession` invalidates and fetches `["auth", "session"]`, then updates the session context before routing to `/` or `/onboarding` using `isMainProfileComplete`. Profile reload failures stay on the reset page and can be retried without updating the password again.
- **Email verification**: `/login` redirects once the session profile is hydrated, checking `isMainProfileComplete` before honoring the return path or admin destination. Unconfirmed email errors show a 12-second toast with spam guidance and a resend action tied to the attempted email. Expired, invalid, or already-used confirmation links route to `/login`, show dedicated guidance, and offer a resend action after the user enters their email. Expired reset links show the reset-page error card and a fresh-link action. Resent signup links return to `/login`.
- **Stores**: `prep-store.tsx` (owned items, attempts, purchases), `admin-store.tsx` (admin data).
- **CBT**: `features/cbt/hooks/useLiveAttempt.ts` — server deadline, autosave per answer, auto-submit at zero, resume on refresh. Question flags are persisted with submission as question IDs, then mapped to positions for the admin attempt history.
- **Files**: `features/drive/utils/files.ts` `loadViewable` → `/materials/:id/download` (signed URL) → `FileViewer`.
- **Payments**: `payments.api.ts` `startCheckout` (saves return path) → Paystack → `/payment/callback?reference=` → `POST /payments/:ref/verify`.
- **AI**: TanStack server functions in `src/lib/ai/` (only server code touches keys).

## Backend (`backend/src`)

```text
index.ts        Node server (@hono/node-server)
app.ts          Hono app: CORS, secure headers, error middleware, mounts /v1
config/env.ts   zod-validated env (loaded with tsx --env-file=.env)
lib/            supabase (service role), r2 (presign), paystack, errors
middleware/     auth.ts (requireAuth: verify Supabase JWT, load role; requireAdmin), error.ts
models/types.ts shared types
validators/     schemas.ts (zod bodies/params)
controllers/    HTTP only: courses, cbts, payments, students, sw
services/       ALL business rules + DB access: access, course, cbt, payment, student, sw
routes/index.ts route tree
schema.sql      tables, RLS, functions, migrations at the bottom
```

Rule: controllers validate and call services; services own logic and database access.

## Database (Supabase Postgres, RLS on)

`profiles` (first_name, last_name — there is no full_name), `user_roles` (role kept separate from profile), `warnings` (two FKs to profiles: user_id and issued_by — always disambiguate with `warnings!user_id(...)`), `courses`, `course_subfolders`, `course_materials` (R2 key, price), `cbts`, `cbt_questions`, `cbt_attempts` (started_at, deadline, status), `cbt_answers`, `payments` (reference, kobo amount, status), `sw_tasks`, `sw_submissions`, `sw_questions`, `sw_responses`.

## Key decisions

1. **Server owns the CBT clock**: deadline stored at start, 45s grace, late answers rejected, expiry sweep closes abandoned attempts.
2. **Server-priced payments**: the client never sends amounts; payment verified server-side (webhook is backup).
3. **Private files**: R2 is private; only short-lived signed URLs leave the server.
4. **Direct Supabase SDK, no ORM.** No load balancer, no raw WebSockets (~300 users; Supabase Realtime if needed).
5. **Decoupled frontend**: one base URL (`VITE_API_URL`).
