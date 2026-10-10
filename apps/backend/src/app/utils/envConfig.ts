import { envVars } from "../config/env";
import { getCurrentAppEnvironment } from "../config/dbConnect";

/**
 * Returns the active Stripe credentials based on the current `appEnvironment`.
 * Falls back to test keys if live keys are not yet configured.
 */
function getActiveEnvironment(): "test" | "production" {
  return getCurrentAppEnvironment();
}

export async function getActiveStripeSecretKey(): Promise<string> {
  const env = await getActiveEnvironment();
  if (env === "production") {
    const liveKey = envVars.STRIPE.LIVE.SECRET_KEY;
    if (liveKey && !liveKey.includes("REPLACE_WHEN_READY")) return liveKey;
  }
  return envVars.STRIPE.TEST.SECRET_KEY || envVars.STRIPE_SECRET_KEY || "";
}

export async function getActiveStripePublishableKey(): Promise<string> {
  const env = await getActiveEnvironment();
  if (env === "production") {
    const liveKey = envVars.STRIPE.LIVE.PUBLISHABLE_KEY;
    if (liveKey && !liveKey.includes("REPLACE_WHEN_READY")) return liveKey;
  }
  return (
    envVars.STRIPE.TEST.PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    ""
  );
}

export async function getActiveStripeWebhookSecret(): Promise<string> {
  const env = await getActiveEnvironment();
  if (env === "production") {
    const liveSecret = envVars.STRIPE.LIVE.WEBHOOK_SECRET;
    if (liveSecret && !liveSecret.includes("REPLACE_WHEN_READY"))
      return liveSecret;
  }
  return envVars.STRIPE.TEST.WEBHOOK_SECRET || "";
}

export async function getActiveStripeConnectWebhookSecret(): Promise<string> {
  const env = await getActiveEnvironment();
  if (env === "production") {
    const liveSecret = envVars.STRIPE.LIVE.CONNECT_WEBHOOK_SECRET;
    if (liveSecret && !liveSecret.includes("REPLACE_WHEN_READY"))
      return liveSecret;
  }
  return (
    envVars.STRIPE.TEST.CONNECT_WEBHOOK_SECRET ||
    envVars.STRIPE.CONNECT_WEBHOOK_SECRET ||
    ""
  );
}

/** Returns the complete active config for a given moment */
export async function getActiveStripeConfig() {
  const env = await getActiveEnvironment();
  return {
    environment: env,
    secretKey: await getActiveStripeSecretKey(),
    publishableKey: await getActiveStripePublishableKey(),
    webhookSecret: await getActiveStripeWebhookSecret(),
    connectWebhookSecret: await getActiveStripeConnectWebhookSecret(),
  };
}
