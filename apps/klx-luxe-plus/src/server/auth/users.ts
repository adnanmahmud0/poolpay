import crypto from "node:crypto";

import bcrypt from "bcryptjs";

import { COLLECTIONS, getDb } from "@/server/db/client";
import { logAudit } from "@/server/db/repositories";
import { KlxSetupToken, KlxUser } from "@/server/db/types";
import { digest } from "@/server/http";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createOwnerSetupToken(
  email: string,
  purpose: "setup" | "recovery" = "setup"
): Promise<string> {
  const db = await getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const setupDoc: KlxSetupToken = {
    purpose,
    token: digest(token),
    email: email.toLowerCase().trim(),
    expiresAt,
    createdAt: new Date()
  };

  await db.collection<KlxSetupToken>(COLLECTIONS.SETUP_TOKENS).insertOne(setupDoc);

  await logAudit({
    actorEmail: "system",
    action: "OWNER_SETUP_TOKEN_CREATED",
    entityType: "user",
    entityId: email,
    details: { expiresAt }
  });

  return token;
}

export async function verifySetupToken(token: string): Promise<KlxSetupToken | null> {
  const db = await getDb();
  const doc = await db.collection<KlxSetupToken>(COLLECTIONS.SETUP_TOKENS).findOne({
    token: digest(token),
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  });
  return doc;
}

export async function completeOwnerSetup(
  token: string,
  password: string,
  name: string
): Promise<KlxUser> {
  const db = await getDb();
  const setupToken = await db
    .collection<KlxSetupToken>(COLLECTIONS.SETUP_TOKENS)
    .findOneAndUpdate(
      { token: digest(token), usedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
      { $set: { usedAt: new Date() } },
      { returnDocument: "before" }
    );
  if (!setupToken) {
    throw new Error("Invalid or expired setup token");
  }

  const existing = await db.collection<KlxUser>(COLLECTIONS.USERS).findOne({
    email: setupToken.email
  });
  if (existing) {
    if (setupToken.purpose !== "recovery")
      throw new Error("An account with this email already exists");
    await db
      .collection<KlxUser>(COLLECTIONS.USERS)
      .updateOne(
        { id: existing.id },
        { $set: { passwordHash: await hashPassword(password), updatedAt: new Date() } }
      );
    await db.collection(COLLECTIONS.SESSIONS).deleteMany({ userId: existing.id });
    await logAudit({
      actorEmail: existing.email,
      action: "OWNER_PASSWORD_RECOVERED",
      entityType: "user",
      entityId: existing.id,
      details: {}
    });
    return existing;
  }

  const passwordHash = await hashPassword(password);
  const user: KlxUser = {
    id: crypto.randomUUID(),
    email: setupToken.email,
    passwordHash,
    name: name.trim(),
    role: "owner",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection<KlxUser>(COLLECTIONS.USERS).insertOne(user);

  await logAudit({
    actorEmail: user.email,
    action: "OWNER_ACCOUNT_PROVISIONED",
    entityType: "user",
    entityId: user.id,
    details: { name: user.name, role: user.role }
  });

  return user;
}

export async function authenticateUser(email: string, password: string): Promise<KlxUser | null> {
  const db = await getDb();
  const user = await db.collection<KlxUser>(COLLECTIONS.USERS).findOne({
    email: email.toLowerCase().trim()
  });

  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

export async function hasAnyAdminUser(): Promise<boolean> {
  try {
    const db = await getDb();
    const count = await db.collection(COLLECTIONS.USERS).countDocuments();
    return count > 0;
  } catch {
    return false;
  }
}

export async function ensureOwnerAccount(
  customEmail?: string,
  customPassword?: string
): Promise<KlxUser> {
  const { getOwnerCredentials } = await import("@/env");
  const db = await getDb();
  const { email: defaultEmail, password: defaultPassword } = getOwnerCredentials();
  const email = (customEmail || defaultEmail).toLowerCase().trim();
  const password = customPassword || defaultPassword;
  const passwordHash = await hashPassword(password);

  const existing = await db.collection<KlxUser>(COLLECTIONS.USERS).findOne({
    $or: [{ email }, { role: "owner" }]
  });

  if (existing) {
    await db.collection<KlxUser>(COLLECTIONS.USERS).updateOne(
      { id: existing.id },
      {
        $set: {
          email,
          passwordHash,
          name: existing.name || "Super Admin",
          role: "owner",
          updatedAt: new Date()
        }
      }
    );
    await logAudit({
      actorEmail: email,
      action: "OWNER_CREDENTIALS_SYNCHRONIZED",
      entityType: "user",
      entityId: existing.id,
      details: { email }
    });
    return { ...existing, email, passwordHash, role: "owner" };
  }

  const user: KlxUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash,
    name: "Super Admin",
    role: "owner",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection<KlxUser>(COLLECTIONS.USERS).insertOne(user);
  await logAudit({
    actorEmail: user.email,
    action: "OWNER_ACCOUNT_PROVISIONED",
    entityType: "user",
    entityId: user.id,
    details: { name: user.name, role: user.role }
  });

  return user;
}
