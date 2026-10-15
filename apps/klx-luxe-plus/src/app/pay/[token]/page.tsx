import Link from "next/link";
import { notFound } from "next/navigation";

import { env } from "@/env";

import { CheckoutButton } from "@/components/CheckoutButton";
import { stripeClient, syncSession } from "@/server/commerce";
import { COLLECTIONS, getDb } from "@/server/db/client";
import type { KlxPayment, KlxQuote } from "@/server/db/types";

export const metadata = {
  title: "Secure payment | KLX LUXE PLUS LLC",
  robots: { index: false, follow: false }
};
export const dynamic = "force-dynamic";
export default async function Payment({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  const db = await getDb();
  let quote = await db.collection<KlxQuote>(COLLECTIONS.QUOTES).findOne({ token });
  if (!quote) notFound();
  const pending = await db.collection<KlxPayment>(COLLECTIONS.PAYMENTS).findOne({
    quoteId: quote.id,
    mode: env.KLX_STRIPE_MODE,
    status: "pending",
    stripeSessionId: { $exists: true }
  });
  if (pending?.stripeSessionId) {
    await syncSession(await stripeClient().checkout.sessions.retrieve(pending.stripeSessionId));
    quote = (await db.collection<KlxQuote>(COLLECTIONS.QUOTES).findOne({ token })) || quote;
  }
  const money = (value: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: quote.currency }).format(
      value / 100
    );
  const available =
    quote.expiresAt > new Date() && ["pending", "deposit_paid"].includes(quote.status);
  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <Link href="/" className="text-sm text-sky-700">
        ← KLX LUXE PLUS LLC
      </Link>
      <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-8">
        <p className="eyebrow text-sky-700">{quote.quoteNumber}</p>
        <h1 className="mt-4 text-3xl font-semibold">{quote.serviceName}</h1>
        <p className="mt-5 text-sm leading-7 whitespace-pre-wrap text-slate-500">
          {quote.description}
        </p>
        <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
          <dt>Total</dt>
          <dd className="text-right">{money(quote.amountCents)}</dd>
          <dt>Remaining balance</dt>
          <dd className="text-right">{money(quote.balanceCents)}</dd>
          {quote.status === "pending" && quote.depositCents > 0 && (
            <>
              <dt>Deposit due now</dt>
              <dd className="text-right">{money(quote.depositCents)}</dd>
            </>
          )}
        </dl>
        {quote.status === "fully_paid" ? (
          <p className="mt-8 font-medium text-emerald-700">Payment received. Thank you.</p>
        ) : available ? (
          <CheckoutButton token={token} />
        ) : (
          <p className="mt-8 text-sm">
            This request has expired or been cancelled. Contact support@poolpay.space.
          </p>
        )}
        <p className="mt-5 text-xs leading-6 text-slate-500">
          Payment does not confirm an appointment time. Contact support@poolpay.space for
          cancellation or refund questions.
        </p>
      </div>
    </main>
  );
}
