import { resolve } from "node:path";

import { config } from "dotenv";
import { z } from "zod";

// Ensure root monorepo .env and local overrides are loaded in every execution context
const envCandidates = [
  resolve(process.cwd(), ".env.local"),
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
  resolve(__dirname, "../../.env"),
  resolve(__dirname, "../../../.env")
];

for (const path of envCandidates) {
  config({ path, quiet: true });
}

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  KLX_SITE_URL: z.string().url().default("https://klxluxeplus.poolpay.space"),
  KLX_OWNER_EMAIL: z.string().email().optional(),
  KLX_OWNER_PASSWORD: z.string().optional(),
  SUPER_ADMIN_EMAIL: z.string().email().optional(),
  SUPER_ADMIN_PASSWORD: z.string().optional(),
  KLX_SUPPORT_EMAIL: z
    .string()
    .email()
    .default(process.env.KLX_SUPPORT_EMAIL || process.env.CONTACT_EMAIL || "support@poolpay.space"),
  KLX_PHONE: z.string().default("+1 (607) 900-4569"),
  KLX_TIMEZONE: z.string().default("America/New_York"),
  KLX_CURRENCY: z.string().default("usd"),
  KLX_DB_NAME: z.string().default("klx_luxe_plus"),
  KLX_SESSION_COOKIE: z
    .string()
    .regex(/^[a-zA-Z0-9_]+$/)
    .default("klx_session"),
  KLX_DATABASE_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  KLX_STRIPE_MODE: z.enum(["test", "live"]).default("test"),
  STRIPE_TEST_SECRET_KEY: z.string().optional(),
  STRIPE_LIVE_SECRET_KEY: z.string().optional(),
  KLX_STRIPE_TEST_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_TEST_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  KLX_STRIPE_LIVE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_LIVE_WEBHOOK_SECRET: z.string().optional(),
  KLX_JOB_SECRET: z.string().optional(),
  KLX_MEDIA_DIR: z.string().default(".klx-media"),
  KLX_EMAIL_PROVIDER: z.enum(["smtp", "resend"]).optional(),
  EMAIL_PROVIDER: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  KLX_EMAIL_FROM: z
    .string()
    .email()
    .default(process.env.KLX_EMAIL_FROM || process.env.CONTACT_EMAIL || "support@poolpay.space"),
  CONTACT_EMAIL: z.string().email().optional()
});
export const env = schema.parse(process.env);
export function getOwnerCredentials() {
  const email = (env.KLX_OWNER_EMAIL || env.SUPER_ADMIN_EMAIL || "admin@poolpay.space")
    .toLowerCase()
    .trim();
  const password = env.KLX_OWNER_PASSWORD || env.SUPER_ADMIN_PASSWORD || "Admin123!";
  return { email, password };
}
export function getDatabaseUri() {
  const uri = env.KLX_DATABASE_URL || env.DATABASE_URL;
  if (!uri) throw new Error("Configure KLX_DATABASE_URL before using administration.");
  return uri;
}
export function getActiveStripeSecretKey() {
  return env.KLX_STRIPE_MODE === "live" ? env.STRIPE_LIVE_SECRET_KEY : env.STRIPE_TEST_SECRET_KEY;
}
export function getActiveStripeWebhookSecret() {
  return env.KLX_STRIPE_MODE === "live"
    ? env.KLX_STRIPE_LIVE_WEBHOOK_SECRET || env.STRIPE_LIVE_WEBHOOK_SECRET
    : env.KLX_STRIPE_TEST_WEBHOOK_SECRET ||
        env.STRIPE_TEST_WEBHOOK_SECRET ||
        env.STRIPE_WEBHOOK_SECRET;
}
