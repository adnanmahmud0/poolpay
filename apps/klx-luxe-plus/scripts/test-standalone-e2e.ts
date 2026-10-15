import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";

async function main() {
  process.stdout.write("Starting standalone production review server for verification...\n");
  const server = spawn("npx", ["tsx", "scripts/review-server.ts", "--production"], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    shell: true
  });

  let password = "";
  let ready = false;

  const onData = (data: Buffer) => {
    const text = data.toString();
    const match = text.match(/Temporary password: ([a-zA-Z0-9_-]+)/);
    if (match) {
      password = match[1];
    }
    if (text.includes("http://127.0.0.1:5003") || text.includes("Ready")) {
      ready = true;
    }
  };

  server.stdout.on("data", onData);
  server.stderr.on("data", onData);

  // Wait for server to become ready
  const start = Date.now();
  while (!password || !ready) {
    if (Date.now() - start > 30000) {
      server.kill();
      throw new Error("Review server timed out starting up.");
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  process.stdout.write(`Server ready on http://127.0.0.1:5003. Temporary password acquired.\n`);

  const base = "http://127.0.0.1:5003";

  // 1. Health check
  const healthRes = await fetch(`${base}/api/health`);
  assert.equal(healthRes.status, 200, "Health check failed");
  const healthJson = await healthRes.json();
  assert.equal(healthJson.status, "ready");
  process.stdout.write("✓ Health endpoint ready\n");

  // 2. SEO & canonical checks
  const homeRes = await fetch(base);
  const homeHtml = await homeRes.text();
  assert.match(homeHtml, /Your groups\. Wherever you go\./);
  assert.doesNotMatch(homeHtml, /Jean Derival|klxluxeplus@gmail\.com/);
  process.stdout.write("✓ Home page rendered with PoolPay hero and clean branding\n");

  // 3. Login
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: base },
    body: JSON.stringify({ email: "support@poolpay.space", password })
  });
  assert.equal(loginRes.status, 200, "Login failed");
  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie, "Missing session cookie");
  process.stdout.write("✓ Admin login successful and session cookie issued\n");

  // 4. Media upload (Sharp processing test)
  process.stdout.write("Testing image upload and Sharp WebP conversion...\n");
  const form = new FormData();
  const fileBytes = await readFile("public/images/klx-logo.png");
  form.set("file", new Blob([fileBytes], { type: "image/png" }), "test-upload-logo.png");
  form.set("altText", "Test upload logo");

  const uploadRes = await fetch(`${base}/api/admin/media`, {
    method: "POST",
    headers: { cookie, origin: base },
    body: form
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    server.kill();
    throw new Error(`Media upload failed with HTTP ${uploadRes.status}: ${err}`);
  }

  const mediaItem = await uploadRes.json();
  assert.ok(mediaItem.id);
  assert.ok(mediaItem.url);
  assert.equal(mediaItem.mimeType, "image/webp");
  process.stdout.write(
    `✓ Image successfully converted by Sharp to WebP: ${mediaItem.url} (${mediaItem.size} bytes)\n`
  );

  // 5. Serve uploaded media
  const mediaServeRes = await fetch(`${base}${mediaItem.url}`);
  assert.equal(mediaServeRes.status, 200, "Failed to serve uploaded image");
  const contentType = mediaServeRes.headers.get("content-type");
  assert.ok(
    contentType?.includes("image/webp"),
    `Expected image/webp content type, got ${contentType}`
  );
  process.stdout.write("✓ Uploaded WebP image successfully served through /media/[filename]\n");

  // Clean shutdown
  server.kill("SIGTERM");
  process.stdout.write("\nALL STANDALONE TESTS PASSED SUCCESSFULLY!\n");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
