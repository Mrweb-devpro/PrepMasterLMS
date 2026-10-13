# PrepMaster API

Hono + Node.js API for PrepMaster. Supabase (database + login), Cloudflare R2 (files), Paystack (payments).

## Setup
1. In Supabase, open the SQL editor and run `schema.sql`.
2. Make yourself an admin (after signing up once):
   `insert into public.user_roles (user_id, role) values ('<your-user-id>', 'admin');`
3. `cp .env.example .env` and fill in the values.
4. `npm install && npm run dev` → http://localhost:4000/v1/health
5. In Paystack, set the webhook URL to `https://<your-api>/v1/webhooks/paystack`.

## Structure (Model / Service / Controller)
```text
src/
  config/       env validation
  lib/          supabase, r2, paystack, errors
  models/       types (rows + API shapes)
  validators/   zod request schemas
  services/     business logic (all rules live here)
  controllers/  read request -> call service -> respond
  middleware/   auth (Supabase token + role), errors
  routes/       mounts controllers under /v1
```

## CBT timer rules
- The server sets `deadline` when an attempt starts; the browser timer is display only.
- Answers autosave per click and are rejected after `deadline + 45s`.
- Late submits are graded only on answers saved before the cutoff, and marked `expired`.
- Abandoned attempts are auto-submitted every minute.
- Correct answers are never sent until the attempt is finished.

## Endpoints (all need `Authorization: Bearer <supabase token>` unless noted)
| Method | Path | Who |
|---|---|---|
| GET | /v1/health | public |
| POST | /v1/webhooks/paystack | Paystack (signed) |
| GET/PATCH | /v1/me, GET /v1/me/library | student |
| GET | /v1/courses, /v1/courses/:slug | student |
| GET | /v1/materials/:id/download | student (paid/free) |
| GET | /v1/cbts · POST /v1/cbts/:id/start | student |
| GET | /v1/attempts · PUT /:id/answers · POST /:id/submit · GET /:id/result | student |
| POST | /v1/payments/checkout · GET /v1/payments/:reference | student |
| POST | /v1/courses · /:id/uploads · /:id/materials | admin |
| POST | /v1/cbts/admin · GET /admin/:id · PATCH /admin/:id/publish | admin |
| GET/POST | /v1/admin/students (/:id, /suspend, /restore, /warn) | admin |
| GET | /v1/payments/admin/all | admin |
