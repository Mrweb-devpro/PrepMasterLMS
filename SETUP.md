# PrepMaster — run it with the real backend

Without any keys the app runs on dummy data. Add the keys below and every page,
sign-in, upload, exam and payment goes through the real backend.

## 1. Supabase (database + sign-in)
1. Create a project at supabase.com.
2. SQL Editor → paste all of `backend/schema.sql` → Run.
3. Authentication → URL Configuration: Site URL `http://localhost:8080`, add redirect
   URLs `http://localhost:8080/` and `http://localhost:8080/login`.
4. (Optional) Authentication → Providers → Google: turn on and paste your Google OAuth client.
5. Sign up once in the app, then make yourself admin in the SQL Editor:
   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'you@example.com';
   ```

## 2. Cloudflare R2 (files)
1. R2 → Create bucket `prepmaster-files`.
2. Bucket → Settings → CORS policy — allow uploads from the app:
   ```json
   [{ "AllowedOrigins": ["http://localhost:8080"], "AllowedMethods": ["GET", "PUT"], "AllowedHeaders": ["*"] }]
   ```
3. R2 → Manage API tokens → create a token with Object Read & Write. Copy the account id, access key and secret.

## 3. Paystack (payments)
1. Settings → API Keys → copy the **test** secret key (`sk_test_...`).
2. Webhook (only needed once deployed): Settings → API Keys & Webhooks →
   Webhook URL `https://YOUR-API/v1/webhooks/paystack`.
   On localhost you can skip this — after paying, the app's "Payment status" page
   asks the server to confirm with Paystack directly.
3. Test card: `4084 0840 8408 4081`, any future date, CVV `408`, PIN `0000`, OTP `123456`.

## 4. Start the backend
```bash
cd backend
cp .env.example .env      # fill in Supabase, R2 and Paystack values
npm install
npm run dev               # http://localhost:4000/v1/health should say ok
```

## 5. Start the frontend
```bash
cp .env.example .env      # VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm install
npm run dev               # http://localhost:8080
```
The demo "Viewing as" switcher disappears once these are set.

## What to test
- Sign up (email link) or Google → finish setup → Home.
- Admin: create a course (with folders) → Upload file (set a price for a paid one) → create a CBT.
- Student: open a free file; tap a paid file → Pay → Paystack test card → back on
  "Payment successful" → the file opens and is in My library.
- Take a CBT: answers save on every tap; refresh mid-exam and you resume with the same
  time left; when time runs out it submits itself. Results appear in My attempts.
- SolidWorks: join, submit work with files, ask a question; admin grades and replies.

## Where things live
- Frontend switch: `src/lib/api/config.ts` (`LIVE`), API client `src/lib/api/client.ts`.
- Each feature's service picks real API or dummy data — pages don't change.
- API endpoints: `backend/src/routes/index.ts`.
