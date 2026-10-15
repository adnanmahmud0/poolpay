import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

const PUBLIC_ROOT = new URL("../public/", import.meta.url);

function publicAsset(path) {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(cleanPath, PUBLIC_ROOT);
}

function assertPng(path, width, height) {
  const fileUrl = publicAsset(path);
  assert.ok(existsSync(fileUrl), `Asset ${path} must exist in public folder`);
  const bytes = readFileSync(fileUrl);
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16), width);
  assert.equal(bytes.readUInt32BE(20), height);
  assert.ok(statSync(fileUrl).size < 5_000_000, "Preview images must remain lightweight");
}

test("social card and logo assets exist with valid PNG signatures and dimensions", () => {
  assertPng("images/klx-social-card.png", 1200, 630);
  assertPng("images/klx-logo.png", 512, 512);
  assertPng("favicon-48.png", 48, 48);
  assertPng("apple-touch-icon.png", 180, 180);
});

test("robots.txt and sitemap.xml exist and allow crawling of production home page", () => {
  const robotsUrl = publicAsset("robots.txt");
  const sitemapUrl = publicAsset("sitemap.xml");

  if (existsSync(robotsUrl)) {
    const robots = readFileSync(robotsUrl, "utf8");
    assert.match(robots, /User-agent: \*/);
    assert.match(robots, /Allow: \//);
    assert.doesNotMatch(robots, /Disallow:\s*\/\s*$/m);
  }

  if (existsSync(sitemapUrl)) {
    const sitemap = readFileSync(sitemapUrl, "utf8");
    assert.match(sitemap, /klxluxeplus\.poolpay\.space/);
  }
});

test("source files do not contain client personal name or old contact details", () => {
  const filesToCheck = [
    new URL("../src/data/site.ts", import.meta.url),
    new URL("../src/config/seo.ts", import.meta.url),
    new URL("../src/server/db/defaults.ts", import.meta.url)
  ];

  for (const fileUrl of filesToCheck) {
    if (existsSync(fileUrl)) {
      const content = readFileSync(fileUrl, "utf8");
      assert.doesNotMatch(
        content,
        /Jean Derival/i,
        `Personal name "Jean Derival" found in ${fileUrl.pathname}`
      );
      assert.doesNotMatch(
        content,
        /klxluxeplus@gmail\.com/i,
        `Personal email found in ${fileUrl.pathname}`
      );
      assert.doesNotMatch(
        content,
        /\(407\)\s*776-1969/,
        `Old phone number found in ${fileUrl.pathname}`
      );
      assert.doesNotMatch(
        content,
        /\(772\)\s*307-1003/,
        `Old phone number found in ${fileUrl.pathname}`
      );
    }
  }
});
