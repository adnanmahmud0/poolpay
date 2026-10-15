import { randomBytes, randomUUID } from "node:crypto";

import Stripe from "stripe";

import { env, getActiveStripeSecretKey } from "@/env";

import { COLLECTIONS, getDb } from "./db/client";
import { enqueueOutbox, getSettings, logAudit } from "./db/repositories";
import type { KlxPayment, KlxQuote, KlxRefund } from "./db/types";
import { HttpError } from "./http";
import { processOutbox } from "./mail";
import { queueIntents, type NotificationIntent } from "./notifications";
import { quoteSchema } from "./validation";

export function stripeClient() {
  const key = getActiveStripeSecretKey();
  if (!key) throw new HttpError(503, "Stripe is not configured.");
  if (
    !key.startsWith(`sk_${env.KLX_STRIPE_MODE}_`) &&
    !key.startsWith(`rk_${env.KLX_STRIPE_MODE}_`)
  )
    throw new HttpError(503, "Stripe credentials do not match the selected payment mode.");
  return new Stripe(key, { maxNetworkRetries: 2 });
}
export async function reserveRefund(id: string, amount: number, operationId: string) {
  if (!Number.isSafeInteger(amount) || amount < 1)
    throw new HttpError(400, "Invalid refund amount.");
  return (await getDb()).collection<KlxPayment>(COLLECTIONS.PAYMENTS).findOneAndUpdate(
    {
      id,
      $or: [
        { refundOperation: { $exists: false }, reservedRefundCents: 0 },
        { refundOperation: { $exists: false }, reservedRefundCents: { $exists: false } },
        { refundOperation: operationId, reservedRefundCents: amount }
      ],
      $expr: { $gte: [{ $subtract: ["$amountCents", "$refundedAmountCents"] }, amount] }
    },
    { $set: { reservedRefundCents: amount, refundOperation: operationId } }
  );
}
export async function createPaymentRequest(input: unknown, actorEmail: string) {
  const data = quoteSchema.parse(input);
  data.customerEmail = data.customerEmail.trim().toLowerCase();
  const settings = await getSettings();
  const db = await getDb();
  const id = data.requestId || randomUUID();
  const existing = await db.collection<KlxQuote>(COLLECTIONS.QUOTES).findOne({ id });
  if (existing) {
    await queueIntents(COLLECTIONS.QUOTES, id).catch(() => undefined);
    return { id, link: `${env.KLX_SITE_URL}/pay/${existing.token}` };
  }
  const counter = await db
    .collection("klx_counters")
    .findOneAndUpdate(
      { key: "order_reference" },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: "after" }
    );
  const quote: KlxQuote = {
    ...data,
    id,
    token: randomBytes(32).toString("hex"),
    quoteNumber: `KLX-${String(100000 + Number(counter?.value)).padStart(6, "0")}`,
    balanceCents: data.amountCents,
    currency: settings.currency,
    status: "pending",
    expiresAt: new Date(Date.now() + data.expiresInDays * 86400000),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const link = `${env.KLX_SITE_URL}/pay/${quote.token}`;
  const notificationIntents: NotificationIntent[] = [
    {
      id: `quote-${id}-customer`,
      type: "quote_sent",
      recipient: data.customerEmail,
      subject: `Payment request ${quote.quoteNumber}`,
      bodyHtml: "",
      bodyText: `KLX LUXE PLUS LLC\nOrder: ${quote.quoteNumber}\n${data.serviceName}\nTotal: ${(data.amountCents / 100).toFixed(2)} ${settings.currency.toUpperCase()}\nReview and pay securely: ${link}\nValid until: ${quote.expiresAt.toISOString()}\nYou can request another link using your order reference and email at ${env.KLX_SITE_URL}/#pay-order.\nPayment does not confirm an appointment time.`
    }
  ];
  await db
    .collection(COLLECTIONS.QUOTES)
    .updateOne(
      { id },
      { $setOnInsert: { ...quote, notificationIntents, notificationQueued: false } },
      { upsert: true }
    );
  await queueIntents(COLLECTIONS.QUOTES, id).catch(() => undefined);
  void processOutbox().catch(() => undefined);
  await logAudit({
    actorEmail,
    action: "PAYMENT_REQUEST_CREATED",
    entityType: "quote",
    entityId: id,
    details: { amountCents: data.amountCents }
  });
  const saved = await db.collection<KlxQuote>(COLLECTIONS.QUOTES).findOne({ id });
  return { id, link: `${env.KLX_SITE_URL}/pay/${saved?.token || quote.token}` };
}
export async function checkout(token: string) {
  const db = await getDb();
  const quote = await db.collection<KlxQuote>(COLLECTIONS.QUOTES).findOne({
    token,
    expiresAt: { $gt: new Date() },
    status: { $in: ["pending", "deposit_paid"] },
    balanceCents: { $gt: 0 }
  });
  if (!quote) throw new HttpError(400, "This payment request is unavailable or already paid.");
  const stripe = stripeClient();
  const existing = await db
    .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
    .findOne({ quoteId: quote.id, status: "pending", mode: env.KLX_STRIPE_MODE });
  if (existing?.stripeSessionId) {
    const session = await stripe.checkout.sessions.retrieve(existing.stripeSessionId);
    if (session.status === "open" && session.url) return { url: session.url };
    if (session.status === "complete") {
      await syncSession(session);
      throw new HttpError(409, "Payment is processing. Refresh this page shortly.");
    }
    await db
      .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
      .updateOne({ id: existing.id }, { $set: { status: "failed" } });
  }
  const locked = await db.collection(COLLECTIONS.QUOTES).findOneAndUpdate(
    {
      id: quote.id,
      status: { $in: ["pending", "deposit_paid"] },
      balanceCents: quote.balanceCents,
      $or: [{ checkoutUntil: { $exists: false } }, { checkoutUntil: { $lt: new Date() } }]
    },
    { $set: { checkoutUntil: new Date(Date.now() + 120000), checkoutStartedAt: new Date() } }
  );
  if (!locked) throw new HttpError(409, "A checkout is being prepared. Try again shortly.");
  const id = existing && !existing.stripeSessionId ? existing.id : randomUUID();
  const amount =
    quote.status === "pending" && quote.depositCents > 0
      ? Math.min(quote.depositCents, quote.balanceCents)
      : quote.balanceCents;
  await db.collection<KlxPayment>(COLLECTIONS.PAYMENTS).updateOne(
    { id },
    {
      $setOnInsert: {
        id,
        quoteId: quote.id,
        customerEmail: quote.customerEmail,
        amountCents: amount,
        refundedAmountCents: 0,
        currency: quote.currency,
        status: "pending",
        mode: env.KLX_STRIPE_MODE,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  // A persisted operation ID lets retries recover a session after an uncertain provider response.
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: quote.customerEmail,
      metadata: { app: "klx", paymentId: id },
      payment_intent_data: { metadata: { app: "klx", paymentId: id } },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: quote.currency,
            unit_amount: amount,
            product_data: { name: quote.serviceName }
          }
        }
      ],
      success_url: `${env.KLX_SITE_URL}/pay/${token}?returned=1`,
      cancel_url: `${env.KLX_SITE_URL}/pay/${token}`
    },
    { idempotencyKey: `klx-checkout-${id}` }
  );
  await db
    .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
    .updateOne({ id }, { $set: { stripeSessionId: session.id } });
  await db
    .collection(COLLECTIONS.QUOTES)
    .updateOne({ id: quote.id }, { $unset: { checkoutUntil: "" } });
  return { url: session.url };
}
export async function syncSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.app !== "klx") return;
  const db = await getDb();
  const payment = await db
    .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
    .findOne({ id: session.metadata.paymentId });
  if (
    !payment ||
    payment.mode !== (session.livemode ? "live" : "test") ||
    payment.amountCents !== session.amount_total ||
    payment.currency !== session.currency
  )
    return;
  const pi =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  if (session.payment_status !== "paid") {
    if (session.status === "expired")
      await db
        .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
        .updateOne({ id: payment.id, status: "pending" }, { $set: { status: "failed" } });
    return;
  }
  await db.collection<KlxPayment>(COLLECTIONS.PAYMENTS).updateOne(
    { id: payment.id, status: { $in: ["pending", "failed"] } },
    {
      $set: {
        status: "paid",
        stripePaymentIntentId: pi,
        stripeSessionId: session.id,
        updatedAt: new Date()
      }
    }
  );
  // Account each payment exactly once, including concurrent or retried webhook deliveries.
  await db
    .collection(COLLECTIONS.QUOTES)
    .updateOne({ id: payment.quoteId, accountedPaymentIds: { $ne: payment.id } }, [
      {
        $set: {
          accountedPaymentIds: {
            $concatArrays: [{ $ifNull: ["$accountedPaymentIds", []] }, [payment.id]]
          },
          balanceCents: { $max: [0, { $subtract: ["$balanceCents", payment.amountCents] }] },
          updatedAt: new Date()
        }
      },
      { $set: { status: { $cond: [{ $eq: ["$balanceCents", 0] }, "fully_paid", "deposit_paid"] } } }
    ]);
  const settings = await getSettings();
  if (settings.notificationSettings.emailOnPayment) {
    await enqueueOutbox(
      {
        type: "payment_received",
        recipient: payment.customerEmail,
        subject: "Payment received — KLX LUXE PLUS LLC",
        bodyHtml: "",
        bodyText: `We received ${(payment.amountCents / 100).toFixed(2)} ${payment.currency.toUpperCase()}. Contact support@poolpay.space for assistance.`
      },
      `payment-${payment.id}-customer`
    );
    void processOutbox().catch(() => undefined);
  }
}
export async function syncRefunds(payment: KlxPayment) {
  if (!payment.stripePaymentIntentId || payment.mode !== env.KLX_STRIPE_MODE) return;
  const db = await getDb();
  const syncToken = randomUUID();
  const lease = await db.collection(COLLECTIONS.PAYMENTS).findOneAndUpdate(
    {
      id: payment.id,
      $or: [{ refundSyncUntil: { $exists: false } }, { refundSyncUntil: { $lt: new Date() } }]
    },
    { $set: { refundSyncUntil: new Date(Date.now() + 120000), refundSyncToken: syncToken } }
  );
  if (!lease) throw new HttpError(409, "This payment is already being synchronized. Please retry.");
  try {
    let refunded = 0;
    let reserved = 0;
    for await (const refund of stripeClient().refunds.list({
      payment_intent: payment.stripePaymentIntentId,
      limit: 100
    })) {
      const status =
        refund.status === "succeeded"
          ? "succeeded"
          : refund.status === "failed"
            ? "failed"
            : refund.status === "canceled"
              ? "cancelled"
              : "pending";
      if (status === "succeeded") refunded += refund.amount;
      if (status === "pending") reserved += refund.amount;
      const operationId = refund.metadata?.operationId || refund.id;
      await db.collection<KlxRefund>(COLLECTIONS.REFUNDS).updateOne(
        { id: operationId },
        {
          $set: { stripeRefundId: refund.id, status, updatedAt: new Date() },
          $setOnInsert: {
            id: operationId,
            paymentId: payment.id,
            amountCents: refund.amount,
            reason: "Stripe Dashboard",
            idempotencyKey: operationId,
            adminEmail: "stripe",
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
    }
    const uncertain = await db
      .collection<KlxRefund>(COLLECTIONS.REFUNDS)
      .find({ paymentId: payment.id, status: "pending", stripeRefundId: { $exists: false } })
      .toArray();
    reserved += uncertain.reduce((sum, operation) => sum + operation.amountCents, 0);
    await db.collection<KlxPayment>(COLLECTIONS.PAYMENTS).updateOne(
      { id: payment.id },
      {
        $set: {
          refundedAmountCents: refunded,
          status:
            refunded === payment.amountCents
              ? "refunded"
              : refunded > 0
                ? "partially_refunded"
                : "paid",
          updatedAt: new Date()
        }
      }
    );
    const current = await db
      .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
      .findOne({ id: payment.id });
    if (current?.refundOperation) {
      const operation = await db
        .collection<KlxRefund>(COLLECTIONS.REFUNDS)
        .findOne({ id: current.refundOperation });
      if (operation && operation.status !== "pending")
        await db
          .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
          .updateOne(
            { id: payment.id, refundOperation: current.refundOperation },
            { $set: { reservedRefundCents: reserved }, $unset: { refundOperation: "" } }
          );
    } else {
      await db
        .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
        .updateOne(
          { id: payment.id, refundOperation: { $exists: false } },
          { $set: { reservedRefundCents: reserved } }
        );
    }
  } finally {
    await db
      .collection(COLLECTIONS.PAYMENTS)
      .updateOne(
        { id: payment.id, refundSyncToken: syncToken },
        { $unset: { refundSyncUntil: "", refundSyncToken: "" } }
      );
  }
}
export async function refundPayment(
  id: string,
  amount: number,
  reason: string,
  operationId: string,
  actorEmail: string
) {
  const db = await getDb();
  const payment = await db
    .collection<KlxPayment>(COLLECTIONS.PAYMENTS)
    .findOne({ id, mode: env.KLX_STRIPE_MODE, status: { $in: ["paid", "partially_refunded"] } });
  if (!payment?.stripePaymentIntentId)
    throw new HttpError(400, "This payment cannot be refunded in the current mode.");
  // Reconcile by provider metadata before retrying an operation whose response may have been lost.
  await syncRefunds(payment);
  const previous = await db
    .collection<KlxRefund>(COLLECTIONS.REFUNDS)
    .findOne({ idempotencyKey: operationId });
  if (previous && previous.paymentId !== id) throw new HttpError(409, "Refund operation mismatch.");
  if (previous?.stripeRefundId) return { ok: true };
  if (!previous) {
    // Serialize refunds per payment; retain the lock if the provider result is uncertain.
    const locked = await reserveRefund(id, amount, operationId);
    if (!locked)
      throw new HttpError(
        409,
        "Another refund is pending or the amount exceeds the refundable balance."
      );
    await db.collection<KlxRefund>(COLLECTIONS.REFUNDS).insertOne({
      id: operationId,
      paymentId: id,
      amountCents: amount,
      reason,
      status: "pending",
      idempotencyKey: operationId,
      adminEmail: actorEmail,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  let refund;
  try {
    refund = await stripeClient().refunds.create(
      {
        payment_intent: payment.stripePaymentIntentId,
        amount: previous?.amountCents ?? amount,
        metadata: { app: "klx", operationId }
      },
      { idempotencyKey: `klx-refund-${operationId}` }
    );
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError) {
      await db
        .collection<KlxRefund>(COLLECTIONS.REFUNDS)
        .updateOne({ id: operationId }, { $set: { status: "failed", updatedAt: new Date() } });
      await syncRefunds(payment);
    }
    throw error;
  }
  await db
    .collection<KlxRefund>(COLLECTIONS.REFUNDS)
    .updateOne({ id: operationId }, { $set: { stripeRefundId: refund.id } });
  await syncRefunds(payment);
  await logAudit({
    actorEmail,
    action: "REFUND_REQUESTED",
    entityType: "payment",
    entityId: id,
    details: { amount, reason, stripeRefundId: refund.id }
  });
  await enqueueOutbox({
    type: "refund_processed",
    recipient: payment.customerEmail,
    subject: "Refund update — KLX LUXE PLUS LLC",
    bodyHtml: "",
    bodyText: `A refund of ${(amount / 100).toFixed(2)} ${payment.currency.toUpperCase()} was requested to your original payment method. Status: ${refund.status}. Bank processing times vary.`
  });
  void processOutbox().catch(() => undefined);
  return { ok: true };
}
