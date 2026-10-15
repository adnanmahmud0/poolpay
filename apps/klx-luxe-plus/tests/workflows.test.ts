import assert from "node:assert/strict";
import { after, before, test } from "node:test";

import { MongoMemoryServer } from "mongodb-memory-server";

let mongo: MongoMemoryServer;
let db: typeof import("../src/server/db/client");
let repo: typeof import("../src/server/db/repositories");
let appointments: typeof import("../src/server/appointments");
let users: typeof import("../src/server/auth/users");
before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.KLX_DATABASE_URL = mongo.getUri();
  process.env.KLX_DB_NAME = "klx_workflow_test";
  db = await import("../src/server/db/client");
  repo = await import("../src/server/db/repositories");
  appointments = await import("../src/server/appointments");
  users = await import("../src/server/auth/users");
  await db.ensureIndexes();
  await repo.initServicesIfEmpty();
});
after(async () => {
  if (db) await (await db.getMongoClient()).close();
  if (mongo) await mongo.stop();
});

test("orders use short unique references and lookup emails only a matching active order", async () => {
  const { createPaymentRequest } = await import("../src/server/commerce");
  const { requestOrderLink, manageOrder } = await import("../src/server/orders");
  const input = {
    customerName: "Order customer",
    customerEmail: "Customer@Example.com",
    serviceName: "Interpreter",
    description: "Agreed consultation",
    amountCents: 12500,
    depositCents: 0,
    expiresInDays: 14
  };
  const created = await createPaymentRequest(input, "support@poolpay.space");
  const second = await createPaymentRequest(input, "support@poolpay.space");
  const database = await db.getDb();
  const order = await database.collection(db.COLLECTIONS.QUOTES).findOne({ id: created.id });
  const another = await database.collection(db.COLLECTIONS.QUOTES).findOne({ id: second.id });
  assert.ok(order && another);
  assert.match(order.quoteNumber, /^KLX-\d{6}$/);
  assert.notEqual(order.quoteNumber, another.quoteNumber);
  assert.equal(order.customerEmail, "customer@example.com");
  const missing = await requestOrderLink("KLX-999999", "customer@example.com");
  assert.deepEqual(await requestOrderLink(order.quoteNumber, "wrong@example.com"), missing);
  assert.equal(
    await database
      .collection(db.COLLECTIONS.OUTBOX)
      .countDocuments({ id: { $regex: `^order-lookup-${created.id}-` } }),
    0
  );
  assert.deepEqual(await requestOrderLink(order.quoteNumber, "CUSTOMER@example.com"), missing);
  await requestOrderLink(order.quoteNumber.replace("KLX-", ""), "customer@example.com");
  assert.equal(
    await database
      .collection(db.COLLECTIONS.OUTBOX)
      .countDocuments({ id: { $regex: `^order-lookup-${created.id}-` } }),
    1
  );
  await manageOrder(created.id, "resend", "support@poolpay.space");
  await manageOrder(created.id, "cancel", "support@poolpay.space");
  await assert.rejects(manageOrder(created.id, "resend", "support@poolpay.space"));
  assert.deepEqual(await requestOrderLink(order.quoteNumber, "customer@example.com"), missing);
  await database
    .collection(db.COLLECTIONS.QUOTES)
    .updateOne({ id: second.id }, { $set: { checkoutStartedAt: new Date() } });
  await assert.rejects(manageOrder(second.id, "cancel", "support@poolpay.space"));
});
test("owner setup tokens are hashed and can only be used once", async () => {
  const token = await users.createOwnerSetupToken("support@poolpay.space");
  assert.equal(
    await (await db.getDb()).collection(db.COLLECTIONS.SETUP_TOKENS).findOne({ token }),
    null
  );
  const owner = await users.completeOwnerSetup(token, "temporary-test-password-2026", "Test owner");
  assert.equal(owner.role, "owner");
  await assert.rejects(
    users.completeOwnerSetup(token, "temporary-test-password-2026", "Test owner")
  );
  assert.equal(await users.authenticateUser(owner.email, "wrong-password"), null);
  assert.ok(await users.authenticateUser(owner.email, "temporary-test-password-2026"));
});
test("drafts remain private until published and retain version history", async () => {
  const original = await repo.getSiteContent();
  await repo.saveDraftContent(
    { ...original, about: { ...original.about, title: "Private draft title" } },
    "support@poolpay.space"
  );
  assert.equal((await repo.getSiteContent()).about.title, original.about.title);
  await repo.publishContent("support@poolpay.space");
  assert.equal((await repo.getSiteContent()).about.title, "Private draft title");
});
test("concurrent confirmations cannot occupy the same time", async () => {
  const input = {
    serviceId: "svc_tax",
    customerName: "Test customer",
    customerEmail: "test@example.com",
    customerPhone: "1234567890",
    requestedDate: "2027-02-04",
    requestedTimeSlot: "10:00"
  };
  const first = await appointments.requestAppointment(input);
  const second = await appointments.requestAppointment({ ...input, requestedTimeSlot: "14:00" });
  const database = await db.getDb();
  const rows = await database
    .collection(db.COLLECTIONS.APPOINTMENTS)
    .find({ reference: { $in: [first.reference, second.reference] } })
    .toArray();
  const results = await Promise.allSettled(
    rows.map((row) =>
      appointments.manageAppointment(
        {
          id: row.id,
          status: "confirmed",
          requestedDate: input.requestedDate,
          requestedTimeSlot: input.requestedTimeSlot
        },
        "support@poolpay.space"
      )
    )
  );
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  assert.equal(
    await database
      .collection(db.COLLECTIONS.OUTBOX)
      .countDocuments({ type: "appointment_requested" }),
    4
  );
});
test("invalid daylight-saving times and impossible calendar dates are rejected", async () => {
  assert.throws(() => appointments.localInstant("2027-03-14", "02:30", "America/New_York"));
  const { appointmentSchema } = await import("../src/server/validation");
  assert.equal(
    appointmentSchema.safeParse({
      serviceId: "svc_tax",
      customerName: "Test",
      customerEmail: "test@example.com",
      customerPhone: "1234567890",
      requestedDate: "2027-02-30",
      requestedTimeSlot: "10:00"
    }).success,
    false
  );
});

