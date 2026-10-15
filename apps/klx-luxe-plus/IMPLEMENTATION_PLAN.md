# KLX LUXE PLUS LLC — implementation plan

Updated: October 14, 2026

Status: Implementation restored in the original checkout on October 15, 2026 after the reset. Public CMS rendering, administration, appointments, Stripe integration, notifications and media code are present. Final verification is in progress; production deployment is not authorized or completed.

### Restoration verification — October 15, 2026

### Agreed-price order workflow — October 15, 2026

### Landing page section visual alignment in admin panel — October 15, 2026

- Upgraded `/admin/content` with visual SectionManager showing interactive preview cards for every landing page section (Hero/PoolPay, Services, About, Appointments, FAQs, Advertisements, Footer & Policies) mirroring the landing page aesthetics.
- Added live reordering (`↑ Move Up`, `↓ Move Down`) and visibility toggles directly on section cards with instant database sync.
- Aligned `/admin/services` catalog cards to the landing page luxury styling: category icons, `/ 01` numbering, live visibility pills, price/duration tags, and BorderBeam.
- Elevated `/admin` Overview with an executive banner, landing-page styled KPI cards, and a real-time "Landing Page Sections at a Glance" widget.
- Verification: TypeScript typecheck, ESLint, 13 backend workflow/commerce tests, and 3 SEO tests passed with zero errors.

### Follow-up improvements — October 15, 2026

Latest service-list decision: retain exactly Tax, Immigration document assistance,
Translations and Luxury transportation in the default/demo catalog. Finance and
Computer support are removed, not retained as hidden entries. This supersedes the
earlier six-service default plan. Customer order prices remain independent of the
consultation-only service catalog.

- AM/PM available-time picker with clock icon; timezone-aware availability excludes booked durations, weekly off days and blocked dates.
- Requested appointments now reserve slots immediately and reject concurrent overlap atomically. Admin availability editor and Accept/Reject controls; rejection requires a reason and releases the slot.
- HTML business notification buttons open authenticated review and preserve the requested action through login. No booking mutation occurs on email-link GET requests.
- Customer email OTP replaces the required reference input. Hashed, expiring, attempt-limited, single-use codes grant short-lived customer sessions and email-scoped paginated order/payment history with colored status badges.
- `/services` page linked from main navigation, paginated media thumbnail gallery, smooth-scroll metadata warning fixed and obsolete image preload removed.
- Email delivery is intentionally disabled in the temporary review environment; production sender/worker configuration remains required.
- Verification: production build, TypeScript, lint, 13 backend tests and 3 SEO tests passed. Browser checks covered AM/PM availability, saving working hours/off days, reason-required rejection, email-action review, OTP-scoped order history and uploaded thumbnails. Real email delivery and public webhook checks remain production launch work.

- Admin-created customer orders extend the existing quote/payment records, with short unique numeric references and immutable agreed amounts.
- Order creation and resend actions enqueue private email payment links.
- Public `#pay-order` reference/email lookup requests a link by email, never returns private order details or bearer tokens. Matching is case-insensitive; requests are throttled and repeated mail requests deduplicated.
- Unused unpaid orders can be cancelled. Checkout claims require active status atomically and latch checkout history, preventing cancellation during provider processing. Existing payments/refunds and appointment confirmation stay separate.
- Backend tests cover unique references, matching/wrong email, generic lookup acknowledgements, resend deduplication, cancellation and checkout-history protection.

- TypeScript and lint passed.
- All 10 backend integration tests and 3 SEO tests passed.
- Next.js 16.4.1 production build passed using the webpack builder.
- Standalone production HTTP checks passed: unauthorized access, login, origin protection, server-rendered SEO/privacy, image upload/serving and invalid webhook rejection.
- Production database, sender verification, public Stripe webhook, deployment wiring and final mobile/browser review remain launch checks. No push, deployment, live payment or real refund was performed during restoration.

## 1. Confirmed scope and defaults

Build the public website, private administration, and backend inside the existing
`apps/klx-luxe-plus` Next.js project. Use Next.js App Router pages and Route Handlers
for the backend; do not implement KLX features in `apps/backend` or require the
separate PoolPay administration application.

