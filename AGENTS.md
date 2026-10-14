# Agent Instructions & Project Rules

## Repository Layout

- Root folders: `frontend/`, `backend/`, `context/`, `docs/`, `.git/`.
- Active frontend: lives in `frontend/src/`.
- Active backend: lives in `backend/src/` (Hono on Node.js).
- `docs/` is for human developer notes only; agents must ignore it.
- Context documentation: lives in `context/`. Consult `context/architecture.md` and `context/conventions.md` before making structural changes.

## Strict Restrictions

- NEVER read, edit, delete, or commit any `.env` file (`backend/.env`, `frontend/.env`, or root). Why: keeps API keys, service roles, and secrets strictly secure.
- NEVER edit, delete, or import from `frontend/src2/` or `frontend/old_src/`. Why: these are frozen legacy UI backups kept for user reference.
- NEVER install or introduce `react-router-dom` or Next.js. Why: frontend uses TanStack Start v1 with TanStack Router.
- NEVER query the Supabase database directly inside backend controllers. Why: controllers only parse/validate HTTP requests; all queries and rules belong in `backend/src/services/`.

## Architecture & Coding Rules

- Design tokens: all colors, radii, shadows, and fonts live in `frontend/src/styles.css`. Admin theme uses `.theme-admin` class; SolidWorks uses `.theme-sw`. Never hardcode raw hex values like `bg-[#...]` in components.
- Gold token: gold (`--gold`, `--gold-text`, etc.) is reserved exclusively for paid/premium items. Never use gold decoratively.
- Data flow: frontend pages must fetch data through TanStack Query hooks via feature services. Do not import mock data arrays directly into components.
- Dual Mode (`LIVE` vs Dummy): `frontend/src/lib/api/config.ts` controls whether the app calls the Hono backend or returns local mock data. Keep both code paths working.
- Backend layers: routes -> controllers (`backend/src/controllers/`) -> services (`backend/src/services/`) -> database/R2/Paystack.
- CBT exams: server owns the exam clock and deadline. Answers autosave per question; browser timers are never trusted.
- Payments: server prices every item. Paystack callback calls `POST /payments/:ref/verify`.
