import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { env } from "@/env";

import { ensureOwnerAccount } from "@/server/auth/users";
import { COLLECTIONS, getDb } from "@/server/db/client";
import { logAudit } from "@/server/db/repositories";
import type { KlxAppointment, KlxSession, KlxUser } from "@/server/db/types";
import { digest, SESSION_COOKIE } from "@/server/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() || "";
  const next = searchParams.get("next")?.trim() || "";

  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const db = await getDb();
  // Find appointment associated with this administrative action token
  const appointment = await db.collection<KlxAppointment>(COLLECTIONS.APPOINTMENTS).findOne({
    adminToken: token
  });

  if (!appointment) {
    const errorUrl = new URL("/admin/login", request.url);
    errorUrl.searchParams.set("error", "invalid_token");
    if (next && next.startsWith("/admin")) {
      errorUrl.searchParams.set("next", next);
    }
    return NextResponse.redirect(errorUrl);
  }

  // Find or provision the admin account
  const existingOwner = await db.collection<KlxUser>(COLLECTIONS.USERS).findOne({ role: "owner" });
  const adminUser: KlxUser = existingOwner || (await ensureOwnerAccount());

  // Generate a fresh authenticated session
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8-hour session

  await db.collection<KlxSession>(COLLECTIONS.SESSIONS).insertOne({
    tokenHash: digest(sessionToken),
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    createdAt: new Date(),
    expiresAt
  });

  // Sanitize destination redirect
  let targetPath = "/admin/appointments";
  if (next && (next.startsWith("/admin") || next.startsWith("/api/documents"))) {
    targetPath = next;
  }

  const destination = new URL(targetPath, request.url);
  const response = NextResponse.redirect(destination);

  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: new URL(env.KLX_SITE_URL).protocol === "https:",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });

  await logAudit({
    actorEmail: adminUser.email,
    action: "ADMIN_AUTO_LOGIN_VIA_EMAIL_TOKEN",
    entityType: "appointment",
    entityId: appointment.id,
    details: {
      reference: appointment.reference,
      destination: targetPath
    }
  });

  return response;
}
