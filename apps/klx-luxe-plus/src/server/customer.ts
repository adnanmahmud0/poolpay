import { randomBytes, randomInt, randomUUID } from "node:crypto";

import { env } from "@/env";

import { COLLECTIONS, getDb } from "./db/client";
import type { KlxQuote } from "./db/types";
import { digest, HttpError } from "./http";
import { processOutbox } from "./mail";
import { queueIntents, type NotificationIntent } from "./notifications";

interface Challenge {
  id: string;
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
}
interface CustomerSession {
  tokenHash: string;
  email: string;
  expiresAt: Date;
}
export const customerCookie = `${env.KLX_SESSION_COOKIE}_customer`;
export async function requestCustomerCode(email: string) {
  const db = await getDb();
  email = email.trim().toLowerCase();
  const id = randomUUID();
  const code = String(randomInt(100000, 1000000));
  const intent: NotificationIntent = {
    id: `customer-code-${id}`,
    type: "customer_otp",
    recipient: email,
    subject: "Your KLX order access code",
    bodyHtml: "",
    bodyText: `Your KLX verification code is ${code}. It expires in 10 minutes and can be used once. Do not share it. If you did not request this code, ignore this email.`
  };
  await db.collection("klx_customer_otp").insertOne({
    id,
    email,
    codeHash: digest(`${id}:${code}`),
    attempts: 0,
    expiresAt: new Date(Date.now() + 600000),
    notificationQueued: false,
    notificationIntents: [intent]
  });
  await queueIntents("klx_customer_otp", id);
  void processOutbox().catch(() => undefined);
  return {
    challengeId: id,
    message: "A verification code has been queued for your email. Check your inbox and spam folder."
  };
}
export async function verifyCustomerCode(id: string, code: string) {
  const db = await getDb();
  const challenge = await db
    .collection<Challenge>("klx_customer_otp")
    .findOneAndUpdate(
      { id, expiresAt: { $gt: new Date() }, attempts: { $lt: 5 } },
      { $inc: { attempts: 1 } },
      { returnDocument: "after" }
    );
  if (!challenge || challenge.codeHash !== digest(`${id}:${code}`))
    throw new HttpError(400, "Invalid or expired code. Request a new code if needed.");
  const consumed = await db.collection<Challenge>("klx_customer_otp").findOneAndDelete({
    id,
    codeHash: challenge.codeHash,
    expiresAt: { $gt: new Date() },
    attempts: { $lte: 5 }
  });
  if (!consumed) throw new HttpError(400, "This code has already been used or expired.");
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60000);
  await db
    .collection<CustomerSession>("klx_customer_sessions")
    .insertOne({ tokenHash: digest(token), email: consumed.email, expiresAt });
  return { token, expiresAt };
}
export async function customerOrders(token: string, page = 0) {
  const db = await getDb();
  const session = await db
    .collection<CustomerSession>("klx_customer_sessions")
    .findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } });
  if (!session) throw new HttpError(401, "Verify your email to view your orders.");
  const filter = { customerEmail: session.email };
  const quotes = await db
    .collection<KlxQuote>(COLLECTIONS.QUOTES)
    .find(filter)
    .collation({ locale: "en", strength: 2 })
    .sort({ createdAt: -1 })
    .skip(page * 20)
    .limit(21)
    .toArray();
  const orders = await Promise.all(
    quotes.slice(0, 20).map(async (quote) => {
      const payments = await db
        .collection(COLLECTIONS.PAYMENTS)
        .find(
          { quoteId: quote.id },
          {
            projection: { _id: 0, amountCents: 1, refundedAmountCents: 1, status: 1, createdAt: 1 }
          }
        )
        .toArray();
      const status =
        quote.expiresAt <= new Date() && ["pending", "deposit_paid"].includes(quote.status)
          ? "expired"
          : quote.status;
      return {
        reference: quote.quoteNumber,
        service: quote.serviceName,
        description: quote.description,
        total: quote.amountCents,
        balance: quote.balanceCents,
        currency: quote.currency,
        status,
        createdAt: quote.createdAt,
        payments,
        paymentUrl:
          ["pending", "deposit_paid"].includes(status) && quote.balanceCents > 0 && quote.token
            ? `/pay/${quote.token}`
            : null
      };
    })
  );
  return { email: session.email, orders, hasMore: quotes.length > 20, page };
}
