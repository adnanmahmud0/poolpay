import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { MongoMemoryServer } from "mongodb-memory-server";
import type Stripe from "stripe";

let mongo: MongoMemoryServer;
let database: typeof import("../src/server/db/client");
let commerce: typeof import("../src/server/commerce");
before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.KLX_DATABASE_URL = mongo.getUri();
  process.env.KLX_DB_NAME = "klx_commerce_test";
  process.env.KLX_STRIPE_MODE = "test";
  database = await import("../src/server/db/client");
  commerce = await import("../src/server/commerce");
  await database.ensureIndexes();
});
after(async () => {
  if (database) await (await database.getMongoClient()).close();
  if (mongo) await mongo.stop();
});
test("verified payment processing is idempotent and calculates deposit balances", async () => {
  const db = await database.getDb();
  await db
    .collection(database.COLLECTIONS.QUOTES)
    .insertOne({ id: "quote-test", amountCents: 10000, balanceCents: 10000, status: "pending" });
  await db.collection(database.COLLECTIONS.PAYMENTS).insertOne({
    id: "payment-test",
    quoteId: "quote-test",
    amountCents: 2500,
    currency: "usd",
    mode: "test",
    status: "pending",
    customerEmail: "test@example.com",
    refundedAmountCents: 0
  });
  const session = {
    id: "cs_test",
    metadata: { app: "klx", paymentId: "payment-test" },
    amount_total: 2500,
    currency: "usd",
    livemode: false,
    payment_status: "paid",
    payment_intent: "pi_test"
  } as unknown as Stripe.Checkout.Session;
  await Promise.all([commerce.syncSession(session), commerce.syncSession(session)]);
  const quote = await db.collection(database.COLLECTIONS.QUOTES).findOne({ id: "quote-test" });
  assert.equal(quote?.balanceCents, 7500);
  assert.equal(quote?.status, "deposit_paid");
  assert.equal(
    await db.collection(database.COLLECTIONS.OUTBOX).countDocuments({ type: "payment_received" }),
    1
  );
});
test("payment totals, environment and application metadata must match persisted records", async () => {
  const db = await database.getDb();
  await db.collection(database.COLLECTIONS.PAYMENTS).insertOne({
    id: "unpaid-test",
    quoteId: "quote-test",
    amountCents: 5000,
    currency: "usd",
    mode: "test",
    status: "pending",
    refundedAmountCents: 0
  });
  for (const overrides of [
    { amount_total: 1 },
    { livemode: true },
    { metadata: { app: "other", paymentId: "unpaid-test" } }
  ]) {
    await commerce.syncSession({
      id: "cs_wrong",
      metadata: { app: "klx", paymentId: "unpaid-test" },
      amount_total: 5000,
      currency: "usd",
      livemode: false,
      payment_status: "paid",
      ...overrides
    } as unknown as Stripe.Checkout.Session);
  }
  assert.equal(
    (await db.collection(database.COLLECTIONS.PAYMENTS).findOne({ id: "unpaid-test" }))?.status,
    "pending"
  );
});
test("concurrent refunds reserve the balance once and uncertain operations keep their lock", async () => {
  const db = await database.getDb();
  await db
    .collection(database.COLLECTIONS.PAYMENTS)
    .insertOne({ id: "refundable-test", amountCents: 10000, refundedAmountCents: 2000 });
  const results = await Promise.all([
    commerce.reserveRefund("refundable-test", 6000, "op-a"),
    commerce.reserveRefund("refundable-test", 6000, "op-b")
  ]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(await commerce.reserveRefund("refundable-test", 1, "op-c"), null);
  const payment = await db
    .collection(database.COLLECTIONS.PAYMENTS)
    .findOne({ id: "refundable-test" });
  assert.ok(await commerce.reserveRefund("refundable-test", 6000, payment?.refundOperation));
});
test("refunds cannot exceed the remaining balance or use invalid amounts", async () => {
  const db = await database.getDb();
  await db
    .collection(database.COLLECTIONS.PAYMENTS)
    .insertOne({ id: "partial-test", amountCents: 10000, refundedAmountCents: 9000 });
  assert.equal(await commerce.reserveRefund("partial-test", 1001, "too-large"), null);
  await assert.rejects(commerce.reserveRefund("partial-test", -1, "negative"));
  await assert.rejects(commerce.reserveRefund("partial-test", 0.5, "fraction"));
});
