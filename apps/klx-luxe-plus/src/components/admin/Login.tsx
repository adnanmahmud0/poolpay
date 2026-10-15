"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { LockKeyhole } from "lucide-react";

import { Button } from "@repo/ui";

export function Login({ setup, next }: { setup?: string; next?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${setup ? "setup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(new FormData(event.currentTarget)),
          token: setup
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.replace(next?.startsWith("/admin/appointments?") ? next : "/admin");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again.");
      setBusy(false);
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#edf4f7] p-6">
      <div className="w-full max-w-md rounded-[28px] border border-white bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
        <Link href="/" className="eyebrow text-[#377db1]">
          KLX LUXE PLUS LLC
        </Link>
        <LockKeyhole className="mt-10 mb-6 size-9 text-[#377db1]" />
        <h1 className="text-3xl font-semibold tracking-tight">
          {setup ? "Set your password." : "Welcome back."}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          {setup
            ? "Create a password to finish setting up your administrator account."
            : "Sign in to manage your website and services."}
        </p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          {!setup && (
            <label className="block text-sm">
              Email
              <input
                name="email"
                type="email"
                required
                defaultValue="admin@poolpay.space"
                autoComplete="username"
                className="klx-input mt-2"
              />
            </label>
          )}
          <label className="block text-sm">
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete={setup ? "new-password" : "current-password"}
              className="klx-input mt-2"
            />
          </label>
          <p className="text-xs text-slate-500">Use at least 8 characters.</p>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button disabled={busy} type="submit" className="h-12 w-full">
            {busy ? "Please wait…" : setup ? "Set password and sign in" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-xs leading-6 text-slate-400">
          Need account access? The site operator can generate a private setup or recovery link.
        </p>
      </div>
    </main>
  );
}
