import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { cp } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";

import "./load-env";

import { MongoMemoryServer } from "mongodb-memory-server";

async function main() {
  Object.assign(process.env, {
    NODE_ENV: process.argv.includes("--production") ? "production" : "development"
  });
  const mongo = await MongoMemoryServer.create();
  process.env.KLX_DATABASE_URL = mongo.getUri();
  process.env.KLX_DB_NAME = "klx_review";
  process.env.KLX_SESSION_COOKIE = "klx_review_session";
  process.env.KLX_SITE_URL = "http://127.0.0.1:5003";
  process.env.KLX_STRIPE_MODE = "test";
  process.env.RESEND_API_KEY = "";
  process.env.SMTP_HOST = "";
  process.env.KLX_STRIPE_TEST_WEBHOOK_SECRET = randomBytes(32).toString("hex");
  const { ensureIndexes, getMongoClient } = await import("../src/server/db/client");
  const { initServicesIfEmpty } = await import("../src/server/db/repositories");
  const { createOwnerSetupToken, completeOwnerSetup } = await import("../src/server/auth/users");
  await ensureIndexes();
  await initServicesIfEmpty();
  const { seedReviewDemo } = await import("./demo-data");
  await seedReviewDemo();
  const password = process.env.KLX_REVIEW_PASSWORD || randomBytes(18).toString("base64url");
  await completeOwnerSetup(
    await createOwnerSetupToken("support@poolpay.space"),
    password,
    "Review administrator"
  );
  process.stdout.write(
    `Local review only: http://127.0.0.1:5003/admin\nEmail: support@poolpay.space\nTemporary password: ${password}\n`
  );
  const production = process.argv.includes("--production");
  const standalone = resolve(".next/standalone/apps/klx-luxe-plus");
  if (production) {
    await cp(resolve("public"), resolve(standalone, "public"), { recursive: true });
    await cp(resolve(".next/static"), resolve(standalone, ".next/static"), { recursive: true });
  }
  const nextCli = createRequire(import.meta.url).resolve("next/dist/bin/next");
  const child = spawn(
    process.execPath,
    production
      ? [resolve(standalone, "server.js")]
      : [nextCli, "dev", "-H", "127.0.0.1", "-p", "5003"],
    { stdio: "inherit", env: { ...process.env, PORT: "5003", HOSTNAME: "127.0.0.1" } }
  );
  async function stop() {
    child.kill();
    await (await getMongoClient()).close();
    await mongo.stop();
    process.exit(0);
  }
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  child.once("exit", stop);
}
main().catch(() => {
  process.stderr.write("Local review server could not start.\n");
  process.exit(1);
});
