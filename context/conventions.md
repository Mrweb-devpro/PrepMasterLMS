# PrepMaster — Conventions & Guardrails

Read this with `AGENTS.md`, `architecture.md`, `designsystem.md` and `api-contracts.md` before changing code.

## 1. Forbidden

- Never read, print, edit or commit `.env`, `.env.*` (except `.env.example`) or `backend/.env`.
- Never edit, delete or import from `src2/` or `old_src/`.
- Never edit `src/routeTree.gen.ts` (generated).
- Never use `react-router-dom`, Next.js patterns, `src/pages`, or an `App.tsx` router.
- Never put the Supabase service-role key, R2 keys, Paystack secret or `LOVABLE_API_KEY` in frontend code.
- Never trust the browser for prices, timers, scores or roles.
- Never add an ORM, load balancer or raw WebSockets.
- Never run destructive git commands (reset, force push) without the reviewer's approval.

## 2. Frontend structure

- Feature code lives in `src/features/<feature>/{pages,components,hooks,services,constants,utils}`.
- Route files in `src/routes` stay thin: set `head()` and render a feature page.
- Every new `Link`/`navigate` target must have a route file in the same change.
- Shared UI: `src/components/ui` (shadcn), `src/components/prep`, `src/components/layout`, `src/components/common`.

## 3. Data flow

- Service → TanStack Query hook → page. No `fetch` inside components.
- Services branch on `LIVE` from `src/lib/api/config.ts`: real API via `api` from `src/lib/api/client.ts`, else dummy data. Both modes must keep working.
- Catalog data only through `useCatalog()`; never import mock arrays into pages.
- Mutations invalidate the related query keys; show results with `sonner` toasts.
- Map snake_case API fields to camelCase in a mapper (see `features/auth/services/profile.mapper.ts`).

## 4. Styling

- All tokens in `src/styles.css`. Use semantic classes (`bg-card`, `text-muted-foreground`, `bg-primary`, `text-gold-text`). No `text-white`, `bg-black`, `bg-[#...]`.
- Gold only for paid/premium. Themes: `:root` student blue, `.theme-admin` red, `.theme-sw` teal, `.dark`.
- Fonts: Space Grotesk (`font-display`) headings, DM Sans body.
- Mobile first; every page must work at 360px wide. CBT exam screen stays minimal.
- Destructive or irreversible actions use `ConfirmDialog`.
- To hide unfinished UI (e.g. notifications), use the `hidden` class — don't delete it.

## 5. Backend rules

- Layers: routes → controllers (validate + call) → services (all logic + DB) → lib.
- Validate every body/param with zod in `validators/schemas.ts`.
- Throw typed errors from `lib/errors.ts`; the error middleware formats them.
- Protected routes use `requireAuth`; admin routes add `requireAdmin`.
- Supabase joins with multiple FKs must name the FK (e.g. `warnings!user_id(...)`).
- Use real column names (`first_name`, `last_name`; no `full_name`). Check `schema.sql` first.
- Schema changes: append an idempotent migration at the bottom of `backend/schema.sql` and mention it to the reviewer.
- Money in kobo (integers). Time in UTC ISO strings.

## 6. CBT clock

- Server stores `deadline = started_at + duration_minutes` on start.
- UI counts down from `deadline - Date.now()`; never from a local start time.
- Autosave each answer on tap; auto-submit at zero; resume on refresh.
- Backend accepts answers until `deadline + 45s`, then rejects (409).

## 7. Workflow for the implementing agent

1. Read the ticket and the files it names before editing.
2. Change only what the ticket asks; no drive-by refactors.
3. Run `npx tsc --noEmit` (root) and `npm run typecheck` (in `backend/`) after changes.
4. Summarize changed files and anything the reviewer must do (e.g. run a migration, add an env var).
5. Update `context/*.md` when a decision or contract changes.
