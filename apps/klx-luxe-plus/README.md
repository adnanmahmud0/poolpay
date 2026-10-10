# KLX LUXE PLUS LLC

Company landing page built with Next.js 16 App Router, React 19, Tailwind CSS 4,
shadcn/ui's Radix Button pattern, Magic UI Border Beam and Marquee, and GSAP.
Reusable primitives live in `packages/ui`, with third-party license notices there.

## Local development

From the repository root:

```sh
npm install
npm run dev:klx
```

Preview: `http://127.0.0.1:5002`.

```sh
npm run build:klx
npm run typecheck:klx
npm run test:seo --workspace=@repo/klx-luxe-plus
```

Next.js prerenders the page and exports deployable files to `apps/klx-luxe-plus/out`.
The page needs no database, application server, or private environment variables.
The service picker prepares a `mailto:` inquiry; sending happens in the visitor's
email application. It does not pretend to submit a form to a backend.

## Content and design

Company name, contact person, both phone numbers, email, and six service areas
come from the supplied company PDF. Content is maintained in `src/data/site.ts`.
No service area, business hours, credentials, prices, or testimonials are invented.
The vector mark recreates the original business card's collar-and-tie motif.
The transportation image is illustrative and does not depict a verified company vehicle.

Animations include a GSAP entrance sequence and scroll reveals, Magic UI's moving
border light and service ribbon, CSS floating service icons, and button shimmer.
The ribbon pauses on hover and has an explicit pause/play button. The site respects `prefers-reduced-motion`.
The mobile navigation uses Radix Dialog for focus trapping and Escape dismissal;
FAQs use Radix Accordion with keyboard navigation and expanded-state semantics.

## Deployment (push and release only with the owner's approval)

Target: `https://klxluxeplus.poolpay.space`.

Before the approved deployment, create an A record named `klxluxeplus` pointing
to the existing PoolPay server's public IPv4 address. Add an AAAA record only if
that server is configured to serve this domain over IPv6. Ports 80 and 443 must
be reachable for web traffic and certificate validation.

The manual `Deploy KLX Luxe Plus` workflow (`.github/workflows/deploy-klx.yml`)
builds, type checks, lints, runs SEO tests, transfers only the landing-page files,
and calls `deploy/deploy-klx.sh`. It reuses existing EC2 secrets and does not
restart PoolPay containers, rewrite their Nginx configuration, or touch their database.
For an isolated approved release, commit with `[skip ci]`, push, then dispatch
this workflow on `main`; its checks still run before deployment.

The full existing production workflow also builds the static export and calls
`deploy/deploy-klx.sh`. Nginx serves `/var/www/klxluxeplus/current`, with release
directories retained under `/var/www/klxluxeplus/releases`. The switch is atomic.
Dedicated HTTP and TLS configurations live in `nginx/klxluxeplus*.conf`.
A separate Let's Encrypt certificate is issued and verified for this subdomain.
Webroot renewal includes an Nginx reload hook. Existing PoolPay certificates remain separate.

To roll the landing page back on the server, point `current.next` at a retained
release and atomically rename it over `current`. No database rollback is needed.
Server-side Nginx and certificate checks must be verified during the approved
deployment; local builds cannot verify server configuration or DNS.

## SEO and social previews

Home-page metadata and JSON-LD live in `src/config/seo.ts`. The production HTTPS
canonical, sitemap, and robots file all use `https://klxluxeplus.poolpay.space/`.
The exported initial HTML contains the content and metadata without requiring
crawlers to execute JavaScript. The 404 page is noindex and does not inherit the
home-page canonical. Nginx redirects HTTP and explicit `/index.html` requests to
the canonical HTTPS home page.

Open Graph and explicit X large-card tags reference an absolute, public PNG at
`/images/klx-social-card.png` (1200 × 630). The same image is suitable for link
previews in clients that consume Open Graph, including LinkedIn, Facebook, and
messaging apps. Preview appearance and caching are controlled by each platform;
Instagram posts do not automatically become rich website link cards.

`Organization`, `WebSite`, and `WebPage` JSON-LD identify the business, both phone
numbers, email, logo, and six service areas. Unknown addresses, service areas,
reviews, opening hours, and social profiles are deliberately omitted. Add only
verified company profile URLs to `sameAs` and any visible social links later.

Code-native share artwork is in `brand/social-card.svg`; regenerate the social
PNG, 512px company logo, Apple touch icon, and 48px favicon with
`npm run assets --workspace=@repo/klx-luxe-plus`. Generated files are checked in, so a production
build does not depend on system fonts or an image-generation service.

The SEO regression suite checks the built `out/` HTML, canonical, robots,
sitemap, structured-data relationships, social tags, image dimensions, icons,
server-rendered content, and 404 indexing behavior. CI runs it before uploading
the deployment artifact.

After deployment, verify the home page, `/robots.txt`, `/sitemap.xml`, and share
image return HTTP 200 over public HTTPS, while an unknown path returns HTTP 404.
Then use Google Rich Results Test and Search Console URL Inspection, submit the
sitemap, and refresh previews with Facebook Sharing Debugger and LinkedIn Post
Inspector. This requires the live domain: local checks cannot prove public crawler
access, indexing, rankings, or third-party preview rendering.

References: [Next.js metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata),
[Open Graph](https://ogp.me/),
[Google organization markup](https://developers.google.com/search/docs/appearance/structured-data/organization),
[Google site names](https://developers.google.com/search/docs/appearance/site-names),
[LinkedIn sharing requirements](https://www.linkedin.com/help/linkedin/answer/a521928).

## Generated asset

Built-in image generation was used (not the API/CLI fallback). The selected image
is saved in this workspace at `public/images/luxury-transport.webp`, converted to
WebP at quality 86 (1672 × 941; approximately 225 KB).

Generation prompt:

> Use case: ads-marketing. Asset type: photographic hero background for KLX LUXE PLUS LLC, a company offering luxury transportation and everyday professional services. Create one cinematic, photorealistic wide landscape image, approximately 16:9. Subject: a sleek unbranded black executive sedan viewed from its front three-quarter angle, on the RIGHT HALF of frame, parked on a refined palm-lined driveway at blue hour. Warm soft light from a modern building in the far background, cool muted steel-blue sky, subtle pavement reflections, real paint and chrome texture, high-end editorial automotive photography. Composition: full car visible, generous dark quiet negative space across LEFT HALF for white website headline; camera at vehicle hood height; car occupies lower right. Palette: charcoal, midnight blue, pale blue accents, subtle warm highlights. Constraints: no people, no readable license plates, no badges or manufacturer logos, no text, no watermarks, no fantasy styling. This is illustrative transportation imagery, not a claim about the company's actual fleet.
