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
- **Catalog**: courses/files/CBTs come from `GET /v1/catalog` via `useCatalog()`. Courses have `level` plus `departments text[]`; level `all` and an empty department list mean general/open to every student. Drive and CBT catalog views default to the student's level and department, with a switch to all departments at that level. Pages must not import mock arrays.
- **Session**: `src/features/auth/session.tsx` — Supabase Auth + `GET /v1/me` when LIVE; demo personas + "Viewing as" switcher otherwise. Guards in `features/auth/hooks/useGuards.ts`. A temporary network or server failure preserves the loaded user and retries when the browser reconnects; only confirmed `401`/`403` responses end the local session.
- **Avatars**: gender is required during registration and onboarding (`male`, `female`, `other`, or `prefer_not_to_say`) and can be updated in settings. Every new profile receives a deterministic DiceBear 9.x Adventurer URL based on its UUID, while the avatar editor can replace it with a shuffled gender-aware URL. `profiles.gender` and `profiles.avatar_url` persist through `PATCH /v1/me` (`gender`, `avatarUrl`). Apply the idempotent avatar upgrade block at the end of `backend/schema.sql` before deploying; it also backfills existing profiles without an avatar. Both settings pages share `AvatarEditor`; sidebar chips share `ProfileAvatar` with initials fallback. Profile updates return a success boolean after persistence, then update session state before navigation; dummy mode uses local session storage.
- **Student warnings**: `/v1/me` returns warning IDs, reasons and creation timestamps, mapped into `Profile.warnings`. `StudentShell` shows the latest warning at most once per document load. `pm_warning_<id>` stores `{ viewCount, acknowledged }`: display increments the count up to three; explicit acknowledgment permanently silences that warning in this browser. Escape, outside click and the close button dismiss without acknowledgment. Settings keeps the full history. If storage is blocked, automatic popups are skipped and history remains available. The warnings table has no resolved/active flag, so all issued warnings are included in history.
- **Password recovery**: preserve the Supabase session after updating the password. `useAuthActions().refreshSession` invalidates and fetches `["auth", "session"]`, then updates the session context before routing to `/` or `/onboarding` using `isMainProfileComplete`. Profile reload failures stay on the reset page and can be retried without updating the password again.
- **Email verification**: `/login` redirects once the session profile is hydrated, checking `isMainProfileComplete` before honoring the return path or admin destination. Unconfirmed email errors show a 12-second toast with spam guidance and a resend action tied to the attempted email. Expired, invalid, or already-used confirmation links route to `/login`, show dedicated guidance, and offer a resend action after the user enters their email. Expired reset links show the reset-page error card and a fresh-link action. Resent signup links return to `/login`.
- **Python Web Book waitlist**: authenticated students can join from `/python`. `POST /v1/python/waitlist` derives the profile email and name server-side and inserts one record per user; `GET /v1/python/waitlist/status` drives the confirmed button state. Demo mode stores the same state locally.
- **Stores**: `prep-store.tsx` (owned items, attempts, purchases), `admin-store.tsx` (admin data).
- **CBT**: Live CBTs require an opening and closing timestamp. The server caps each attempt deadline at the closing time, blocks starts, answer saves, and new purchases after closure, and finalizes an in-progress attempt when an answer arrives after the live window. `useCatalog()` refetches at the next live close so live badges and student actions update without a reload. While an open exam temporarily loses connection, selected answers are kept in memory and queued for saving when the browser reconnects; the exam page warns the student to keep it open. Question flags are persisted with submission as question IDs, then mapped to positions for the admin attempt history.
- **Competitions**: Scheduled competitions reference an optional CBT question bank and store a separate entry per student. The competition service owns answer acceptance, timing, scoring, and rank calculation; students never receive answer indexes. Browser polling refreshes standings, while the demo service simulates score movement.
  Competition lists and participation enforce profile level on the backend; student cards and the top ribbon also filter by level. Eligible students enter a live arena directly, which creates their entry on demand. Each entrant receives a persisted question subset when an admin limits a linked bank. Custom competition questions create a hidden, free practice CBT with a 90-minute post-contest release timestamp; catalog and attempt services enforce that timestamp, then expose it as `🏆 Practice: <competition title>` with explanations. Admins use full-page authoring for either source and can update settings at any point, with lifecycle status recalculated from the current schedule. Completed contest cards open a Hall of Fame with the final podium and all results. The ribbon occupies an AppFrame announcement slot above the header and dismisses per contest in sessionStorage. Migrations `20261029120000_competition_settings.sql` and `20261029130000_competition_question_release.sql` add the competition fields and remove browser table access so the service owns authorization.
- **Files**: `features/drive/utils/files.ts` `loadViewable` → `/materials/:id/download` (signed URL) → `FileViewer`.
- **SolidWorks grading**: task targets for mass, volume and tolerance are admin-only. On submission, the server awards 30 points each for mass and volume based on the target tolerance; admins review the remaining 40 model/file points and may override the automatic scores.
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

1. **Server owns the CBT clock**: deadline stored at start, capped by the live CBT close time, with 45s grace for ordinary deadline expiry. A closed live window immediately blocks starts, answer saves, and purchases; expiry sweep closes abandoned attempts.
2. **Server-priced payments**: the client never sends amounts; payment verified server-side (webhook is backup).
3. **Private files**: R2 is private; only short-lived signed URLs leave the server.
4. **Direct Supabase SDK, no ORM.** No load balancer, no raw WebSockets (~300 users; Supabase Realtime if needed).
5. **Decoupled frontend**: one base URL (`VITE_API_URL`).
