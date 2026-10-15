"use client";

import { useEffect, useState } from "react";

import { CreditCard, Mail, ShieldCheck } from "lucide-react";

import { Button } from "@repo/ui";

interface Order {
  reference: string;
  service: string;
  description: string;
  total: number;
  balance: number;
  currency: string;
  status: string;
  paymentUrl: string | null;
  createdAt: string;
  payments: { amountCents: number; refundedAmountCents: number; status: string }[];
}
interface History {
  email: string;
  orders: Order[];
  hasMore: boolean;
  page: number;
}
const badge = (status: string) =>
  status === "fully_paid" || status === "paid"
    ? "bg-emerald-100 text-emerald-800"
    : status === "deposit_paid" || status === "partially_refunded"
      ? "bg-sky-100 text-sky-800"
      : status === "pending"
        ? "bg-amber-100 text-amber-800"
        : status === "failed" || status === "cancelled"
          ? "bg-rose-100 text-rose-800"
          : "bg-slate-100 text-slate-700";
const statusText = (status: string) =>
  status === "fully_paid" ? "Paid" : status.replaceAll("_", " ");
export function OrderLookup() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [challenge, setChallenge] = useState("");
  const [email, setEmail] = useState("");
  const [history, setHistory] = useState<History | null>(null);
  async function load(page = 0) {
    const response = await fetch(`/api/customer/orders?page=${page}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    setHistory(result);
    setChallenge("");
    setMessage("");
  }
  useEffect(() => {
    let active = true;
    fetch("/api/customer/orders", { cache: "no-store" })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (active && result) setHistory(result);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/customer/${challenge ? "verify" : "request"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          challenge
            ? { challengeId: challenge, code: form.get("code") }
            : { email: form.get("email") }
        )
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again.");
      if (challenge) await load();
      else {
        setEmail(String(form.get("email")));
        setChallenge(result.challengeId);
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="pay-order" className="scroll-mt-8 bg-slate-50 py-20">
      <div className="section-shell">
        <div className="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <span className="mb-5 inline-flex rounded-2xl bg-sky-100 p-4 text-sky-700">
              <CreditCard aria-hidden="true" />
            </span>
            <p className="eyebrow text-sky-700">YOUR ORDERS, IN ONE PLACE</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#14283b] sm:text-4xl">
              Pay for your service.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
              Enter the email used for your orders. Verify it with a one-time code to view your
              order history, check payment status and pay pending balances. No order reference
              needed.
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={16} aria-hidden="true" /> Email verification protects your private
              order details.
            </p>
          </div>
          {history ? (
            <div className="rounded-3xl border border-emerald-200 bg-white p-7">
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                <ShieldCheck size={18} /> Email verified
              </p>
              <p className="mt-3 text-sm break-all">{history.email}</p>
              <p className="mt-3 text-xs text-slate-500">
                For your privacy, access expires after 30 minutes. Verify again when needed.
              </p>
              <Button
                variant="outline"
                className="mt-5"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const response = await fetch("/api/customer/logout", { method: "POST" });
                    if (!response.ok) throw new Error("Could not sign out.");
                    setHistory(null);
                    setMessage("");
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Try again.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              {challenge ? (
                <>
                  <p className="mb-5 flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={18} /> Check {email}
                  </p>
                  <label className="block text-sm font-medium text-slate-700">
                    6-digit verification code
                    <input
                      name="code"
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      autoComplete="one-time-code"
                      placeholder="123456"
                      className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3 tracking-[.3em]"
                    />
                  </label>
                  <p className="mt-3 text-xs text-slate-500">
                    Code expires in 10 minutes. Check your spam folder too.
                  </p>
                </>
              ) : (
                <label className="block text-sm font-medium text-slate-700">
                  Your order email address
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    defaultValue={email}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-2 block w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </label>
              )}
              <Button disabled={busy} type="submit" className="mt-6 w-full">
                {busy
                  ? "Please wait…"
                  : challenge
                    ? "Verify and view my orders"
                    : "Send verification code"}
              </Button>
              {challenge && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setChallenge("");
                    setMessage("");
                  }}
                  className="mt-4 text-sm text-sky-700 underline"
                >
                  Use another email or request a new code
                </button>
              )}
              <p role="status" aria-live="polite" className="mt-4 text-sm leading-6 text-slate-600">
                {message}
              </p>
            </form>
          )}
        </div>
        {history && (
          <div className="mt-12">
            <h3 className="mb-5 text-2xl font-semibold">Your order history</h3>
            {!history.orders.length && (
              <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                No orders found for this verified email. Contact support if your order used a
                different email address.
              </p>
            )}
            <div className="grid gap-5 md:grid-cols-2">
              {history.orders.map((order) => {
                const money = (amount: number) =>
                  new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: order.currency
                  }).format(amount / 100);
                return (
                  <article
                    key={order.reference}
                    className="rounded-2xl border border-slate-200 bg-white p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-medium text-slate-500">{order.reference}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${badge(order.status)}`}
                      >
                        {statusText(order.status)}
                      </span>
                    </div>
                    <h4 className="mt-4 text-lg font-semibold">{order.service}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{order.description}</p>
                    <p className="mt-4 text-sm">
                      Total: {money(order.total)} · Balance: {money(order.balance)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Created {new Date(order.createdAt).toLocaleDateString("en-US")}
                    </p>
                    {order.payments.map((payment, index) => (
                      <div key={index} className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`rounded-full px-2 py-1 capitalize ${badge(payment.status)}`}
                        >
                          {statusText(payment.status)}
                        </span>
                        <span>
                          {money(payment.amountCents)}
                          {payment.refundedAmountCents > 0
                            ? ` · Refunded ${money(payment.refundedAmountCents)}`
                            : ""}
                        </span>
                      </div>
                    ))}
                    {order.paymentUrl && (
                      <Button asChild className="mt-5">
                        <a href={order.paymentUrl}>Pay {money(order.balance)} balance</a>
                      </Button>
                    )}
                  </article>
                );
              })}
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                disabled={busy || history.page === 0}
                onClick={() => {
                  setBusy(true);
                  void load(history.page - 1)
                    .catch((error) => setMessage(error.message))
                    .finally(() => setBusy(false));
                }}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={busy || !history.hasMore}
                onClick={() => {
                  setBusy(true);
                  void load(history.page + 1)
                    .catch((error) => setMessage(error.message))
                    .finally(() => setBusy(false));
                }}
              >
                Next
              </Button>
            </div>
            <p role="status" className="mt-4 text-sm text-slate-600">
              {message}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