| Setting                               | Planned value                                             |
| ------------------------------------- | --------------------------------------------------------- |
| Public website                        | `https://klxluxeplus.poolpay.space`                       |
| Administration                        | `https://klxluxeplus.poolpay.space/admin`                 |
| Public contact and notification email | `support@poolpay.space`                                   |
| Initial owner account email           | `support@poolpay.space`                                   |
| Public telephone                      | `+1 (607) 900-4569`                                       |
| Business timezone                     | `America/New_York` — configurable US Eastern default      |
| Initial currency                      | `USD` — default to confirm before accepting live payments |
| Appointment model                     | Customer requests a time; administrator confirms it       |
| Payment provider                      | Stripe, using server-side environment credentials         |
| Refunds                               | Full and partial refunds directly in KLX administration   |

The US has multiple timezones. `America/New_York` is an implementation assumption,
not a confirmed business location. Store dates in UTC, use the configured IANA
timezone for business scheduling, and handle daylight-saving changes. Display the
timezone beside appointment fields and confirmations.

The root `.env` was inspected for variable names only. Stripe test/live keys,
webhook-secret variable names, database settings, and email-provider settings exist.
This does not verify their values, account ownership, permissions, or connectivity.
Never copy secret values into this document, source control, browser bundles, or logs.

## 2. Current project and required changes

- KLX currently uses Next.js 16, React 19, Tailwind CSS 4, shared shadcn/ui and
  Magic UI components, and GSAP animations.
- `next.config.ts` uses `output: "export"`. Deployment currently uploads `out/`
  and Nginx serves static files.
- Contact information, service copy, and SEO content currently live in source files.
- The repository has MongoDB, Stripe, email, upload, and advertisement integrations
  elsewhere. Reuse configuration conventions or genuinely shared utilities where
  suitable, with KLX business logic implemented in this application.

Convert KLX to a running Next.js Node application, preferably using standalone
output and a dedicated container. This supports protected APIs, server-rendered
published content, payments, and live editing. Update both dedicated KLX and any
shared deployment workflows that currently expect its static export.

## 3. Public website

1. Replace all personal contact details and references to the client's personal name
   with the company identity and the confirmed public contacts. Include FAQs,
   email templates, accessible text, metadata, JSON-LD, and share artwork.
2. Make PoolPay the primary hero: real logo and screenshots, clear description,
   active Google Play link, and iPhone coming-soon presentation until a real iOS
   store URL is configured.
3. Arrange visible services as Tax, Immigration document assistance, Translation,
   and Transportation. Preserve computer support and finance service definitions
   as hidden editable entries until the owner chooses their visibility.
4. Follow services with company information, appointments/contact, FAQs, and footer.
5. Add manageable advertisement placements after PoolPay and after services.
6. Preserve the navy/blue visual theme, responsive layouts, keyboard navigation,
   and reduced-motion behavior.
7. Add privacy, terms, cancellation, and refund policy pages with editable drafts.
   Business policy text must be supplied or reviewed by the owner before publication.

Render published content and SEO metadata on the server. Do not make search engines
depend on a browser-only content request. Show a clear appointment confirmation
screen only after the request has been persisted.

## 4. Administration and content management

Create the following protected sections:

| Route                   | Features                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| `/admin`                | Appointment, payment, refund, and advertisement overview                 |
| `/admin/content`        | Hero, About, FAQs, navigation, footer, section visibility/order          |
| `/admin/services`       | Service details, ordering, visibility, prices, deposits, duration        |
| `/admin/poolpay`        | App description, screenshots, logo, store links                          |
| `/admin/appointments`   | List/calendar, filters, review, confirm, reschedule, cancel, complete    |
| `/admin/payments`       | Quotes/payment requests, payment history, balances, full/partial refunds |
| `/admin/advertisements` | Banner content, placement, scheduling, priority, activation              |
| `/admin/media`          | Uploads, alternative text, usage information                             |
| `/admin/settings`       | Public contacts, business timezone, SEO, policies, notification settings |
| `/admin/audit-log`      | Content publication, appointment updates, payment/refund actions         |

Use structured content forms and reusable UI components. Provide validation,
unsaved-change feedback, draft preview, publish, and content-version restoration.
Preview access must be authenticated or use expiring scoped tokens. Publish content
atomically and refresh the public page's content/metadata cache.

