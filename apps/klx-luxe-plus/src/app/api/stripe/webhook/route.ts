import { getActiveStripeWebhookSecret } from "@/env";

import { stripeClient, syncRefunds, syncSession } from "@/server/commerce";
import { COLLECTIONS, getDb } from "@/server/db/client";
import type { KlxPayment } from "@/server/db/types";
import { json } from "@/server/http";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = getActiveStripeWebhookSecret();
  if (!secret) return json({ error: "Webhook is not configured." }, 503);
  const stripe = stripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") || "",
      secret
    );
  } catch {
    return json({ error: "Invalid webhook signature." }, 400);
  }
  try {
    const db = await getDb();
    if (
      await db.collection(COLLECTIONS.STRIPE_EVENTS).findOne({ eventId: event.id, completed: true })
    )
      return json({ received: true });
    if (event.type.startsWith("checkout.session.")) {
      const session = event.data.object as { id: string };
      await syncSession(await stripe.checkout.sessions.retrieve(session.id));
    } else if (event.type.startsWith("refund.") || event.type === "charge.refunded") {
      const object = event.data.object as { payment_intent?: string | { id: string } | null };
      const pi =
        typeof object.payment_intent === "string"
          ? object.payment_intent
          : object.payment_intent?.id;
      if (pi) {
        const payment = await db
          .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
          .findOne({ stripePaymentIntentId: pi });
        if (payment) await syncRefunds(payment);
      }
    }
    await db
      .collection(COLLECTIONS.STRIPE_EVENTS)
      .updateOne(
        { eventId: event.id },
        { $set: { completed: true, processedAt: new Date() } },
        { upsert: true }
      );
    return json({ received: true });
  } catch {
    return json({ error: "Event processing failed; retry required." }, 503);
  }
}
