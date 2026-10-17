import { Db, MongoClient } from "mongodb";

import { env, getDatabaseUri } from "@/env";

let cachedClient: MongoClient | null = null;
let connecting: Promise<MongoClient> | null = null;
let cachedDb: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }
  if (connecting) return connecting;

  const uri = getDatabaseUri();
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  });

  connecting = client
    .connect()
    .then(() => {
      cachedClient = client;
      return client;
    })
    .catch((error) => {
      connecting = null;
      throw error;
    });
  return connecting;
}

export async function getDb(): Promise<Db> {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await getMongoClient();
  const dbName = env.KLX_DB_NAME || "klx_luxe_plus";
  const db = client.db(dbName);
  cachedDb = db;
  return db;
}

export const COLLECTIONS = {
  USERS: "klx_users",
  SESSIONS: "klx_sessions",
  SETUP_TOKENS: "klx_setup_tokens",
  CONTENT: "klx_content",
  SERVICES: "klx_services",
  APPOINTMENTS: "klx_appointments",
  QUOTES: "klx_quotes",
  PAYMENTS: "klx_payments",
  REFUNDS: "klx_refunds",
  STRIPE_EVENTS: "klx_stripe_events",
  ADVERTISEMENTS: "klx_advertisements",
  MEDIA: "klx_media",
  OUTBOX: "klx_outbox",
  SETTINGS: "klx_settings",
  AUDIT_LOG: "klx_audit_log"
} as const;

export async function ensureIndexes(): Promise<void> {
  try {
    const db = await getDb();

    // Users
    await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true });
    await db.collection("klx_counters").createIndex({ key: 1 }, { unique: true });
    await db
      .collection(COLLECTIONS.CONTENT)
      .createIndex({ status: 1 }, { unique: true, partialFilterExpression: { status: "draft" } });

    // Sessions
    await db.collection(COLLECTIONS.SESSIONS).createIndex({ tokenHash: 1 }, { unique: true });
    await db
      .collection(COLLECTIONS.SESSIONS)
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Setup tokens
    await db.collection(COLLECTIONS.SETUP_TOKENS).createIndex({ token: 1 }, { unique: true });
    await db
      .collection(COLLECTIONS.SETUP_TOKENS)
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Services
    await db.collection(COLLECTIONS.SERVICES).createIndex({ serviceId: 1 }, { unique: true });
    await db.collection(COLLECTIONS.SERVICES).createIndex({ sortOrder: 1 });

    // Appointments
    await db.collection(COLLECTIONS.APPOINTMENTS).createIndex({ reference: 1 }, { unique: true });
    await db.collection(COLLECTIONS.APPOINTMENTS).createIndex({ id: 1 }, { unique: true });
    await db.collection(COLLECTIONS.APPOINTMENTS).createIndex({ token: 1 }, { unique: true });
    await db
      .collection(COLLECTIONS.APPOINTMENTS)
      .createIndex({ adminToken: 1 }, { unique: true, sparse: true });
    await db.collection(COLLECTIONS.APPOINTMENTS).createIndex({ requestedDate: 1, status: 1 });

    // Quotes & Payments
    await db.collection(COLLECTIONS.QUOTES).createIndex({ quoteNumber: 1 }, { unique: true });
    await db.collection(COLLECTIONS.QUOTES).createIndex({ id: 1 }, { unique: true });
    await db
      .collection(COLLECTIONS.QUOTES)
      .createIndex(
        { customerEmail: 1, createdAt: -1 },
        { collation: { locale: "en", strength: 2 } }
      );
    await db.collection(COLLECTIONS.PAYMENTS).createIndex({ stripeSessionId: 1 });
    await db.collection(COLLECTIONS.PAYMENTS).createIndex({ quoteId: 1 });
    await db.collection(COLLECTIONS.REFUNDS).createIndex({ idempotencyKey: 1 }, { unique: true });
    await db.collection(COLLECTIONS.STRIPE_EVENTS).createIndex({ eventId: 1 }, { unique: true });
    await db.collection("klx_rate_limits").createIndex({ key: 1 }, { unique: true });
    await db.collection("klx_rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db
      .collection(COLLECTIONS.APPOINTMENTS)
      .createIndex({ occupiedSlots: 1 }, { unique: true, sparse: true });

    // Ads
    await db
      .collection(COLLECTIONS.ADVERTISEMENTS)
      .createIndex({ placement: 1, isActive: 1, priority: -1 });

    // Outbox
    await db.collection(COLLECTIONS.OUTBOX).createIndex({ status: 1, attempts: 1 });
    await db.collection(COLLECTIONS.OUTBOX).createIndex({ id: 1 }, { unique: true });
    await db.collection("klx_customer_otp").createIndex({ id: 1 }, { unique: true });
    await db
      .collection("klx_customer_otp")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection("klx_customer_sessions").createIndex({ tokenHash: 1 }, { unique: true });
    await db
      .collection("klx_customer_sessions")
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Audit Log
    await db.collection(COLLECTIONS.AUDIT_LOG).createIndex({ createdAt: -1 });
  } catch {
    throw new Error("Database index initialization failed.");
  }
}
