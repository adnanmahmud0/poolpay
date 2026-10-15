import { randomUUID } from "node:crypto";

import { env } from "@/env";

import { COLLECTIONS, getDb } from "./db/client";
import { enqueueOutbox, logAudit } from "./db/repositories";
import type { KlxQuote } from "./db/types";
import { HttpError } from "./http";
import { processOutbox } from "./mail";

export async function sendOrderLink(quote: KlxQuote, notificationId: string) {
  await enqueueOutbox(
    {
      type: "quote_sent",
      recipient: quote.customerEmail,
      subject: `Your order ${quote.quoteNumber} — secure payment link`,
      bodyHtml: "",
      bodyText: `KLX LUXE PLUS LLC\nOrder: ${quote.quoteNumber}\nService: ${quote.serviceName}\nTotal: ${(quote.amountCents / 100).toFixed(2)} ${quote.currency.toUpperCase()}\nReview your balance and pay securely: ${env.KLX_SITE_URL}/pay/${quote.token}\nValid until: ${quote.expiresAt.toISOString()}\nPayment does not confirm an appointment. Keep this private link confidential.`
    },
    notificationId
  );
  void processOutbox().catch(() => undefined);
}

export async function requestOrderLink(reference: string, email: string) {
  const number = reference.trim().toUpperCase().replace(/^KLX-/, "");
  const quote = await (await getDb()).collection<KlxQuote>(COLLECTIONS.QUOTES).findOne({
    quoteNumber: `KLX-${number}`,
    expiresAt: { $gt: new Date() },
    status: { $in: ["pending", "deposit_paid"] },
    balanceCents: { $gt: 0 }
  });
  if (quote && quote.customerEmail.toLowerCase() === email.trim().toLowerCase()) {
    await sendOrderLink(quote, `order-lookup-${quote.id}-${Math.floor(Date.now() / 600000)}`);
  }
  return {
    message:
      "If the reference and email match an active order, a payment link will be sent to that email. Check your inbox and spam folder, or contact support."
  };
}

export async function manageOrder(id: string, action: "resend" | "cancel", actorEmail: string) {
  const db = await getDb();
  const quote = await db.collection<KlxQuote>(COLLECTIONS.QUOTES).findOne({ id });
  if (!quote) throw new HttpError(404, "Order not found.");
  if (action === "resend") {
    if (quote.expiresAt <= new Date() || !["pending", "deposit_paid"].includes(quote.status))
      throw new HttpError(400, "This order is no longer payable. Create a new order if needed.");
    await sendOrderLink(quote, `order-resend-${randomUUID()}`);
  } else {
    const started = await db.collection(COLLECTIONS.PAYMENTS).findOne({ quoteId: id });
    if (started)
      throw new HttpError(
        409,
        "This order has a checkout history and cannot be cancelled here. Reconcile Stripe status first."
      );
    // Never cancel once checkout has started: a customer may be paying at Stripe.
    // Claim the quote first; checkout also requires an active status.
    const cancelled = await db.collection<KlxQuote>(COLLECTIONS.QUOTES).findOneAndUpdate(
      {
        id,
        status: "pending",
        balanceCents: quote.amountCents,
        checkoutStartedAt: { $exists: false },
        checkoutUntil: { $exists: false }
      },
      { $set: { status: "cancelled", updatedAt: new Date() } }
    );
    if (!cancelled)
      throw new HttpError(
        409,
        "Only unpaid orders with no checkout attempt can be cancelled. Reconcile started payments before contacting support."
      );
  }
  await logAudit({
    actorEmail,
    action: action === "resend" ? "ORDER_LINK_RESENT" : "ORDER_CANCELLED",
    entityType: "quote",
    entityId: id,
    details: {}
  });
  return { ok: true };
}