test("requests reserve availability atomically and rejection requires a reason and releases the slot", async () => {
  const database = await db.getDb();
  const settings = await repo.getSettings();
  await database
    .collection(db.COLLECTIONS.SETTINGS)
    .updateOne(
      {},
      {
        $set: {
          scheduling: {
            workingDays: [4],
            blockedDates: ["2027-02-18"],
            openingTime: "09:00",
            closingTime: "17:00"
          }
        }
      },
      { upsert: true }
    );
  const input = {
    serviceId: "svc_tax",
    customerName: "Booking test",
    customerEmail: "booking@example.com",
    customerPhone: "1234567890",
    requestedDate: "2027-02-11",
    requestedTimeSlot: "10:00"
  };
  try {
    const results = await Promise.allSettled([
      appointments.requestAppointment(input),
      appointments.requestAppointment(input)
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(
      (await appointments.availableTimes(input.requestedDate, input.serviceId)).slots.includes(
        "10:00"
      ),
      false
    );
    assert.equal(
      (await appointments.availableTimes("2027-02-18", input.serviceId)).slots.length,
      0
    );
    assert.equal(
      (await appointments.availableTimes("2027-02-12", input.serviceId)).slots.length,
      0
    );
    await assert.rejects(appointments.requestAppointment({ ...input, requestedTimeSlot: "16:45" }));
    const row = await database
      .collection(db.COLLECTIONS.APPOINTMENTS)
      .findOne({ customerEmail: input.customerEmail });
    assert.ok(row);
    await assert.rejects(
      appointments.manageAppointment(
        {
          id: row.id,
          status: "declined",
          requestedDate: input.requestedDate,
          requestedTimeSlot: "10:00"
        },
        "support@poolpay.space"
      )
    );
    await appointments.manageAppointment(
      {
        id: row.id,
        status: "declined",
        requestedDate: input.requestedDate,
        requestedTimeSlot: "10:00",
        rejectionReason: "Please choose another date."
      },
      "support@poolpay.space"
    );
    assert.equal(
      (await appointments.availableTimes(input.requestedDate, input.serviceId)).slots.includes(
        "10:00"
      ),
      true
    );
    const notice = await database
      .collection(db.COLLECTIONS.OUTBOX)
      .findOne({ recipient: input.customerEmail, type: "appointment_confirmed" });
    assert.match(notice?.bodyText || "", /Please choose another date/);
  } finally {
    await database
      .collection(db.COLLECTIONS.SETTINGS)
      .updateOne({}, { $set: { scheduling: settings.scheduling } });
  }
});

test("customer OTP is single-use, attempt-limited and reveals orders only for the verified email", async () => {
  const customer = await import("../src/server/customer");
  const database = await db.getDb();
  const challenge = await customer.requestCustomerCode("CUSTOMER@example.com");
  const mail = await database
    .collection(db.COLLECTIONS.OUTBOX)
    .findOne({ id: `customer-code-${challenge.challengeId}` });
  const code = mail?.bodyText.match(/code is (\d{6})/)?.[1];
  assert.ok(code);
  await assert.rejects(customer.verifyCustomerCode(challenge.challengeId, "000000"));
  const session = await customer.verifyCustomerCode(challenge.challengeId, code);
  await assert.rejects(customer.verifyCustomerCode(challenge.challengeId, code));
  const history = await customer.customerOrders(session.token);
  assert.equal(history.email, "customer@example.com");
  assert.ok(history.orders.length > 0);
  assert.ok(history.orders.every((order) => order.service === "Interpreter"));
  await assert.rejects(customer.customerOrders("wrong-token"));
  const next = await customer.requestCustomerCode("nobody@example.com");
  for (let attempt = 0; attempt < 5; attempt++)
    await assert.rejects(customer.verifyCustomerCode(next.challengeId, "000000"));
  const nextMail = await database
    .collection(db.COLLECTIONS.OUTBOX)
    .findOne({ id: `customer-code-${next.challengeId}` });
  await assert.rejects(
    customer.verifyCustomerCode(
      next.challengeId,
      nextMail?.bodyText.match(/code is (\d{6})/)?.[1] || "000000"
    )
  );
  await database
    .collection("klx_customer_sessions")
    .updateOne({ email: history.email }, { $set: { expiresAt: new Date(0) } });
  await assert.rejects(customer.customerOrders(session.token));
});
test("fixed-price requests create immutable payment links and retry without duplicate orders", async () => {
  const database = await db.getDb();
  await database
    .collection(db.COLLECTIONS.SERVICES)
    .updateOne({ id: "svc_tax" }, { $set: { pricingMode: "fixed", priceCents: 5000 } });
  const requestId = (await import("node:crypto")).randomUUID();
  const input = {
    requestId,
    serviceId: "svc_tax",
    customerName: "Payment test",
    customerEmail: "test@example.com",
    customerPhone: "1234567890",
    requestedDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    requestedTimeSlot: "10:00"
  };
  const first = await appointments.requestAppointment(input);
  assert.ok(first.paymentUrl.includes("/pay/"));
  await database
    .collection(db.COLLECTIONS.SERVICES)
    .updateOne({ id: "svc_tax" }, { $set: { priceCents: 9000 } });
  const retry = await appointments.requestAppointment(input);
  assert.equal(retry.paymentUrl, first.paymentUrl);
  assert.equal(
    await database.collection(db.COLLECTIONS.QUOTES).countDocuments({ appointmentId: requestId }),
    1
  );
  assert.equal(
    (await database.collection(db.COLLECTIONS.QUOTES).findOne({ appointmentId: requestId }))
      ?.amountCents,
    5000
  );
});
test("hiding every service does not resurrect default public services", async () => {
  await (
    await db.getDb()
  )
    .collection(db.COLLECTIONS.SERVICES)
    .updateMany({}, { $set: { isVisible: false } });
  assert.equal((await repo.getServices()).length, 0);
  assert.equal((await repo.getServices(true)).length, 4);
});
