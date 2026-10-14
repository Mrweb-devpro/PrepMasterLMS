# Agent Instructions & Constraints

## Absolute Constraints

1. NEVER edit, delete, or import from `src2/` — it is a frozen legacy backup.
2. NEVER install new npm/bun packages without explicit instruction from the user.
3. Keep frontend in `src/` and backend in `backend/` — do not merge or relocate folders.
4. Keep the Supabase service-role key backend-only — never expose it in `src/` or `VITE_` variables.

## Frontend & Styling Rules

1. Never hardcode colors (`#3b6cff`, `bg-black`, `text-white`). Use the semantic tokens in `src/styles.css`.
2. Headings use `font-display` (Space Grotesk), body uses DM Sans.
3. Gold accent is strictly reserved for paid/premium items.
4. All client-side data flows through TanStack Query hooks using `api` from `src/lib/api/client.ts`.

## Context References

Before starting complex tasks, read:

- `context/architecture.md` (System design & layers)
- `context/designsystem.md` (Tokens, components & themes)
- `context/techstack.md` (Approved dependencies)

## Quality Gate

Always run typecheck (`npm run build` or `npx tsc --noEmit`) before reporting a task complete.