Version restoration applies to website content; it must never reverse payments,
refunds, or appointment history. Price changes affect new purchases. Existing quotes
and purchases retain their agreed price, currency, and service-description snapshot.

Initial owner provisioning uses a local/server command and an expiring setup link,
with no public administrator registration or hardcoded password. Use the support
email as requested. Future additional accounts should be attributable individually.

## 5. Appointments and notifications

Visitor flow: choose a service, enter name and contact details, select a preferred
date/time, provide a short optional message, and submit an appointment request.
Clearly explain that the requested time awaits business confirmation.

- Persist requests before attempting notification delivery.
- Provide request reference, acknowledgement, and private status links using
  expiring unguessable tokens where needed.
- Track requested, confirmed, rescheduled, cancelled, declined, and completed states.
- Store availability, service duration, blocked dates, and business timezone.
- Check conflicts when confirming/rescheduling, including concurrent updates.
- Keep appointment status separate from payment status: paying does not automatically
  confirm a time, and cancelling does not automatically issue a refund.
- Email business notifications to `support@poolpay.space`; send customer updates
  for requests, confirmations, changes, payment requests, and refund results.
- Use a persistent notification outbox with retries and visible delivery failures.
  Run its processor as an application-owned worker or authenticated scheduled task.
- Enable SMS only after verifying sender configuration, delivery capability, and
  customer consent. Email is the initial notification channel.
- Add server validation, throttling, and spam protection. Do not collect identity,
  tax, immigration documents, or card details in the appointment form.

## 6. Pricing, checkout, and refunds

### Pricing controls

Allow service pricing modes: request a quote, fixed price, or deposit plus remaining
balance. Admin can customize the service amount, deposit, and individual quoted
amounts. Start services in quote mode until real prices are entered. Use integer
minor currency units and validate amounts and currency on the server.

Create expiring payment requests connected to a service/appointment. Customers see
the service description, amount, deposit/balance breakdown, and applicable policy
before entering Stripe Checkout. Do not expose sensitive appointment notes to Stripe.

### Checkout processing

- Use hosted Stripe Checkout with server-created sessions and server-selected amounts.
- Use test credentials during development; select test/live mode through deployment
  configuration, separate from the PoolPay app's global environment settings.
- Attach KLX identifiers to Stripe metadata and retain Stripe object IDs and mode.
- Keep KLX orders, payments, and refunds in dedicated records; never treat PoolPay
  contributions as KLX purchases or include them in KLX reports.
- Support pending, processing, paid, failed, expired, partially refunded, and refunded
  states, with deposits and multiple payments reconciled against the order balance.
- Verify webhook signatures using the raw request body. Process repeated/out-of-order
  events safely and record unique event IDs. Use idempotency keys for payment creation.
- Confirm payment from verified Stripe state; a success-page redirect alone is insufficient.
- Provide reconciliation for missed notifications or uncertain API responses.

### Refunds in `/admin`

Admin opens a KLX payment, chooses full or partial refund, enters amount/reason,
reviews the refundable balance, and confirms. The server verifies refund permission,
payment ownership, mode/account, and the remaining refundable amount before calling Stripe.

Store a refund operation before the provider call, use an idempotency key, and prevent
concurrent requests from reserving more than the refundable balance. Reconcile uncertain
responses instead of issuing another independent refund. Display pending, succeeded,
failed, and cancelled refund states; synchronize changes made in Stripe's Dashboard.

Record actor, amount, reason, timestamps, and provider reference in the audit log.
Notify the customer on the relevant state change. Refunds go to the original payment
method; the admin interface must not request an alternative card or bank destination.
Do not promise instant settlement. Funds and processing depend on Stripe and the bank.

## 7. Advertisements and media

Manage manually supplied advertisements with image, alternative text, title,
destination, placement, priority, start/end time, and active state. Label advertisements
clearly and hide empty placements. No advertiser self-service marketplace is required.

Use persistent object storage or a dedicated persistent media volume, selected from
the existing deployment capabilities. Do not store uploads only inside a replaceable
release/container directory. Validate MIME signatures, size, dimensions, and URLs;
prefer raster image uploads and reject executable or unsanitized SVG content.
Protect referenced images from accidental deletion and keep draft media private as needed.

## 8. Backend structure inside the Next.js project

