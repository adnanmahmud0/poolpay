import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";

import { MongoMemoryServer } from "mongodb-memory-server";

import type * as dbTypes from "../src/server/db/types";

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
  await database.collection(db.COLLECTIONS.SETTINGS).updateOne(
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
  assert.equal((await repo.getServices(true)).length, 7);
});

test("advertisement validation schema rejects invalid inputs and accepts valid inputs", async () => {
  const { adSchema } = await import("../src/server/validation");

  // Rejects empty title
  assert.equal(
    adSchema.safeParse({
      title: "",
      imageUrl: "/images/klx-social-card.png",
      destinationUrl: "https://klxluxeplus.poolpay.space",
      altText: "Valid Alt Text",
      placement: "after_hero",
      priority: 10,
      isActive: true
    }).success,
    false
  );

  // Rejects invalid destination URL (e.g. javascript: or missing protocol/path)
  assert.equal(
    adSchema.safeParse({
      title: "Valid Title",
      imageUrl: "/images/klx-social-card.png",
      destinationUrl: "javascript:alert(1)",
      altText: "Valid Alt Text",
      placement: "after_hero",
      priority: 10,
      isActive: true
    }).success,
    false
  );

  // Rejects invalid schedule (end date <= start date)
  assert.equal(
    adSchema.safeParse({
      title: "Valid Title",
      imageUrl: "/images/klx-social-card.png",
      destinationUrl: "https://klxluxeplus.poolpay.space/#poolpay",
      altText: "Valid Alt Text",
      placement: "after_hero",
      priority: 10,
      isActive: true,
      startDate: "2026-12-01",
      endDate: "2026-11-01"
    }).success,
    false
  );

  // Rejects negative priority
  assert.equal(
    adSchema.safeParse({
      title: "Valid Title",
      imageUrl: "/images/klx-social-card.png",
      destinationUrl: "https://klxluxeplus.poolpay.space/#poolpay",
      altText: "Valid Alt Text",
      placement: "after_hero",
      priority: -1,
      isActive: true
    }).success,
    false
  );

  // Accepts valid advertisement input
  const valid = adSchema.safeParse({
    title: "PoolPay Mobile App — Group Savings",
    imageUrl: "/images/klx-social-card.png",
    destinationUrl: "https://klxluxeplus.poolpay.space/#poolpay",
    altText: "Download PoolPay App on Google Play for transparent group savings",
    placement: "after_hero",
    priority: 10,
    isActive: true,
    startDate: "2026-10-01",
    endDate: "2026-12-31"
  });
  assert.equal(valid.success, true);

  // Accepts null or empty dates
  const validNoDates = adSchema.safeParse({
    title: "PoolPay Mobile App — Group Savings",
    imageUrl: "/images/klx-social-card.png",
    destinationUrl: "/#appointments",
    altText: "Download PoolPay App",
    placement: "after_services",
    priority: 5,
    isActive: true,
    startDate: null,
    endDate: null
  });
  assert.equal(validNoDates.success, true);
});

test("default advertisements are seeded and retrieved properly", async () => {
  await repo.initAdvertisementsIfEmpty();
  const ads = await repo.getAds();
  assert.ok(ads.length >= 2);
  const heroAds = await repo.getAds("after_hero");
  assert.ok(heroAds.some((a) => a.placement === "after_hero"));
  const servicesAds = await repo.getAds("after_services");
  assert.ok(servicesAds.some((a) => a.placement === "after_services"));
});

test("interpreter service appointment records languages, setting, and dual notifications", async () => {
  const database = await db.getDb();
  await database
    .collection(db.COLLECTIONS.SERVICES)
    .updateOne({ id: "svc_interpreter" }, { $set: { isVisible: true } });

  const reqId = randomUUID();
  const result = await appointments.requestAppointment({
    requestId: reqId,
    serviceId: "svc_interpreter",
    customerName: "Marie Dupont",
    customerEmail: "marie@example.com",
    customerPhone: "+15551234567",
    requestedDate: "2026-11-12",
    requestedTimeSlot: "14:00",
    sourceLanguage: "Haitian Creole (Kreyòl)",
    targetLanguage: "English",
    interpretationSetting: "USCIS Asylum Interview"
  });

  assert.ok(result.reference.startsWith("KLX-"));
  const saved = await database
    .collection<dbTypes.KlxAppointment>(db.COLLECTIONS.APPOINTMENTS)
    .findOne({ id: reqId });
  assert.ok(saved);
  assert.equal(saved.sourceLanguage, "Haitian Creole (Kreyòl)");
  assert.equal(saved.targetLanguage, "English");
  assert.equal(saved.interpretationSetting, "USCIS Asylum Interview");

  const notifications = (
    saved as unknown as {
      notificationIntents: Array<{ recipient: string; bodyText: string; bodyHtml: string }>;
    }
  ).notificationIntents;
  assert.ok(notifications.length >= 2);

  const customerEmail = notifications.find((n) => n.recipient === "marie@example.com");
  assert.ok(customerEmail);
  assert.ok(customerEmail.bodyText.includes("Haitian Creole (Kreyòl) → English"));
  assert.ok(customerEmail.bodyText.includes("USCIS Asylum Interview"));

  const adminEmail = notifications.find((n) => n.recipient === "support@poolpay.space");
  assert.ok(adminEmail);
  assert.ok(adminEmail.bodyHtml.includes("Haitian Creole (Kreyòl) → English"));
  assert.ok(adminEmail.bodyHtml.includes("USCIS Asylum Interview"));
});

