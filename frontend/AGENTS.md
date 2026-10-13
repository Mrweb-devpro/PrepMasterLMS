<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- src2/ is a frozen backup of the previous UI design; never edit it or import from it (user wants both versions kept).
- All design tokens (colors, radii, shadows, fonts) live in src/styles.css; admin gets red accent via `.theme-admin` class set in AdminShell.
- Admin prototype state (courses, CBTs, suspended students) lives in src/lib/admin-store.tsx context.
- AI calls live in src/lib/ai/ (*.server.ts helpers + *.functions.ts server fns); only server-side code touches LOVABLE_API_KEY — keeps secrets out of the browser.
- Backend lives in backend/ (own package.json, Hono on Node.js, Supabase service-role + R2 + Paystack) using models/validators/services/controllers/routes layers; all rules live in services and the server owns the CBT clock — keeps the frontend untouched and cheating impossible from the browser.
- This app will call the backend via one API client with a single configurable base URL — keeps the UI decoupled from backend hosting.
- Frontend uses feature folders (src/features/<feature>/{pages,components,hooks,services,constants,utils}); route files in src/routes stay thin and render feature pages — keeps TanStack file routing while grouping code by feature.
- Feature data flows service -> TanStack Query hooks -> pages; each service picks the real API (src/lib/api/client.ts) or dummy data via the single `LIVE` flag in src/lib/api/config.ts (set when VITE_API_URL + Supabase env exist) — the preview keeps working without keys.
- Courses/files/CBTs come from one GET /v1/catalog through useCatalog(); pages must use it instead of importing mock-data arrays — keeps both modes on one code path.
- Session (src/features/auth/session.tsx) uses Supabase Auth + GET /v1/me when LIVE, demo personas otherwise; the "Viewing as" switcher hides itself when LIVE.
- Payments: server prices items, Paystack redirects to /payment/callback which calls POST /payments/:ref/verify — works without webhooks on localhost; webhook stays as the backup.
