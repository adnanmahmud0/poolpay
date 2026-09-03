import Stripe from "stripe";
import { envVars } from "./env";
import { getCurrentAppEnvironment } from "./dbConnect";

let testStripeClient: Stripe | null = null;
let liveStripeClient: Stripe | null = null;

/**
 * Dynamically returns the active Stripe client based on the current app environment.
 * Automatically switches between Test and Production Stripe accounts at runtime.
 */
export function getStripeClient(): Stripe {
  const env = getCurrentAppEnvironment();

  if (env === "production") {
    const liveKey = envVars.STRIPE.LIVE.SECRET_KEY;
    if (liveKey && !liveKey.includes("REPLACE_WHEN_READY")) {
      if (!liveStripeClient) {
        liveStripeClient = new Stripe(liveKey, {
          apiVersion: "2025-02-24.acacia",
          appInfo: {
            name: "PoolPay",
            version: "1.0.0",
          },
        });
      }
      return liveStripeClient;
    }
  }

  const testKey = envVars.STRIPE.TEST.SECRET_KEY || envVars.STRIPE_SECRET_KEY || "";
  if (!testStripeClient) {
    testStripeClient = new Stripe(testKey, {
      apiVersion: "2025-02-24.acacia",
      appInfo: {
        name: "PoolPay",
        version: "1.0.0",
      },
    });
  }
  return testStripeClient;
}

/**
 * Transparent proxy that delegates all Stripe operations to the active environment client.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const client = getStripeClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});