test("translation service appointment records documents, reason, and download links", async () => {
  const database = await db.getDb();
  await database
    .collection(db.COLLECTIONS.SERVICES)
    .updateOne({ id: "svc_translation" }, { $set: { isVisible: true } });

  const reqId = randomUUID();
  const docId = randomUUID();
  const result = await appointments.requestAppointment({
    requestId: reqId,
    serviceId: "svc_translation",
    customerName: "Carlos Mendez",
    customerEmail: "carlos@example.com",
    customerPhone: "+15559876543",
    requestedDate: "2026-11-14",
    requestedTimeSlot: "11:00",
    sourceLanguage: "Spanish (Español)",
    targetLanguage: "English",
    translationReason: "Immigration (USCIS)",
    documentTypes: ["Birth Certificate", "Marriage Certificate"],
    attachedDocuments: [
      {
        id: docId,
        name: "acta_nacimiento_carlos.pdf",
        size: 1048576,
        mimeType: "application/pdf",
        url: `/api/documents/${docId}.pdf`
      }
    ]
  });

  assert.ok(result.reference.startsWith("KLX-"));
  const saved = await database
    .collection<dbTypes.KlxAppointment>(db.COLLECTIONS.APPOINTMENTS)
    .findOne({ id: reqId });
  assert.ok(saved);
  assert.equal(saved.sourceLanguage, "Spanish (Español)");
  assert.equal(saved.targetLanguage, "English");
  assert.equal(saved.translationReason, "Immigration (USCIS)");
  assert.equal(saved.attachedDocuments?.length, 1);
  assert.equal(saved.attachedDocuments?.[0]?.name, "acta_nacimiento_carlos.pdf");

  const notifications = (
    saved as unknown as {
      notificationIntents: Array<{ recipient: string; bodyText: string; bodyHtml: string }>;
    }
  ).notificationIntents;
  const adminEmail = notifications.find((n) => n.recipient === "support@poolpay.space");
  assert.ok(adminEmail);
  assert.ok(adminEmail.bodyText.includes("acta_nacimiento_carlos.pdf"));
  assert.ok(adminEmail.bodyHtml.includes("/api/documents/"));
});

test("transportation service records ride route, vehicle tier, and generates checkout link when payNow is true", async () => {
  const database = await db.getDb();
  await database
    .collection(db.COLLECTIONS.SERVICES)
    .updateOne({ id: "svc_transport" }, { $set: { isVisible: true } });

  const reqId = randomUUID();
  const result = await appointments.requestAppointment({
    requestId: reqId,
    serviceId: "svc_transport",
    customerName: "Sophia Loren",
    customerEmail: "sophia@example.com",
    customerPhone: "+15553334444",
    requestedDate: "2026-11-18",
    requestedTimeSlot: "16:00",
    pickupLocation: "JFK Airport, Terminal 4",
    dropoffLocation: "Midtown Manhattan Hotel, NY",
    vehicleClass: "Luxury SUV",
    passengers: 4,
    estimatedFareCents: 14000,
    payNow: true
  });

  assert.ok(result.reference.startsWith("KLX-"));
  assert.ok(result.paymentUrl, "Should generate a payment link when payNow is true");

  const saved = await database
    .collection<dbTypes.KlxAppointment>(db.COLLECTIONS.APPOINTMENTS)
    .findOne({ id: reqId });
  assert.ok(saved);
  assert.equal(saved.pickupLocation, "JFK Airport, Terminal 4");
  assert.equal(saved.dropoffLocation, "Midtown Manhattan Hotel, NY");
  assert.equal(saved.vehicleClass, "Luxury SUV");
  assert.equal(saved.passengers, 4);
  assert.equal(saved.estimatedFareCents, 14000);
  assert.equal(saved.servicePriceCents, 14000);

  const notifications = (
    saved as unknown as {
      notificationIntents: Array<{ recipient: string; bodyText: string; bodyHtml: string }>;
    }
  ).notificationIntents;
  const adminEmail = notifications.find((n) => n.recipient === "support@poolpay.space");
  assert.ok(adminEmail);
  assert.ok(adminEmail.bodyText.includes("JFK Airport, Terminal 4"));
  assert.ok(adminEmail.bodyText.includes("Midtown Manhattan Hotel, NY"));
  assert.ok(adminEmail.bodyText.includes("Luxury SUV"));
  assert.ok(adminEmail.bodyText.includes("$140.00"));
});
