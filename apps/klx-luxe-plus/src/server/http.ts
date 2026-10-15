import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { z } from "zod";

import { env } from "@/env";

import { COLLECTIONS, getDb } from "./db/client";
import type { KlxSession, KlxUser } from "./db/types";

export const SESSION_COOKIE = env.KLX_SESSION_COOKIE;
export const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}
export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
export async function handle(work: () => Promise<unknown>) {
  try {
    return json(await work());
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    if (error instanceof z.ZodError)
      return json(
        { error: error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
        400
      );
    // Provider/database errors may include credentials or customer information.
    return json(
      { error: "The request could not be completed. Please try again or contact support." },
      503
    );
  }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || new URL(origin).host !== host)
    throw new HttpError(403, "Request origin is not allowed.");
}
export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await getDb();
  const session = await db
    .collection<KlxSession>(COLLECTIONS.SESSIONS)
    .findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } });
  if (!session) return null;
  return db.collection<KlxUser>(COLLECTIONS.USERS).findOne({ id: session.userId });
}
export async function requireAdmin(request?: Request) {
  if (request) sameOrigin(request);
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Please sign in.");
  return user;
}
export async function startSession(user: KlxUser) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  await (await getDb()).collection<KlxSession>(COLLECTIONS.SESSIONS).insertOne({
    tokenHash: digest(token),
    userId: user.id,
    email: user.email,
    role: user.role,
    createdAt: new Date(),
    expiresAt
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(env.KLX_SITE_URL).protocol === "https:",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}
export async function rateLimit(request: Request, category: string, limit: number) {
  const key = digest(
    `${category}:${request.headers.get("x-real-ip") || "local"}:${Math.floor(Date.now() / 600000)}`
  );
  const db = await getDb();
  const bucket = await db
    .collection("klx_rate_limits")
    .findOneAndUpdate(
      { key },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 1200000) } },
      { upsert: true, returnDocument: "after" }
    );
  if (Number(bucket?.count) > limit)
    throw new HttpError(429, "Too many requests. Please try again later.");
}
