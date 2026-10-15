import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = "http://127.0.0.1:5003";
let check = "health and unauthorized access";
async function main() {
  assert.equal((await fetch(base + "/api/health")).status, 200);
  assert.equal((await fetch(base + "/api/admin/snapshot")).status, 401);
  check = "public SEO and privacy";
  const home = await (await fetch(base)).text();
  assert.match(home, /Your groups\. Wherever you go\./);
  const canonical = home.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.ok(canonical);
  assert.equal(new URL(canonical).href, "https://klxluxeplus.poolpay.space/");
  assert.doesNotMatch(
    home,
    /Jean Derival|klxluxeplus@gmail\.com|passwordHash|ownerEmail|notificationSettings|mongodb:\/\/|sk_test_|sk_live_/
  );
  check = "login and session cookie";
  const login = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: base },
    body: JSON.stringify({
      email: "support@poolpay.space",
      password: process.env.KLX_TEST_PASSWORD
    })
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  check = "customer order flow";
  assert.match(home, /Pay for your service\./);
  const headers = { cookie, origin: base, "Content-Type": "application/json" };
  const orderResponse = await fetch(base + "/api/admin/quotes", {
    method: "POST",
    headers,
    body: JSON.stringify({
      requestId: crypto.randomUUID(),
      customerName: "Review customer",
      customerEmail: "review@example.com",
      serviceName: "Interpreter",
      description: "Agreed service price",
      amountCents: 5000,
      depositCents: 0,
      expiresInDays: 14
    })
  });
  assert.equal(orderResponse.status, 200);
  const order = await orderResponse.json();
  const paymentPage = await (await fetch(order.link)).text();
  assert.match(paymentPage, /KLX-\d{6}/);
  assert.match(paymentPage, /Interpreter/);
  const lookup = await fetch(base + "/api/orders/lookup", {
    method: "POST",
    headers,
    body: JSON.stringify({ reference: "KLX-999999", email: "wrong@example.com" })
  });
  assert.equal(lookup.status, 200);
  assert.doesNotMatch(JSON.stringify(await lookup.json()), /\/pay\//);
  assert.equal(
    (
      await fetch(base + "/api/admin/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({ id: order.id, action: "resend" })
      })
    ).status,
    200
  );
  assert.equal(
    (
      await fetch(base + "/api/admin/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({ id: order.id, action: "cancel" })
      })
    ).status,
    200
  );
  assert.equal(
    (
      await fetch(base + "/api/checkout", {
        method: "POST",
        headers,
        body: JSON.stringify({ token: order.link.split("/").pop() })
      })
    ).status,
    400
  );
  check = "origin, jobs and checkout controls";
  assert.equal(
    (
      await fetch(base + "/api/admin/publish", {
        method: "POST",
        headers: { cookie, origin: "https://example.com", "Content-Type": "application/json" },
        body: "{}"
      })
    ).status,
    403
  );
  assert.equal((await fetch(base + "/api/jobs", { method: "POST" })).status, 401);
  assert.equal(
    (
      await fetch(base + "/api/checkout", {
        method: "POST",
        headers: { origin: base, "Content-Type": "application/json" },
        body: JSON.stringify({ token: "invalid" })
      })
    ).status,
    400
  );
  check = "private page indexing";
  const admin = await (await fetch(base + "/admin/login")).text();
  assert.match(admin, /noindex/);
  check = "media upload and serving";
  const form = new FormData();
  form.set(
    "file",
    new Blob([await readFile("public/images/klx-logo.png")], { type: "image/png" }),
    "review-logo.png"
  );
  form.set("altText", "Review logo");
  const upload = await fetch(base + "/api/admin/media", {
    method: "POST",
    headers: { cookie, origin: base },
    body: form
  });
  if (!upload.ok) {
    const problem = await upload.json().catch(() => ({}));
    process.stderr.write(
      `Media HTTP ${upload.status}: ${typeof problem.error === "string" ? problem.error : "non-JSON response"}\n`
    );
  }
  assert.equal(upload.status, 200);
  const media = await upload.json();
  assert.equal((await fetch(base + media.url)).status, 200);
  check = "webhook signature rejection";
  assert.equal(
    (await fetch(base + "/api/stripe/webhook", { method: "POST", body: "{}" })).status,
    400
  );
  process.stdout.write(
    "HTTP smoke checks passed: access controls, origin checks, SSR SEO/privacy, media upload, and webhook rejection.\n"
  );
}
main().catch(() => {
  process.stderr.write(`HTTP smoke check failed: ${check}.\n`);
  process.exitCode = 1;
});
