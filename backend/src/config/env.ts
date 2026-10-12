import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(4000),
  CORS_ORIGINS: z.string().default("http://localhost:8080"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  PAYSTACK_SECRET_KEY: z.string().min(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

/** Grace period after the deadline for answers already in flight (slow networks). */
export const SUBMIT_GRACE_MS = 45_000;
