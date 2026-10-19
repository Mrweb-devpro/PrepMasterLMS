# PrepMaster — API Contracts

Base URL: `VITE_API_URL` (e.g. `http://localhost:4000/v1`). All routes below are relative to `/v1`.

## Conventions

- **Auth**: `Authorization: Bearer <supabase access_token>` on every route except Public ones. The frontend client (`src/lib/api/client.ts`) attaches it automatically.
- **Body**: JSON. Validated with zod in `backend/src/validators/schemas.ts`.
- **Money**: stored and sent by the server in **kobo** (integer). The UI divides by 100 for Naira.
- **Dates**: ISO 8601 strings (UTC).
- **Errors**: `{ "error": { "code": string, "message": string } }` with status 400 (validation), 401 (no/invalid token), 403 (not allowed / suspended), 404, 409 (conflict, e.g. attempt already submitted), 500.
- **Roles**: `student` | `admin`. "Admin" routes use `requireAdmin`.

## Public

| Method | Path                 | Notes                                                                            |
| ------ | -------------------- | -------------------------------------------------------------------------------- |
| GET    | `/health`            | `{ ok: true }`                                                                   |
| POST   | `/auth/check-email`  | `{ email }` → `{ available, inUse }`; used before sign-up advances beyond account details. |
| POST   | `/webhooks/paystack` | Paystack signature (`x-paystack-signature`) verified. Backup to verify endpoint. |

## Me (current user)

| Method | Path             | Body                                                                                   | Returns                                    |
| ------ | ---------------- | -------------------------------------------------------------------------------------- | ------------------------------------------ |
| GET    | `/me`            | —                                                                                      | `{ profile, warnings }` — 403 if suspended |
| PATCH  | `/me`            | `{ firstName?, lastName?, faculty?, department?, level?, dob?, heard?, gender?, avatarUrl? }` | `{ profile }`                              |
| POST   | `/me/solidworks` | `{ user_type: "student" \| "freelancer", ... }`                                        | `{ profile }` (sw_registered = true)       |
| GET    | `/me/library`    | —                                                                                      | owned materials + CBTs                     |
| GET    | `/me/payments`   | —                                                                                      | `Payment[]`                                |

`profile` shape: `{ id, first_name, last_name, email, role, faculty, department, level, sw_registered, suspended, created_at }`.
`warning` shape: `{ id, reason, created_at, issued_by }`.

Avatar profile fields: `gender: "male" | "female" | "other" | "prefer_not_to_say" | null` and `avatar_url: string | null` are returned in `profile`. `PATCH /me` accepts camelCase `{ gender?, avatarUrl? }`, including null to clear; avatar URLs must be valid URLs of at most 500 characters. The service maps `avatarUrl` to `avatar_url`.

## Catalog

| GET | `/catalog` | Role-aware list of courses → subfolders → materials, and CBTs, each with `owned: boolean` and `price` (kobo). |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------- |

## Courses (admin)

| Method | Path                      | Body                                                                                      |
| ------ | ------------------------- | ----------------------------------------------------------------------------------------- |
| POST   | `/courses`                | `{ title, slug, description? }`                                                           |
| DELETE | `/courses/:id`            | —                                                                                         |
| POST   | `/courses/:id/subfolders` | `{ name, category }`                                                                      |
| POST   | `/courses/:id/uploads`    | `{ filename, contentType }` → `{ uploadUrl, key }` (presigned PUT, upload directly to R2) |
| POST   | `/courses/:id/materials`  | `{ name, subfolder_id, key, price }`                                                      |

## Materials

| Method | Path                      | Notes                                                                         |
| ------ | ------------------------- | ----------------------------------------------------------------------------- |
| GET    | `/materials/:id/download` | Access-checked → `{ url }` short-lived signed URL. 403 if paid and not owned. |
| PATCH  | `/materials/:id`          | Admin. `{ title?, category?, subfolder?, priceKobo? }`                                    |
| DELETE | `/materials/:id`          | Admin.                                                                        |

## CBTs

| Method               | Path              | Body / Returns                                                                                                                                              |
| -------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST                 | `/cbts/:id/start` | → `{ attempt: { id, started_at, deadline, status }, questions }`. Resumes an active attempt if one exists. Questions never include the correct answer.      |
| POST                 | `/cbts/admin`     | Admin create `{ title, course_id, mode: "practice" \| "live", duration_minutes, status: "draft" \| "pending" \| "live", show_results, price, questions[] }` |
| GET / PATCH / DELETE | `/cbts/admin/:id` | Admin read / edit (details + questions, any status) / delete                                                                                                |

## Attempts

| Method | Path                    | Body / Returns                                                          |
| ------ | ----------------------- | ----------------------------------------------------------------------- |
| GET    | `/attempts`             | Current user's attempts                                                 |
| PUT    | `/attempts/:id/answers` | `{ question_id, option_index }` — rejected (409) after `deadline + 45s` |
| POST   | `/attempts/:id/submit`  | → `{ score, total, status: "submitted" \| "timed_out" }`                |
| GET    | `/attempts/:id/result`  | Full review (options, correct, chosen). 403 when CBT hides results.     |

## Payments

| Method | Path                          | Body / Returns                                                                                             |
| ------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| POST   | `/payments/checkout`          | `{ item_type: "material" \| "cbt", item_id }` → `{ authorization_url, reference }`. Server sets the price. |
| GET    | `/payments/:reference`        | Payment status                                                                                             |
| POST   | `/payments/:reference/verify` | Verifies with Paystack, grants access, idempotent                                                          |
| GET    | `/payments/admin/all`         | Admin: all transactions                                                                                    |

## SolidWorks (`/solidworks`)

- `GET /tasks`, `GET /tasks/:id`; admin `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`.
- `GET /submissions` (mine; admin sees all), `GET /submissions/:id`, `POST /submissions/uploads` (presigned PUT), `POST /submissions` `{ task_id, files[], note? }`, admin `PATCH /submissions/:id/grade` `{ score, feedback }`.
- `GET /works` (graded showcase), `GET /works/:id`.
- `GET /questions`, `GET /questions/:id`, `POST /questions` `{ title, body, task_id? }`, `PATCH /questions/:id`, `POST /questions/:id/responses` `{ body }`.
- Admin `GET /users`, `GET /users/:id` (profile, submissions, task count, questions).

## Admin students (`/admin/students`)

| Method | Path                            | Body                                   |
| ------ | ------------------------------- | -------------------------------------- |
| GET    | `/admin/students`               | — (query uses `warnings!user_id(...)`) |
| GET    | `/admin/students/:id`           | —                                      |
| POST   | `/admin/students/:id/warnings`  | `{ reason }`                           |
| POST   | `/admin/students/:id/suspend`   | `{ reason }`                           |
| POST   | `/admin/students/:id/unsuspend` | —                                      |

> If an endpoint here disagrees with `backend/src/routes/index.ts`, the route file is the source of truth — update this doc.
