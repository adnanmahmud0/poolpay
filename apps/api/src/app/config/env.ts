import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

// Load local apps/api/.env first, then fall back to workspace root .env
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../../../.env") });

const envSchema = z.object({
  PORT: z.string().default("5000"),
  IP: z.string().default("0.0.0.0"),
  DATABASE_URL: z.string().url("Invalid DB URL"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  BCRYPT_SALT_ROUND: z.string().default("10"),
  JWT_ACCESS_SECRET: z.string(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  OTP_EXPIRES: z.string().default("10m"),
  RESET_PASS_EXPIRES: z.string().default("10m"),

  SUPER_ADMIN_NAME: z.string().default("Super Admin"),
  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string(),
  ENCRYPTION_KEY: z.string().default("your-secret-32-character-key-here-1234"),

  EXPRESS_SESSION_SECRET: z.string().default("secret"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  BACKEND_URL: z.string().url().default("http://localhost:5000"),
  AUTH_SYSTEM: z.enum(["passport", "custom"]).default("custom"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Storage
  STORAGE_PROVIDER: z.enum(["cloudinary", "aws", "local", "digitalOcean"]).default("local"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),

  // DigitalOcean Spaces
  SPACES_ACCESS_KEY_ID: z.string().optional(),
  SPACES_SECRET_ACCESS_KEY: z.string().optional(),
  SPACES_ENDPOINT: z.string().optional(),
  SPACES_BUCKET_NAME: z.string().optional(),
  SPACES_REGION: z.string().optional(),

  // Email
  EMAIL_PROVIDER: z.enum(["smtp", "resend", "ses"]).default("smtp"),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FORM: z.string().email().optional(),

  // Redis
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.string().default("6379"),
  REDIS_USERNAME: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  DISABLE_REDIS_WORKERS_IN_DEV: z.string().default("false"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().optional(),

  // Firebase
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_MESSAGING_SERVICE_SID: z.string().optional(),
  SMS_ENABLED: z.string().default("false"),
  RATE_LIMITER_ENABLED: z.string().default("false"),
  SELF_PING_ENABLED: z.string().default("true"),
  SELF_PING_INTERVAL: z.string().default("10"), // in minutes


  // Mobile IAP Configuration
  GOOGLE_PLAY_PACKAGE_NAME: z.string().optional(),
  GOOGLE_PLAY_SERVICE_ACCOUNT_PATH: z.string().optional(),
  APPLE_SHARED_SECRET: z.string().optional(),
  GOOGLE_PLAY_REGULAR_PRODUCT_ID: z.string().optional(),
  GOOGLE_PLAY_VIP_PRODUCT_ID: z.string().optional(),
  APPLE_REGULAR_PRODUCT_ID: z.string().optional(),
  APPLE_VIP_PRODUCT_ID: z.string().optional(),
});

// 1. Check for Critical Required Environment Variables first
const CRITICAL_REQUIRED_KEYS = [
  { key: "DATABASE_URL", description: "MongoDB Connection URL" },
  { key: "JWT_ACCESS_SECRET", description: "JWT Access Token Secret" },
  { key: "JWT_REFRESH_SECRET", description: "JWT Refresh Token Secret" },
  { key: "SUPER_ADMIN_EMAIL", description: "Super Admin Initial Email" },
  { key: "SUPER_ADMIN_PASSWORD", description: "Super Admin Initial Password" }
];

const missingOrInvalidKeys = CRITICAL_REQUIRED_KEYS.filter(({ key }) => {
  const value = process.env[key];
  if (!value) return true;
  const trimmed = value.trim();
  if (
    trimmed === "" ||
    trimmed.startsWith("your_") ||
    trimmed.includes("your-secret") ||
    trimmed.includes("your_email") ||
    trimmed === "sk_test_..." ||
    trimmed === "whsec_..."
  ) {
    return true;
  }
  return false;
});

if (missingOrInvalidKeys.length > 0) {
  console.error("\n" + "=".repeat(80));
  console.error("🔴 CRITICAL CONFIGURATION ERROR: MISSING REQUIRED ENVIRONMENT VARIABLES");
  console.error("=".repeat(80));
  console.error("The following critical environment variables are missing, empty,");
  console.error("or using default placeholders in your .env file:\n");

  missingOrInvalidKeys.forEach(({ key, description }) => {
    console.error(`  ❌ [${key}]`);
    console.error(`     Purpose: ${description}`);
    console.error(`     Status:  Missing, empty, or using default placeholder value\n`);
  });

  console.error("👉 Please add these keys to your local .env file and restart the server.");
  console.error("=".repeat(80) + "\n");
  process.exit(1);
}

// 2. Perform full schematic validation using Zod
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("\n" + "=".repeat(80));
  console.error("⚠️  ENVIRONMENT SCHEMATIC VALIDATION ERROR");
  console.error("=".repeat(80));
  console.error("The following environment variables failed type or format validation:\n");

  const formattedErrors = parsedEnv.error.format();
  
  Object.entries(formattedErrors).forEach(([key, value]) => {
    if (key !== "_errors" && value && typeof value === "object" && "_errors" in value) {
      const fieldErrors = (value as { _errors: string[] })._errors;
      if (fieldErrors && fieldErrors.length > 0) {
        console.error(`  ❌ [${key}]`);
        console.error(`     Validation Error: ${fieldErrors.join(", ")}\n`);
      }
    }
  });

  console.error("👉 Please correct these values in your .env file and restart the server.");
  console.error("=".repeat(80) + "\n");
  process.exit(1);
}

export const envVars = {
  ...parsedEnv.data,
  // Mapping nested structures expected by original codebase
  CLOUDINARY: {
    CLOUDINARY_CLOUD_NAME: parsedEnv.data.CLOUDINARY_CLOUD_NAME?.trim(),
    CLOUDINARY_API_KEY: parsedEnv.data.CLOUDINARY_API_KEY?.trim(),
    CLOUDINARY_API_SECRET: parsedEnv.data.CLOUDINARY_API_SECRET?.trim(),
  },
  EMAIL_SENDER: {
    PROVIDER: parsedEnv.data.EMAIL_PROVIDER,
    RESEND_API_KEY: parsedEnv.data.RESEND_API_KEY,
    SMTP_HOST: parsedEnv.data.SMTP_HOST,
    SMTP_PORT: parsedEnv.data.SMTP_PORT,
    SMTP_USER: parsedEnv.data.SMTP_USER,
    SMTP_PASS: parsedEnv.data.SMTP_PASS,
    SMTP_FORM: parsedEnv.data.SMTP_FORM,
  },
  AWS: {
    AWS_ACCESS_KEY_ID: parsedEnv.data.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: parsedEnv.data.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: parsedEnv.data.AWS_REGION,
    AWS_BUCKET_NAME: parsedEnv.data.AWS_BUCKET_NAME,
  },
  SPACES: {
    SPACES_ACCESS_KEY_ID: parsedEnv.data.SPACES_ACCESS_KEY_ID?.trim(),
    SPACES_SECRET_ACCESS_KEY: parsedEnv.data.SPACES_SECRET_ACCESS_KEY?.trim(),
    SPACES_ENDPOINT: parsedEnv.data.SPACES_ENDPOINT?.trim(),
    SPACES_BUCKET_NAME: parsedEnv.data.SPACES_BUCKET_NAME?.trim(),
    SPACES_REGION: parsedEnv.data.SPACES_REGION?.trim() || "us-east-1",
  },
  TWILIO: {
    ACCOUNT_SID: parsedEnv.data.TWILIO_ACCOUNT_SID,
    AUTH_TOKEN: parsedEnv.data.TWILIO_AUTH_TOKEN,
    PHONE_NUMBER: parsedEnv.data.TWILIO_PHONE_NUMBER,
    MESSAGING_SERVICE_SID: parsedEnv.data.TWILIO_MESSAGING_SERVICE_SID,
    SMS_ENABLED: String(parsedEnv.data.SMS_ENABLED).toLowerCase().trim() === "true",
  },
  STRIPE: {
    CONNECT_WEBHOOK_SECRET: parsedEnv.data.STRIPE_CONNECT_WEBHOOK_SECRET,
  },
  RATE_LIMITER_ENABLED: String(parsedEnv.data.RATE_LIMITER_ENABLED).toLowerCase().trim() === "true",
  DISABLE_REDIS_WORKERS_IN_DEV: String(parsedEnv.data.DISABLE_REDIS_WORKERS_IN_DEV).toLowerCase().trim() === "true",
  SELF_PING_ENABLED: String(parsedEnv.data.SELF_PING_ENABLED).toLowerCase().trim() === "true",
  SELF_PING_INTERVAL: Number(parsedEnv.data.SELF_PING_INTERVAL) || 10,

  IAP: {
    GOOGLE_PLAY_PACKAGE_NAME: parsedEnv.data.GOOGLE_PLAY_PACKAGE_NAME || "com.poolpay.app",
    GOOGLE_PLAY_SERVICE_ACCOUNT_PATH: parsedEnv.data.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH,
    APPLE_SHARED_SECRET: parsedEnv.data.APPLE_SHARED_SECRET,
    GOOGLE_PLAY_REGULAR_PRODUCT_ID: parsedEnv.data.GOOGLE_PLAY_REGULAR_PRODUCT_ID || "regular_membership",
    GOOGLE_PLAY_VIP_PRODUCT_ID: parsedEnv.data.GOOGLE_PLAY_VIP_PRODUCT_ID || "vip_membership",
    APPLE_REGULAR_PRODUCT_ID: parsedEnv.data.APPLE_REGULAR_PRODUCT_ID || "regular_membership",
    APPLE_VIP_PRODUCT_ID: parsedEnv.data.APPLE_VIP_PRODUCT_ID || "vip_membership",
  },
};
