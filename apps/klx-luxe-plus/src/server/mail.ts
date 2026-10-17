import nodemailer from "nodemailer";

import { env } from "@/env";

import { COLLECTIONS, getDb } from "./db/client";
import type { KlxOutbox } from "./db/types";
import { queueIntents } from "./notifications";

export async function processOutbox() {
  const db = await getDb();
  for (const collection of [COLLECTIONS.APPOINTMENTS, COLLECTIONS.QUOTES, "klx_customer_otp"]) {
    const records = await db
      .collection(collection)
      .find({ notificationQueued: false })
      .limit(50)
      .toArray();
    for (const record of records) await queueIntents(collection, String(record.id));
  }
  let sent = 0;
  for (let i = 0; i < 20; i++) {
    const item = await db
      .collection<KlxOutbox & { leaseUntil?: Date }>(COLLECTIONS.OUTBOX)
      .findOneAndUpdate(
        {
          status: { $in: ["pending", "failed"] },
          attempts: { $lt: 5 },
          $or: [{ leaseUntil: { $exists: false } }, { leaseUntil: { $lt: new Date() } }]
        },
        { $set: { leaseUntil: new Date(Date.now() + 120000) }, $inc: { attempts: 1 } },
        { returnDocument: "after" }
      );
    if (!item) break;
    try {
      const useSmtp =
        env.KLX_EMAIL_PROVIDER === "smtp" ||
        env.EMAIL_PROVIDER === "smtp" ||
        (Boolean(env.SMTP_HOST) && env.KLX_EMAIL_PROVIDER !== "resend");

      const fromEmail = env.KLX_EMAIL_FROM;
      const domainMatch = fromEmail.match(/@([^>]+)/);
      const emailDomain = domainMatch ? domainMatch[1]?.trim() : "poolpay.space";
      const noReplyAddress = `no-reply@${emailDomain}`;

      const isBlockedReply =
        item.noReply === true ||
        item.replyTo === "no-reply" ||
        item.type === "appointment_requested";

      const effectiveReplyTo = isBlockedReply
        ? noReplyAddress
        : item.replyTo || env.KLX_SUPPORT_EMAIL;

      const antiReplyHeaders: Record<string, string> = isBlockedReply
        ? {
            "Auto-Submitted": "auto-generated",
            "X-Auto-Response-Suppress": "All",
            Precedence: "bulk",
            "X-Report-Abuse-To": noReplyAddress
          }
        : {};

      const fromHeader = isBlockedReply
        ? `KLX LUXE PLUS [No-Reply] <${fromEmail}>`
        : `KLX LUXE PLUS <${fromEmail}>`;

      if (useSmtp && env.SMTP_HOST) {
        await nodemailer
          .createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: env.SMTP_PORT === 465,
            auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
          })
          .sendMail({
            from: fromHeader,
            replyTo: effectiveReplyTo,
            to: item.recipient,
            subject: item.subject,
            text: item.bodyText,
            headers: antiReplyHeaders,
            ...(item.bodyHtml ? { html: item.bodyHtml } : {})
          });
      } else if (env.RESEND_API_KEY) {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": item.id
          },
          body: JSON.stringify({
            from: fromHeader,
            to: item.recipient,
            reply_to: effectiveReplyTo,
            headers: antiReplyHeaders,
            subject: item.subject,
            text: item.bodyText,
            ...(item.bodyHtml ? { html: item.bodyHtml } : {})
          })
        });
        if (!response.ok) throw new Error("Email provider rejected message.");
      } else throw new Error("Configure an email provider.");
      await db
        .collection(COLLECTIONS.OUTBOX)
        .updateOne(
          { id: item.id },
          { $set: { status: "sent", processedAt: new Date() }, $unset: { leaseUntil: "" } }
        );
      sent++;
    } catch {
      await db.collection(COLLECTIONS.OUTBOX).updateOne(
        { id: item.id },
        {
          $set: {
            status: "failed",
            lastError: "Delivery failed. Check sender/provider configuration.",
            leaseUntil: new Date(Date.now() + 300000)
          }
        }
      );
    }
  }
  return { sent };
}
