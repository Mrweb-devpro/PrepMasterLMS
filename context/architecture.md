# PrepMaster — Architecture

Two apps in one repo: the **frontend** at the root (`src/`) and the **backend** in `backend/`. They talk over HTTP through one API client.

```text
Browser (TanStack Start app)
  ├─ Supabase Auth (sign-in, JWT)
  └─ API client (Bearer JWT) ──► Hono API (backend/) ──► Supabase Postgres (service role)
                                       ├─► Cloudflare R2 (presigned URLs)
                                       └─► Paystack (init / verify / webhook)
```

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
│  ├─ router.tsx, start.ts, server.ts, styles.css
├─ src2/                   FROZEN old design — never edit/import
├─ backend/                Hono API (own package.json)
├─ public/                 favicon, robots, samples/sample-notes.pdf
├─ docs/connecting-the-backend.md
├─ context/                these docs
├─ SETUP.md, AGENTS.md, roadmap.md, .env.example
```

## Frontend
- **Routing**: TanStack Router file routes. Dots = path segments (`admin.cbts.$cbtId.tsx` → `/admin/cbts/:cbtId`); `solidworks.tsx` is the SW layout (`<Outlet/>`); `solidworks_.register.tsx` escapes it. Never edit `routeTree.gen.ts`.
- **Data flow**: `service` → TanStack Query hook → page. Each service checks `LIVE` (`src/lib/api/config.ts`, true when `VITE_API_URL` + Supabase env exist) and calls the real API or dummy data. Same code path both modes.
- **Catalog**: courses/files/CBTs come from one `GET /v1/catalog` via `useCatalog()` (`src/features/catalog`). Pages must not import mock arrays.
- **Session**: `src/features/auth/session.tsx` — Supabase Auth + `GET /v1/me` when LIVE, demo personas + "Viewing as" switcher otherwise. Guards in `features/auth/hooks/useGuards.ts`.
- **Stores**: `prep-store.tsx` (owned items, attempts, purchases), `admin-store.tsx` (admin data).
- **CBT**: `features/cbt/hooks/useLiveAttempt.ts` — server deadline, autosave per answer, auto-submit at zero, resume on refresh.
- **Files**: `features/drive/utils/files.ts` `loadViewable` → `/materials/:id/download` (signed URL) → `FileViewer`.
- **Payments**: `payments.api.ts` `startCheckout` (saves return path) → Paystack → `/payment/callback?reference=` → `POST /payments/:ref/verify`.
- **AI**: TanStack server functions in `src/lib/ai/` (only server touches keys).

## Backend (`backend/src`)
```text
index.ts        Node server (@hono/node-server)
app.ts          Hono app: CORS, secure headers, error middleware, mounts /v1
config/env.ts   zod-validated env
lib/            supabase (service role), r2 (presign), paystack, errors
middleware/     auth.ts (requireAuth: verify Supabase JWT, load role; requireAdmin), error.ts
models/types.ts shared types
validators/     schemas.ts (zod bodies/params)
controllers/    HTTP only: courses, cbts, payments, students, sw
services/       ALL business rules: access, course, cbt, payment, student, sw
routes/index.ts route tree
schema.sql      tables, RLS, functions
```
Rule: controllers validate + call services; services own logic and DB access.

### Endpoints (prefix `/v1`)
- Public: `GET /health`, `POST /webhooks/paystack` (signature verified).
- `/me`: GET, PATCH, POST `/solidworks` (register), GET `/library`, GET `/payments`.
- `/catalog`: GET (role-aware, includes ownership).
- `/courses` (admin): POST, DELETE `/:id`, POST `/:id/subfolders`, POST `/:id/uploads` (presigned PUT), POST `/:id/materials`.
- `/materials`: GET `/:id/download` (access-checked signed URL), DELETE `/:id` (admin).
- `/cbts`: POST `/:id/start`; admin POST `/admin`, GET/PATCH/DELETE `/admin/:id`.
- `/attempts`: GET, PUT `/:id/answers`, POST `/:id/submit`, GET `/:id/result`.
- `/payments`: POST `/checkout`, GET `/:reference`, POST `/:reference/verify`, GET `/admin/all`.
- `/solidworks`: tasks, submissions (uploads, grading), works, questions/responses, users.
- `/admin/students`: list, detail, warnings, suspend/unsuspend.

### Database (Supabase Postgres, RLS on)
`profiles`, `user_roles` (role separate from profile), `warnings`, `courses`, `course_subfolders`, `course_materials` (R2 key, price), `cbts`, `cbt_questions`, `cbt_attempts` (started_at, deadline, status), `cbt_answers`, `payments` (reference, kobo amount, status), `sw_tasks`, `sw_submissions`, `sw_questions`, `sw_responses`.

## Key decisions
- Server owns CBT clock: deadline stored at start, 45s grace, late answers rejected, expiry sweep closes abandoned attempts.
- Server prices every item; payment verified server-side (works on localhost without webhooks; webhook is backup).
- Direct Supabase SDK, no ORM. No load balancer / raw WebSockets (~300 users).
- Files private in R2; only short-lived signed URLs leave the server.
- Frontend stays decoupled: one base URL (`VITE_API_URL`).
