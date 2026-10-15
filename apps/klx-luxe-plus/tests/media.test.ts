import assert from "node:assert/strict";
import { readFile, rmdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { after, before, test } from "node:test";

import { MongoMemoryServer } from "mongodb-memory-server";
import sharp from "sharp";

import { digest } from "../src/server/http";

let mongo: MongoMemoryServer;
const createdFiles: string[] = [];

before(async () => {
  mongo = await MongoMemoryServer.create();
  process.env.KLX_DATABASE_URL = mongo.getUri();
  process.env.KLX_DB_NAME = "klx_media_test";
  process.env.KLX_MEDIA_DIR = ".klx-test-media";
  const { ensureIndexes } = await import("../src/server/db/client");
  await ensureIndexes();
});

after(async () => {
  const { getMongoClient } = await import("../src/server/db/client");
  await (await getMongoClient()).close();
  if (mongo) await mongo.stop();

  for (const f of createdFiles) {
    try {
      await unlink(f);
    } catch {}
  }
  try {
    await rmdir(resolve(".klx-test-media"));
  } catch {}
});

test("sharp converts PNG/JPEG to optimized WebP format with resized dimensions", async () => {
  const source = await readFile(resolve("public/images/klx-logo.png"));
  assert.ok(source.length > 0);

  const metadata = await sharp(source).metadata();
  assert.equal(metadata.format, "png");

  const webpBuffer = await sharp(source)
    .rotate()
    .resize({ width: 200, withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer();

  assert.ok(webpBuffer.length > 0);
  const webpMeta = await sharp(webpBuffer).metadata();
  assert.equal(webpMeta.format, "webp");
  assert.equal(webpMeta.width, 200);
});

test("media upload route successfully processes, saves WebP, and records in database", async () => {
  const { getDb, COLLECTIONS } = await import("../src/server/db/client");
  const { SESSION_COOKIE } = await import("../src/server/http");
  const { POST } = await import("../src/app/api/admin/media/route");

  const database = await getDb();
  const userId = "test-owner-id";
  await database.collection(COLLECTIONS.USERS).insertOne({
    id: userId,
    email: "support@poolpay.space",
    role: "owner",
    fullName: "Test Owner",
    passwordHash: "hash",
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const rawToken = "test-session-token-32-chars-long!";
  await database.collection(COLLECTIONS.SESSIONS).insertOne({
    tokenHash: digest(rawToken),
    userId,
    email: "support@poolpay.space",
    role: "owner",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000)
  });

  const form = new FormData();
  const fileBytes = await readFile(resolve("public/images/klx-logo.png"));
  form.set("file", new Blob([fileBytes], { type: "image/png" }), "logo-test.png");
  form.set("altText", "Uploaded company logo");

  const request = new Request("http://127.0.0.1:5002/api/admin/media", {
    method: "POST",
    headers: {
      cookie: `${SESSION_COOKIE}=${rawToken}`,
      origin: "http://127.0.0.1:5002",
      host: "127.0.0.1:5002"
    },
    body: form
  });

  const response = await POST(request);
  assert.equal(response.status, 200);
  const item = await response.json();
  assert.ok(item.id);
  assert.ok(item.filename.endsWith(".webp"));
  assert.equal(item.mimeType, "image/webp");
  assert.equal(item.originalName, "logo-test.png");
  assert.equal(item.altText, "Uploaded company logo");

  const diskPath = resolve(".klx-test-media", item.filename);
  createdFiles.push(diskPath);
  const savedBytes = await readFile(diskPath);
  assert.ok(savedBytes.length > 0);

  const savedMeta = await sharp(savedBytes).metadata();
  assert.equal(savedMeta.format, "webp");

  // Verify database record
  const record = await database.collection(COLLECTIONS.MEDIA).findOne({ id: item.id });
  assert.ok(record);
  assert.equal(record.filename, item.filename);
});
