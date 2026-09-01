# PrepMaster LMS

> Dual-track (Secondary · University) CBT & learning platform — question banks, past papers, timed exams, materials/Telegram, and package-based premium.

![Next.js](https://img.shields.io/badge/Next.js-16.3-000?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)
![License](https://img.shields.io/badge/license-MIT-blue)

Live stack: **Next.js 16.3 (Turbopack) + React 19 + Supabase + Paystack + Gemini** · Deployed from `prepmaster/`.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database & Migrations](#database--migrations)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Theming](#theming)
- [Payments & Premium](#payments--premium)
- [AI Question Generation](#ai-question-generation)
- [Roles & Access](#roles--access)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

PrepMaster serves two audiences from one codebase:

- **Secondary School** — SS1–SS3, subjects (Physics/Chemistry/Maths/Further Maths), WAEC/JAMB/NECO past papers.
- **University** — faculties/departments/levels/semesters, courses, faculty-scoped content.

Students register by track, pick level/faculty/department/semester, and get a scoped dashboard. Admins manage all reference data, content, exams, and monetization.

---

## Features

### Student

- Track-aware registration (Secondary vs University) with level/faculty/department/semester selection.
- Dashboards scoped by track: subjects or courses, materials, Telegram groups.
- Practice & CBTs — free, paid, and premium-gated exams.
- Timed CBT player — debounced autosave, Realtime answer sync (`attempts` row via Supabase Realtime), localStorage fallback, flagging, countdown, submit & result pages with explanations/re-attempts.
- Materials & past papers browsing.
- Packages page (`/dashboard/packages`) — buy subscription via Paystack; success/failure notices via `?pay=` param.
- Profile & theme toggle (light/dark).

### Admin (`/admin` — requires `profiles.role = 'admin'`)

- **Content:** Subjects, Courses (code/name/track/level/faculty/department/semester).
- **Exams:** CBTs & Exams list, question-banks, past papers. Creation wizard (`/admin/exams/new`) supports 4 sources: question-bank picker, AI from notes, AI from past papers, manual paste.
- **Structure:** Levels (SS1–SS3, 100L–500L), Faculties & Departments, Users (role management).
- **Billing:** Packages — list/add/edit/toggle active/delete with pricing (`/admin/packages`).
- Exam settings: duration, review/re-attempts/explanations toggles, free/premium/price, scheduling, status (draft/scheduled/live/paused/ended).

---

## Tech Stack

- **Framework:** Next.js 16.3.4 (App Router, Turbopack), React 19, TypeScript 5
- **Styling:** Tailwind CSS v4, Radix UI, `next-themes`, `lucide-react`
- **Backend:** Supabase (Auth, Postgres, RLS, Realtime), `@supabase/ssr`
- **Payments:** Paystack (`paystack-js` REST — initialize/verify)
- **AI:** Google Gemini (`GEMINI_API_KEY`) for question generation
- **Tooling:** ESLint (`eslint-config-next`), Supabase CLI

---

## Architecture

```
[ Next.js App Router ]
  ├─ / (marketing) ─ /login /register /register/complete
  ├─ /dashboard/* (student, track-aware shell)
  ├─ /admin/* (admin shell, isAdmin() guard → redirect /dashboard)
  ├─ /api/paystack/verify (callback → payments.status)
  └─ Supabase: Auth · Postgres (RLS) · Realtime (attempts)
```

Key guards:

- `src/lib/session.ts:isAdmin()` — checks `profiles.role = 'admin'`.
- `src/lib/access.ts:hasPremiumSubscription()` / `hasExamAccess()` — premium exams unlock via direct `payments.exam_id` success **or** any successful `payments.package_id`.
- RLS: reference tables have `authenticated` + `anon` SELECT policies for pre-login registration; all writes are admin-gated (`public.is_admin()`).

---

## Getting Started

### Prerequisites

- Node 20+, npm
- Supabase project + CLI (`npx supabase --version` ≥ 2.116)
- Paystack account (test keys okay for local), Gemini API key (optional, for AI features)

### 1. Clone & install

```bash
git clone https://github.com/Mrweb-devpro/PrepMasterLMS.git
cd PrepMasterLMS
npm install
```

### 2. Configure env

```bash
cp .env.example .env.local
# then fill in values (see Environment Variables)
```

### 3. Link Supabase & push migrations

```bash
# login once (or set SUPABASE_ACCESS_TOKEN)
npx supabase login
npx supabase link --project-ref <your-project-ref>   # e.g. ftqbgdavqzxzyirzwrrm
npx supabase db push
```

This applies `supabase/migrations/00001_initial_schema.sql` → `00005_fix_profile_trigger.sql` and seeds reference data (tracks, faculties, semesters, subjects). Levels & departments are seeded via app/migration or admin — see Database.

If you run a local Supabase stack instead:

```bash
npx supabase init
npx supabase start
```

### 4. Run

```bash
npm run dev    # http://localhost:3000
npm run build  # production build check (27 routes)
npx tsc --noEmit
npx eslint .
```

### 5. First admin

1. Register at `/register` (pick track/level/etc).
2. In Supabase Dashboard → Table Editor → `profiles` → set your row `role = 'admin'`:

   ```sql
   update profiles set role = 'admin' where id = '<your-auth-user-id>';
   ```

   Or via service_role REST:

   ```bash
   curl -X PATCH "https://<ref>.supabase.co/rest/v1/profiles?id=eq.<id>" \
     -H "apikey: <service_role>" -H "Authorization: Bearer <service_role>" \
     -H "Content-Type: application/json" -d '{"role":"admin"}'
   ```

3. Visit `/admin`.

---

## Environment Variables

| Variable | Required | Where | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase → Settings → API | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase → API | anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase → API | service_role (server-only) |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | for payments | Paystack → Settings → API | `pk_test_...` |
| `PAYSTACK_SECRET_KEY` | for payments | Paystack → API | `sk_test_...` |
| `GEMINI_API_KEY` | for AI | aistudio.google.com/apikey | question generation |
| `NEXT_PUBLIC_APP_URL` | yes | — | `http://localhost:3000` locally |

Never commit `.env.local`. `SUPABASE_SERVICE_ROLE_KEY` and `PAYSTACK_SECRET_KEY` are server-only.

---

## Database & Migrations

Migrations in `supabase/migrations/` (applied via `npx supabase db push`):

| File | Purpose |
|---|---|
| `00001_initial_schema.sql` | Tracks, faculties, departments, levels, semesters, subjects, courses, profiles, questions, banks, exams, attempts, materials, past_papers, packages, payments, telegram_groups, RLS enable, `handle_new_user()` trigger |
| `00002_rls_policies.sql` | `is_admin()` helper, all RLS policies, seed: tracks (Secondary/University), faculties (Engineering/Science/Architecture), semesters, subjects |
| `00003_exam_payments.sql` | `payments.exam_id` + index (per-exam Paystack purchases) |
| `00004_anon_reference_reads.sql` | `anon` SELECT policies for `tracks/faculties/departments/levels/semesters` (registration is pre-login) |
| `00005_fix_profile_trigger.sql` | Fix `handle_new_user()` to persist `track_id/faculty_id/department_id/level_id/semester_id` from `raw_user_meta_data` |

Seeded reference data after `db push`:

- Tracks: Secondary School, University
- Faculties: Engineering, Science, Architecture
- Departments: 9 seeded (Mechanical/Civil/Electrical/Computer Eng; Computer Sci/Micro/Biochem/Physics; Architecture)
- Levels: 8 (SS1–SS3, 100L–500L)
- Semesters: First/Second
- Subjects: Physics, Chemistry, Mathematics, Further Mathematics
- Packages: create via `/admin/packages` (2 demo inserted if empty: Premium Monthly ₦5k, Yearly ₦45k)

---

## Project Structure

```
prepmaster/
├─ src/
│  ├─ app/
│  │  ├─ admin/           # /admin, /admin/{subjects,courses,exams,levels,faculties,users,packages}
│  │  ├─ dashboard/       # /dashboard, /dashboard/{subjects,courses,practice,cbt,packages,profile}
│  │  ├─ actions/         # payments.ts (initializePackagePayment, initializeExamPayment)
│  │  ├─ api/paystack/verify/
│  │  └─ auth/callback/
│  ├─ components/
│  │  ├─ admin/shell.tsx
│  │  ├─ dashboard/shell.tsx
│  │  └─ ui/              # shadcn-style primitives
│  └─ lib/
│     ├─ supabase/        # server/client
│     ├─ access.ts        # hasPremiumSubscription, hasExamAccess
│     ├─ paystack.ts      # initializeTransaction, verifyTransaction
│     └─ session.ts       # getUser, isAdmin
├─ supabase/migrations/
├─ public/
├─ next.config.ts
└─ package.json
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server (Turbopack) — `http://localhost:3000` |
| `npm run build` | Production build — expect 27 routes |
| `npm start` | Serve production build |
| `npx tsc --noEmit` | Type check |
| `npx eslint .` | Lint (current baseline: ~12 pre-existing issues, no new) |

---

## Theming

CSS variables in `src/app/globals.css` — light (`--background: #eff6ff`, `--card: #ffffff`) and dark (`--background: #0f172a`, `--card: #1e293b`). Toggle via `next-themes` (`src/components/theme-toggle.tsx`). Native `<select>` elements use `bg-background` for proper contrast on `bg-card`.

---

## Payments & Premium

- **Per-exam:** `initializeExamPayment(examId)` creates `payments` row (`exam_id`, `status=pending`, `paystack_reference=pm-…`), redirects to Paystack `authorization_url`; callback `/api/paystack/verify?reference=&exam=` verifies via `PAYSTACK_SECRET_KEY` and flips to `success`.
- **Packages:** `initializePackagePayment(packageId)` at `src/app/actions/payments.ts:15` — same flow with `pkg-` prefix and `?package=` callback.
- **Gating:** `src/lib/access.ts:39` — premium exams unlock if `payments` has `exam_id` success **or** `is_premium && hasPremiumSubscription` (any successful `package_id`).

---

## AI Question Generation

`src/app/admin/ai.ts` — `generateQuestionsFromText` calls Gemini REST (`GEMINI_API_KEY`). Used in exam wizard (`create-exam-form.tsx`) for **AI from notes** and **AI from past papers** sources; stores `options` as JSONB `[A,B,C,D]` and `correct_answer` as letter (A–E).

---

## Roles & Access

- `profiles.role` enum: `student | admin | instructor` (default `student`).
- `isAdmin()` (`src/lib/session.ts:24`) gates `/admin` layout (`src/app/admin/layout.tsx`) → non-admin redirects to `/dashboard`.
- After first registration, promote via SQL/REST as shown in Getting Started.

---

## Deployment

Any Next.js host (Vercel recommended):

1. Set env vars in host dashboard (same as `.env.example`).
2. Point Supabase `NEXT_PUBLIC_APP_URL` to deployed URL.
3. Add Paystack callback URL domain to Paystack dashboard allowlist.
4. Push migrations to production Supabase project (`npx supabase link --project-ref <prod-ref> && npx supabase db push`).

---

## Contributing

1. Branch from `main`: `git checkout -b feat/your-feature`
2. Commit with conventional messages (`feat:`, `fix:`, `docs:`)
3. Ensure `npx tsc --noEmit && npm run build && npx eslint .` is clean (no new issues beyond baseline)
4. Open a Pull Request against `main` — include description, screenshots for UI changes, and migration notes if DB changed

---

## License

MIT — see `LICENSE` if present.

---

**Maintained by** [@Mrweb-devpro](https://github.com/Mrweb-devpro) · Issues & PRs welcome at [PrepMasterLMS](https://github.com/Mrweb-devpro/PrepMasterLMS).
