import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import test from "node:test";

const EXPORT_ROOT = new URL("../out/", import.meta.url);
const SITE_HOME = "https://klxluxeplus.poolpay.space/";
const SHARE_IMAGE = `${SITE_HOME}images/klx-social-card.png`;
const HTML = readFileSync(new URL("index.html", EXPORT_ROOT), "utf8");
const HEAD = HTML.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? "";
const decodeHtml = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
const attributes = (tag) =>
  Object.fromEntries(
    Array.from(tag.matchAll(/([\w:-]+)="([^"]*)"/g), ([, key, value]) => [key, decodeHtml(value)])
  );
const META = Array.from(HEAD.matchAll(/<meta\s[^>]+>/g), ([tag]) => attributes(tag));
const LINKS = Array.from(HEAD.matchAll(/<link\s[^>]+>/g), ([tag]) => attributes(tag));

function meta(name) {
  const matches = META.filter((item) => item.name === name || item.property === name);
  assert.equal(matches.length, 1, `Expected one ${name} tag in the initial HTML head`);
  assert.ok(matches[0].content, `${name} must not be empty`);
  return matches[0].content;
}

function exportedAsset(url) {
  const parsed = new URL(url, SITE_HOME);
  assert.equal(parsed.origin, new URL(SITE_HOME).origin);
  return new URL(parsed.pathname.slice(1), EXPORT_ROOT);
}

function assertPng(url, width, height) {
  const path = exportedAsset(url);
  const bytes = readFileSync(path);
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16), width);
  assert.equal(bytes.readUInt32BE(20), height);
  assert.ok(statSync(path).size < 5_000_000, "Preview images must remain lightweight");
}

test("home page has one production canonical and useful search metadata", () => {
  assert.match(HEAD, /<title>KLX LUXE PLUS LLC \| Luxury Transport/);
  assert.match(meta("description"), /Jean Derival.*transportation.*immigration/);
  assert.deepEqual(
    // Next.js normalizes away the root slash; URL parsing restores its equivalent canonical form.
    LINKS.filter((link) => link.rel === "canonical").map((link) => new URL(link.href).href),
    [SITE_HOME]
  );
  assert.match(meta("robots"), /index, follow/);
  assert.doesNotMatch(meta("robots"), /noindex|nofollow/);
  assert.match(meta("googlebot"), /max-image-preview:large/);
  assert.match(HTML, /<html lang="en"/);
  assert.doesNotMatch(HEAD, /localhost|127\.0\.0\.1|vite/i);
});

test("Open Graph social previews have absolute URLs, image details, and branded copy", () => {
  assert.equal(meta("og:type"), "website");
  assert.equal(new URL(meta("og:url")).href, SITE_HOME);
  assert.equal(meta("og:site_name"), "KLX LUXE PLUS LLC");
  assert.equal(meta("og:locale"), "en_US");
  assert.match(meta("og:title"), /KLX LUXE PLUS LLC/);
  assert.match(meta("og:description"), /Jean Derival/);
  assert.equal(meta("og:image"), SHARE_IMAGE);
  assert.equal(meta("og:image:secure_url"), SHARE_IMAGE);
  assert.equal(meta("og:image:type"), "image/png");
  assert.equal(meta("og:image:width"), "1200");
  assert.equal(meta("og:image:height"), "630");
  assert.match(meta("og:image:alt"), /KLX LUXE PLUS LLC/);
  assertPng(SHARE_IMAGE, 1200, 630);
});

test("X has explicit large-card metadata without invented social account handles", () => {
  assert.equal(meta("twitter:card"), "summary_large_image");
  assert.equal(meta("twitter:title"), meta("og:title"));
  assert.equal(meta("twitter:description"), meta("og:description"));
  assert.equal(meta("twitter:image"), SHARE_IMAGE);
  assert.equal(meta("twitter:image:alt"), meta("og:image:alt"));
  assert.equal(
    META.some((item) => item.name === "twitter:site"),
    false
  );
});

