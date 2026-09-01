import Stripe from "stripe";
import { envVars } from "./env";

export const stripe = new Stripe(envVars.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
  appInfo: {
    name: "Community Savings App",
    version: "1.0.0",
  },
});
