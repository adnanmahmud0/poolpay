import "./load-env";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  const mongo = await MongoMemoryServer.create();
  process.env.KLX_DATABASE_URL = mongo.getUri();
  process.env.KLX_DB_NAME = "klx_sandbox_verification";
  process.env.KLX_STRIPE_MODE = "test";
  const { getDb, getMongoClient, ensureIndexes, COLLECTIONS } =
    await import("../src/server/db/client");
  const { stripeClient, refundPayment } = await import("../src/server/commerce");
  try {
    await ensureIndexes();
    const stripe = stripeClient();
    const id = randomUUID();
    const intent = await stripe.paymentIntents.create({
      amount: 100,
      currency: "usd",
      payment_method: "pm_card_visa",
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { app: "klx", purpose: "sandbox-verification", paymentId: id }
    });
    assert.equal(intent.livemode, false);
    assert.equal(intent.status, "succeeded");
    const db = await getDb();
    await db
      .collection(COLLECTIONS.PAYMENTS)
      .insertOne({
        id,
        quoteId: "sandbox",
        customerEmail: "review@example.com",
        stripePaymentIntentId: intent.id,
        amountCents: 100,
        refundedAmountCents: 0,
        currency: "usd",
        status: "paid",
        mode: "test",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    await refundPayment(id, 40, "Sandbox verification", randomUUID(), "support@poolpay.space");
    assert.equal(
      (await db.collection(COLLECTIONS.PAYMENTS).findOne({ id }))?.refundedAmountCents,
      40
    );
    await refundPayment(id, 60, "Sandbox verification", randomUUID(), "support@poolpay.space");
    const payment = await db.collection(COLLECTIONS.PAYMENTS).findOne({ id });
    assert.equal(payment?.refundedAmountCents, 100);
    assert.equal(payment?.status, "refunded");
    process.stdout.write(
      "Stripe sandbox verified: test payment, partial refund, remaining refund, and synchronized status. No live funds used.\n"
    );
  } finally {
    await (await getMongoClient()).close();
    await mongo.stop();
  }
}
main().catch(() => {
  process.stderr.write(
    "Stripe sandbox verification failed. Check test-key permissions and provider configuration. No live mode was enabled.\n"
  );
  process.exit(1);
});
