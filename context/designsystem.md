# PrepMaster — Design System

Look: Lovable-dashboard style — neutral off-white surfaces, light card sidebar, soft borders, spacious layout, soft layered shadows.

## Golden rules (for agents)
1. **All tokens live in `src/styles.css`** (user calls it "global.css"). Never hardcode colors (`text-white`, `bg-[#...]`) — use semantic classes (`bg-surface`, `text-muted-foreground`, `bg-primary`, `text-gold-text`…).
2. **Gold is only for paid/premium** (price tags, lock badges, Premium). Never decorative.
3. Themes switch by class, not by component code: `:root` student (blue), `.theme-admin` (red, set by `AdminShell`), `.theme-sw` (teal, set by `SwShell`), `.dark` on `<html>` for dark mode (each theme has a `.dark` variant).
4. Headings use `font-display` (Space Grotesk); body `font-sans` (DM Sans). Don't use Inter/Poppins.
5. Split UI into small components; reuse `src/components/ui/*` (shadcn) and `src/components/prep/bits.tsx`.
6. Every page must be responsive (mobile first). CBT exam screen stays minimal text.
7. Never edit or import from `src2/` (frozen old design).

## Colors (light)
| Token | Value | Use |
|---|---|---|
| `--background` | #fafaf9 | page |
| `--primary` (student) | #3b6cff | buttons, active nav, links |
| `--primary-hover / active / soft / disabled` | #2a58e8 / #1f47c7 / #eef2ff / #a9bdff | states |
| `--primary` (admin) | #e5484d | `.theme-admin` |
| `--primary` (SolidWorks) | #0e9384 | `.theme-sw` |
| `--gold` | #d4a72c (+ `--gold-bg`, `--gold-text`) | paid only |
| `--ink`, `--ink-soft` | #111113, #1c1c20 | dark hero cards (`--gradient-ink`) |
| `success / warning / error` (+ `-bg`) | semantic | status pills, answer review |
| `surface`, `surface-subtle`, `surface-hover`, `border`, `border-strong`, `sidebar-*`, `text-secondary`, `text-muted` | neutrals | cards, lists |

Dark: background #0f0f10, primary #5b84ff (admin #ef5f63, sw #2bb3a3).

## Typography scale
`text-2xs` 11 · `xs` 12 · `sm` 13.5 · `base` 15 · `lg` 17 · `xl` 22 · `2xl` 28 · `3xl` 36 · `4xl` 44 (px). Mono: system mono.

## Radius, shadow, motion
Radius: `xs` 4 · `sm` 6 · `md` 10 (default) · `lg` 14 · `xl` 20 · `2xl` 28 · `full`.
Shadows: `shadow-xs/sm/md/lg` — very soft, layered.
Motion: `animate-fade-in` (280ms), `animate-rise` (360ms), cubic-bezier(0.2,0.7,0.2,1).

## Components & patterns
- **Buttons**: shadcn `Button` variants (default=primary, outline, secondary, ghost, destructive). Primary is solid accent; gold buttons only for "Buy/Unlock".
- **Cards**: `bg-card border border-border rounded-lg shadow-sm`, generous padding.
- **Sidebar** (`AppSidebar`): light card, active item `bg-sidebar-active`; Account pinned bottom; collapses to sheet on mobile.
- **Topbar**: ⌘K search (cmdk; shorter on mobile), single cycling theme button Light → Dark → System (`ThemeToggle`, `src/lib/theme.tsx`).
- **Dialogs**: shadcn Dialog/AlertDialog; `ConfirmDialog` for destructive actions; `PurchaseDialog` for buying.
- **Status pills**: `src/features/cbt/utils/cbt-status.tsx`.
- **Answer review**: correct = success + tick; wrong pick = error + "Your answer"; skipped = muted "Not answered".
- **Forms**: label above input, dropdowns for faculty/department/level; profile forms closed by default behind an Edit button.
- **Task cards**: number badge `#N` top-left.
- **Toasts**: sonner.
- **Images**: `src/assets/sw-task-*.jpg` (SolidWorks task references). Sample PDF: `public/samples/sample-notes.pdf`.

## Key files
`src/styles.css` · `src/components/ui/*` · `src/components/prep/{StudentShell,AdminShell,AuthLayout,bits}.tsx` · `src/components/layout/{AppSidebar,ThemeToggle}.tsx` · `src/features/solidworks/components/SwShell.tsx` · `src/lib/theme.tsx`.