```text
apps/klx-luxe-plus/
  src/
    app/
      admin/                  # Login, dashboard, and management pages
      api/
        auth/                 # Login, logout, setup/reset flows
        appointments/         # Public request submission
        checkout/             # Secure payment-request checkout
        stripe/webhook/       # Signed Stripe events
        admin/                # Protected content/business management APIs
        health/               # Deployment health check
    server/
      db/                     # MongoDB connection and repositories
      auth/                   # Sessions and permission checks
      modules/                # Content, services, appointments, payments, refunds, ads
      integrations/           # Stripe, email, storage
      jobs/                   # Outbox delivery and reconciliation
      validation/             # Server request validation
    env.ts                    # Validated server/client environment access
  scripts/                    # Seed, owner provisioning, worker entry points
  tests/                      # Authorization, workflow, payment, SEO verification
```

Use server-only modules and Node runtime for database/provider integrations. Business
logic belongs in services, with thin Route Handlers. Add API contracts/documentation.
Reuse `packages/ui` for shared primitives; move genuinely cross-app reusable code to
shared packages instead of importing another application's internal files.

Planned durable records: administrators/sessions, site drafts and published versions,
services, appointments, quotes/orders, payments, refunds, Stripe events, advertisements,
media, notification outbox, settings, and audit events. Use a dedicated KLX database
where deployment access permits, or a consistently prefixed KLX collection namespace.
Do not alter the existing PoolPay collections.

Protect all administrative operations on the server, use secure HTTP-only sessions,
password hashing, CSRF/origin checks, rate limits, and permissions for financial actions.
Exclude private pages from indexing and public caches. Store minimal customer data,
redact logs, and provide a configurable retention policy. A hidden admin URL is not
an access-control mechanism.

## 9. Environment configuration

Next.js normally reads environment files from the application root, so explicitly load
the repository-root `.env` for local KLX commands without overriding externally supplied
deployment values. Validate the selected configuration through `src/env.ts` and document
only variable names/placeholders in a KLX `.env.example`.

Reuse existing `STRIPE_TEST_SECRET_KEY` and `STRIPE_LIVE_SECRET_KEY` when their account
is confirmed to receive KLX payments. Existing generic webhook secrets may belong to
other endpoints and must not be assumed to validate KLX events. Add:

```dotenv
KLX_SITE_URL=https://klxluxeplus.poolpay.space
KLX_SUPPORT_EMAIL=support@poolpay.space
KLX_OWNER_EMAIL=support@poolpay.space
KLX_TIMEZONE=America/New_York
KLX_CURRENCY=usd
KLX_STRIPE_MODE=test
KLX_STRIPE_TEST_WEBHOOK_SECRET=<KLX test endpoint signing secret>
KLX_STRIPE_LIVE_WEBHOOK_SECRET=<KLX live endpoint signing secret>
KLX_DATABASE_URL=<KLX database connection>
KLX_SESSION_SECRET=<generated secret>
```

Document any additional worker, storage, and email variables during implementation.
Use `support@poolpay.space` as the public contact, Reply-To, and intended sender;
verify domain/sender authorization before sending through the configured provider.
Existing `SMTP_FORM` is a repository variable name and should be mapped deliberately.
Never mutate global PoolPay sender settings to configure KLX.

Inject production secrets at runtime through server/container configuration. Root `.env`
presence on the developer computer does not provision the production server. Do not
include root `.env` in build artifacts, container images, or client bundles.

## 10. Stripe setup instructions for the owner/deployer

Perform these steps when the implemented endpoint is available; this plan does not
change Stripe settings or issue real transactions/refunds.

1. Confirm that the account behind the supplied keys is the intended KLX merchant,
   with its business details and settlement bank account configured. If the intended
   recipient is a connected account, explicitly design that charge/refund flow before
   live activation; do not assume the existing PoolPay Connect configuration applies.
2. In Stripe's test environment, create a webhook/event destination for this account:
   `https://klxluxeplus.poolpay.space/api/stripe/webhook`.
3. Subscribe to the implemented events: `checkout.session.completed`,
   `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `checkout.session.expired`, `refund.created`, `refund.updated`, `refund.failed`,
   and `charge.refunded`. Confirm the final list against the implementation.
4. Put that destination's signing secret into `KLX_STRIPE_TEST_WEBHOOK_SECRET`.
   Keep existing PoolPay webhook destinations active. For local development, forward
   events with Stripe CLI to `http://127.0.0.1:5002/api/stripe/webhook` and use the
   CLI listener's separate signing secret in a local override.
