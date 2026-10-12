# PrepMaster — Purpose

PrepMaster is an online tutorial platform for Nigerian university students (built around UNILAG's Science, Engineering and Environmental Sciences/Architecture faculties). It sells and serves study materials, runs practice and live CBT (computer-based test) exams, and hosts a SolidWorks CAD training hub.

## Who uses it
| Role | Shell | Accent |
|---|---|---|
| Student | `StudentShell` (sidebar: Home, Drive, CBTs, My attempts, My Library, SolidWorks, Account pinned bottom) | Blue |
| Admin | `AdminShell` (`.theme-admin`) | Red |
| SolidWorks member (student or external) | `SwShell` (`.theme-sw`) | Teal |

## Student features
- **Auth & onboarding**: email sign-up with verification link, Google sign-in, onboarding with faculty → department → level dropdowns (no school field). Matric number optional.
- **Home**: overview, continue-where-you-left-off, featured courses/CBTs.
- **Drive** (`/drive/$course/$category/$subfolder`): course folders → categories → subfolders → files. Free and paid (gold) files. In-app viewer for PDF, images, video; Word/PowerPoint via Microsoft online viewer (needs public URL).
- **Purchases**: Paystack checkout; server sets price; `/payment/callback` verifies and unlocks the item.
- **My Library**: everything owned/purchased.
- **CBTs**: practice and live exams. Each answer autosaves per tap; server owns the clock (45s network grace); auto-submits at zero; refresh resumes the attempt. Exam screen stays minimal.
- **My attempts** (`/attempts`, `/attempts/$id`): history + answer review (all options shown, correct = green tick, wrong pick = red "Your answer", skipped = "Not answered"). Review locked when the CBT hides results.
- **Account**: profile card with Edit → Save/Cancel form, payment history, theme (light/dark/system).

## SolidWorks hub (`/solidworks/*`)
- Register (`/solidworks/register`) as student or external user.
- Numbered tasks (#1, #2…) with search by number; task details with reference images.
- Submit work with file uploads; admin grades with feedback.
- Works gallery (showcase), Q&A (questions + replies), Premium page, Settings (students edit school details only on the main PrepMaster account).

## Admin features (`/admin/*`)
- Dashboard stats.
- Courses: create (3-step wizard), subfolders, upload materials (name, folder, price).
- CBTs: 3-step creation wizard, edit, delete, show/hide results, results view. (AI weak-topic insights panel exists but uses sample data — parked.)
- Students: list, detail, warnings, suspension with reasons.
- Payments: all transactions.
- SolidWorks: tasks, submissions + grading, questions, users.

## Business rules
- Gold is used only for paid/premium signals.
- Prices in Naira; stored in kobo on the server.
- The browser is never trusted for prices, timers, or scoring.
- ~300 users expected: no load balancers, no raw WebSockets (Supabase Realtime if live updates are needed).

## Status
Frontend complete with a dummy-data mode. Backend in `backend/` is fully wired; goes live when env keys are set (see `SETUP.md`). Open item: AI insights on real CBT results (parked).
