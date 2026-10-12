# PrepMaster — Tech Stack

## Summary
| Layer | Tech |
|---|---|
| Frontend framework | React 19 + **TanStack Start v1** (SSR, file routing, server functions) — not Next.js |
| Build tool | Vite (via `@lovable.dev/vite-tanstack-config`), Nitro for server output |
| Language | TypeScript 5 (both apps) |
| Styling | **Tailwind CSS v4** (configured in `src/styles.css` with `@theme`, no tailwind.config.js) + `tw-animate-css` |
| UI kit | shadcn/ui (Radix primitives) in `src/components/ui/` |
| Icons | lucide-react |
| Data fetching | TanStack Query v5 |
| Forms / validation | react-hook-form + zod |
| Backend | **Hono** on **Node.js** (`backend/`, run with tsx in dev) |
| Database | **Supabase Postgres** with Row Level Security (no ORM — direct Supabase SDK queries). Not Firestore. |
| Auth | Supabase Auth (email + Google); Hono verifies the JWT |
| File storage | **Cloudflare R2** (S3 API, presigned upload/download URLs) |
| Payments | **Paystack** (checkout, verify endpoint, webhook backup) |
| AI | Lovable AI Gateway via `ai` + `@ai-sdk/openai` (server-only, `src/lib/ai/`); Gemini planned |
| Fonts | Space Grotesk (headings), DM Sans (body) |
| Lint/format | ESLint 9, typescript-eslint, Prettier |

## Frontend dependencies (`package.json`)
**Core**: react ^19.2, react-dom ^19.2, @tanstack/react-start 1.168.60, @tanstack/react-router 1.170.41, @tanstack/router-plugin 1.168.42, @tanstack/react-query ^5.101, vite-tsconfig-paths.
**Styling**: tailwindcss ^4.2, @tailwindcss/vite ^4.2, tw-animate-css, class-variance-authority, clsx, tailwind-merge.
**Radix**: accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, slot, switch, tabs, toggle, toggle-group, tooltip.
**UI extras**: lucide-react, cmdk (⌘K search), sonner (toasts), vaul (drawer), embla-carousel-react, react-day-picker, input-otp, react-resizable-panels, recharts (charts), date-fns.
**Forms**: react-hook-form, @hookform/resolvers, zod ^3.25.
**Data/AI**: @supabase/supabase-js ^2.117, ai ^7, @ai-sdk/openai ^4.
**Dev**: typescript ^5.8, vite 8, @vitejs/plugin-react, @lovable.dev/vite-tanstack-config, nitro, eslint + plugins (react-hooks, react-refresh, prettier), prettier, @types/node/react/react-dom, globals.

## Backend dependencies (`backend/package.json`)
**Runtime**: hono ^4.6, @hono/node-server, @hono/zod-validator, zod ^3.23, @supabase/supabase-js ^2.45, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner.
**Dev**: typescript ^5.6, tsx, @types/node.
Scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist), `typecheck`.

## Environment variables
Frontend `.env`: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (all set → LIVE mode; otherwise dummy data).
Backend `.env`: `PORT=4000`, `CORS_ORIGINS`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `R2_ACCOUNT_ID`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET`, `PAYSTACK_SECRET_KEY`.
Server-only (frontend server fns): `LOVABLE_API_KEY`.

## Hosting (suggested)
Frontend: Lovable Publish / Cloudflare / Vercel. Backend: Render, Railway or Fly.io (Node). DB/Auth: Supabase. Files: Cloudflare R2.