5. Configure checkout branding, public support information, receipt behavior, and
   the statement descriptor using accurate merchant details. Set payment/refund
   email behavior deliberately to avoid duplicate customer notifications.
6. Test successful and failed checkout, expiry, repeated webhook delivery, full and
   partial refunds, refund failure/pending behavior, and Dashboard-issued refunds.
7. Create the corresponding live event destination and save its distinct signing
   secret as `KLX_STRIPE_LIVE_WEBHOOK_SECRET`. Confirm live keys and set
   `KLX_STRIPE_MODE=live` only for the approved production activation.
8. Verify HTTPS delivery, event processing, and reconciliation after release. Do not
   execute a real charge or refund as an unattended deployment check.

Hosted Checkout does not require a browser-side secret or a publishable key when the
server returns a redirect URL. Do not expose keys unnecessarily. Stripe products/prices
need not be entered manually if the implementation creates validated checkout line items
from saved KLX quotes. Automatic tax collection is a separate business configuration;
offering tax services does not establish sales-tax collection requirements.

## 11. Implementation phases and acceptance criteria

1. **Foundation:** runtime conversion, validated environment loading, KLX database,
   admin provisioning/login, permissions, health endpoint, deployment skeleton.
2. **Website and CMS:** public contact replacement, PoolPay hero, editable service
   order/visibility, drafts, preview/publish, media, SEO, and policy pages.
3. **Appointments:** persisted requests, admin operations, timezone/conflict checks,
   acknowledgement email, notification outbox/retries.
4. **Commerce:** editable prices/deposits, quotes/payment requests, test Checkout,
   event processing, balances, complete admin refund workflow, reconciliation.
5. **Advertisements and operations:** banner scheduling, audit log, settings,
   backups, maintenance/worker setup, and owner documentation.
6. **Verification and review:** demonstrate the complete workflow locally/in staging,
   then prepare the release for the user's push/deployment confirmation.

Verification must cover unauthorized admin/API access; session and input validation;
draft isolation; publication/cache updates; concurrent appointment confirmation;
price tampering; duplicate checkout/refund requests; webhook signature failures,
retries and out-of-order delivery; deposit/balance calculations; email failure recovery;
upload validation; responsive/keyboard/reduced-motion behavior; and SEO/social metadata.

Adapt the existing static-export SEO suite to verify server-rendered pages. Run focused
tests, type checks, lint, and production build; test the actual production start mode.
Verify that the public pages contain no personal contact details and that KLX changes
do not modify PoolPay financial data or disrupt its existing endpoints.

## 12. Deployment and owner handoff

Update `next.config.ts`, start scripts, container/service configuration, Nginx,
`deploy/deploy-klx.sh`, dedicated KLX workflow, and shared workflows referencing KLX
static artifacts. Reverse proxy the existing subdomain to a dedicated local KLX port;
retain TLS and HTTP-to-HTTPS redirects. Permit the signed webhook route through
normal request-size/routing limits while retaining application signature verification.

Persist database/media across releases, run the notification processor, configure
backups, and protect health/monitoring output from leaking configuration. Deploy a
new instance, verify readiness, then switch traffic and retain a previous application
release. Use additive data changes so application rollback remains possible; payment
history and provider transactions are never rolled back by reverting application code.

Deliver owner instructions for content publishing, price changes, appointment review,
payment requests, full/partial refunds, advertisements, and Stripe setup. Remaining
owner-supplied launch content: actual prices, business hours/availability, reviewed
policies, and initial advertisement artwork. Confirm the Eastern timezone and USD
defaults before the first production appointment/payment. These do not prevent
implementation using configurable defaults and quote-based pricing.

## References

- [Next.js static export limitations](https://nextjs.org/docs/app/guides/static-exports)
- [Next.js environment loading](https://nextjs.org/docs/app/guides/environment-variables)
- [Stripe Checkout payment confirmation](https://docs.stripe.com/checkout/fulfillment)
- [Stripe webhook configuration and signature verification](https://docs.stripe.com/webhooks)
- [Stripe full and partial refunds](https://docs.stripe.com/refunds)