test("structured data identifies the company, website, and six real service areas", () => {
  const blocks = Array.from(
    HTML.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    ([, json]) => JSON.parse(json)
  );
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0]["@context"], "https://schema.org");
  const graph = blocks[0]["@graph"];
  const organization = graph.find((item) => item["@type"] === "Organization");
  const website = graph.find((item) => item["@type"] === "WebSite");
  const page = graph.find((item) => item["@type"] === "WebPage");
  assert.equal(organization.name, "KLX LUXE PLUS LLC");
  assert.equal(organization.email, "klxluxeplus@gmail.com");
  assert.equal(organization.url, SITE_HOME);
  assert.deepEqual(
    organization.contactPoint.map((point) => point.telephone),
    ["+14077761969", "+17723071003"]
  );
  assertPng(organization.logo.url, 512, 512);
  const services = organization.hasOfferCatalog.itemListElement;
  assert.equal(services.length, 6);
  assert.equal(new Set(services.map((offer) => offer.itemOffered["@id"])).size, 6);
  for (const offer of services) {
    assert.equal(offer.itemOffered["@type"], "Service");
    assert.equal(offer.itemOffered.provider["@id"], organization["@id"]);
    assert.ok(
      HTML.includes(offer.itemOffered.name),
      "Each marked-up service must appear on the page"
    );
  }
  assert.equal(website.url, SITE_HOME);
  assert.equal(website.publisher["@id"], organization["@id"]);
  assert.equal(page.isPartOf["@id"], website["@id"]);
  assert.equal(page.mainEntity["@id"], organization["@id"]);
  for (const unknownFact of [
    "address",
    "sameAs",
    "aggregateRating",
    "openingHours",
    "priceRange"
  ]) {
    assert.equal(Object.hasOwn(organization, unknownFact), false);
  }
});

test("crawlable initial HTML contains the content, contact links, and real exported images", () => {
  assert.equal((HTML.match(/<h1(?:\s|>)/g) ?? []).length, 1);
  assert.equal((HTML.match(/<article(?:\s|>)/g) ?? []).length, 6);
  assert.match(HTML, /href="tel:\+14077761969"/);
  assert.match(HTML, /href="tel:\+17723071003"/);
  assert.match(HTML, /href="mailto:klxluxeplus@gmail\.com"/);
  const images = Array.from(HTML.matchAll(/<img\s[^>]+>/g), ([tag]) => attributes(tag));
  assert.ok(images.length >= 2);
  for (const image of images) {
    assert.ok(Object.hasOwn(image, "alt"), "Images need an alt attribute, even when decorative");
    assert.ok(statSync(exportedAsset(image.src)).size > 0);
  }
});

test("robots and sitemap allow crawling and list only the production home page", () => {
  const robots = readFileSync(new URL("robots.txt", EXPORT_ROOT), "utf8");
  const sitemap = readFileSync(new URL("sitemap.xml", EXPORT_ROOT), "utf8");
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.doesNotMatch(robots, /Disallow:\s*\/\s*$/m);
  assert.ok(robots.includes(`Sitemap: ${SITE_HOME}sitemap.xml`));
  assert.deepEqual(
    Array.from(sitemap.matchAll(/<loc>([^<]+)<\/loc>/g), ([, url]) => url),
    [SITE_HOME]
  );
});

test("browser and Apple icons exist at their advertised dimensions", () => {
  assert.ok(LINKS.some((link) => link.rel === "icon" && link.href === "/favicon.svg"));
  assertPng("/favicon-48.png", 48, 48);
  assert.ok(LINKS.some((link) => link.rel === "apple-touch-icon" && link.sizes === "180x180"));
  assertPng("/apple-touch-icon.png", 180, 180);
});

test("not-found pages are noindex and do not claim the home page canonical or social preview", () => {
  const errorHtml = readFileSync(new URL("404.html", EXPORT_ROOT), "utf8");
  assert.match(errorHtml, /<meta name="robots" content="noindex"/);
  assert.doesNotMatch(errorHtml, /<link rel="canonical"/);
  assert.doesNotMatch(errorHtml, /property="og:url"/);
});
