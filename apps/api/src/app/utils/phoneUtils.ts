import crypto from "crypto";

/**
 * Normalizes a phone number to E.164 format.
 * Strips all non-digit characters and ensures it starts with a plus sign.
 * If no plus sign is present, it attempts to clean and prefix based on basic assumptions.
 */
export const normalizePhone = (phone: string): string => {
  if (!phone) return "";
  
  // Strip all non-digits except the leading +
  let cleaned = phone.trim();
  const startsWithPlus = cleaned.startsWith("+");
  cleaned = cleaned.replace(/\D/g, "");
  
  if (startsWithPlus) {
    return `+${cleaned}`;
  }
  
  // Default to + if not present (simple assumption for E.164)
  return `+${cleaned}`;
};

/**
 * Generates an HMAC-SHA256 hash of the normalized phone number for unique indexing.
 * Uses the secret ENCRYPTION_KEY as the cryptographic pepper to secure low-entropy input data.
 */
export const generatePhoneHash = (normalizedPhone: string): string => {
  if (!normalizedPhone) return "";
  const secret = process.env.ENCRYPTION_KEY || "fallback-pepper-for-poolpay-123456789";
  return crypto.createHmac("sha256", secret).update(normalizedPhone).digest("hex");
};

/**
 * Generates an HMAC-SHA256 hash of the Stripe Customer ID for unique indexing.
 * Uses the secret ENCRYPTION_KEY as the cryptographic pepper.
 */
export const generateStripeCustomerIdHash = (stripeCustomerId: string): string => {
  if (!stripeCustomerId) return "";
  const secret = process.env.ENCRYPTION_KEY || "fallback-pepper-for-poolpay-123456789";
  return crypto.createHmac("sha256", secret).update(stripeCustomerId).digest("hex");
};
