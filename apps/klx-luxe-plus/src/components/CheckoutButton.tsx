"use client";

import { useState } from "react";

import { Button } from "@repo/ui";

export function CheckoutButton({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function pay() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try again.");
      setBusy(false);
    }
  }
  return (
    <>
      <Button className="mt-6 h-12 w-full" disabled={busy} onClick={pay}>
        {busy ? "Opening secure checkout…" : "Continue to secure payment"}
      </Button>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
    </>
  );
}
