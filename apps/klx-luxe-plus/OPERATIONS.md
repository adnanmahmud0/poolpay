# KLX website and administration — owner handoff

The public website, admin pages, database access, email queue, Stripe checkout,
and refunds are implemented in this Next.js application. The owner signs in at
`/admin` using `support@poolpay.space`.

## Implementation checkout

The implementation was restored after the reset into
`C:/Users/Adnan/ZProject/adnan/derival81` on October 15, 2026.
The earlier managed worktree remains a recovery reference. Continue development
in this original checkout; do not overwrite unrelated existing changes.

Production activation changes were blocked by automatic approval review because
the user reserved deployment approval for later. Deployment drafts inherited from
the original checkout are not a verified release workflow. Do not dispatch them
until the deployment changes have been completed and approved.

## Local development and review

### Availability, appointment decisions and customer access

In `/admin/appointments`, use **Set working hours & off days**. Select working weekdays,
opening/closing times, and individual blocked dates. Times use the configured business
timezone. A requested appointment reserves its entire service duration immediately;
rejection/cancellation releases that reservation. Requests remain unconfirmed until accepted.
Changing availability does not automatically cancel existing requests.

Business booking emails contain Accept and Reject buttons. These open authenticated
admin review; no GET link changes a booking. Login preserves the selected email action.
Rejecting requires a customer-facing reason, included in the customer notification.

The home-page payment section now uses email OTP verification instead of requiring an
order reference. Codes last 10 minutes, permit five attempts, and are single-use. The
customer cookie lasts 30 minutes and grants access only to that verified email's orders.
Order history is paginated, with colored status badges, payment/refund history and pending
payment links. Existing emailed private payment links continue to work.

OTP and booking emails need a verified sender and the outbox processor running at least
once a minute. The temporary review server deliberately disables external email delivery;
do not expect codes in a real inbox in that preview. Tests verify codes from the isolated
test outbox without sending mail. No OTP is displayed publicly or logged.

Media library thumbnails are paginated across every upload record in the active database.
The temporary preview database resets on restart, so upload metadata is not retained there.
Production requires persistent database and media storage as described below.

### Agreed-price customer orders

In `/admin/payments`, choose **Create customer order**, enter the customer's name/email,
service description and agreed amount in USD, then save. The notification queue receives
an email with the short `KLX-100001` style reference and private payment link. Use
**Resend payment email** when necessary. Customers can also use **Pay an order** on
the home page with their reference and email to request a fresh link. Lookup always
returns the same acknowledgement, never customer details or the private URL; repeated
requests are throttled and deduplicated. The outbox worker must run for delivery.

Existing orders retain their agreed price. To change it, cancel an unused order and
create a replacement. Cancellation is intentionally blocked after any checkout attempt
or payment; reconcile Stripe status first. Cancellation does not issue a refund.

From this checkout's repository root:

```sh
npm install --include-workspace-root --workspace=@repo/klx-luxe-plus
npm run dev:klx
```

Next's configuration loads the repository root `.env` without overriding externally
provided variables. An app-local `.env.local` takes precedence. To use another
credential file in a worktree, set `KLX_ENV_FILE` to its absolute path.
No environment files belong in source control or the deployment image.

A database is needed for administration and bookings. When MongoDB is not running
locally, use the isolated review server:

```sh
npm run dev:review --workspace=@repo/klx-luxe-plus
```

This creates a temporary local database, generates a review administrator password,
and starts the website on `http://127.0.0.1:5003`. It prints the temporary login
credentials to the local terminal. Its records disappear when the review server
stops. Email delivery is disabled in this review fixture. Stripe mode is always test.

To review the production build, build first and add `-- --production` to that command.
Use the normal development command and a persistent KLX database for lasting changes.

## Initial owner account and recovery

Set a KLX database connection and run:

```sh
npm run seed --workspace=@repo/klx-luxe-plus
npm run provision:owner --workspace=@repo/klx-luxe-plus
```

The provisioning command prints a private setup link valid for 24 hours. Open it
and set a password of at least 12 characters. Setup links are hashed in the database
and consumed once. There is no public administrator signup.

For operator-assisted password recovery:

```sh
npm run provision:owner --workspace=@repo/klx-luxe-plus -- --recovery
```

Recovery replaces the owner's password and revokes prior sessions. Keep setup and
recovery links private. Production builds also package these commands as
`.next/ops/seed.cjs` and `.next/ops/provision-owner.cjs` for a Node container.
The draft Dockerfile copies them to `/app/ops`.

## Content, services, and appointments

- Page content and PoolPay edits save as private drafts. Preview, then publish.
  Restoring a version restores content into a draft; it never changes payments.
- Service prices, visibility, ordering, and business settings take effect when saved.
  Prices are entered in dollars. Existing payment requests keep their original amounts.
- Services support quote, fixed-price, or deposit pricing. Initial services use quotes.
- Appointment requests require business confirmation. The calendar and list support
  review, confirmation, rescheduling, cancellation, declining, and completion.
- The business timezone defaults to `America/New_York`. Change it in settings if
  the client means another US timezone. Dates are displayed with their timezone.
- Settings include available weekdays, blocked dates, and optional opening/closing
  times. Initially no business hours are claimed; requested times await review.
- Published policy text is managed in Page content. Policies start unpublished
  until the owner supplies and reviews them. Business settings also retain legacy
  policy fields for compatibility; Page content is the publication source.
- Media uploads accept JPEG, PNG, and WebP up to 5 MB. Uploaded artwork is served
  through public image URLs; do not upload confidential documents.
- The dashboard currently loads the most recent 200 business records per category.
  Use this initial release for the intended low-volume service workflow; add pagination
  before the record limit is reached.

## Payment requests and refunds

Create a payment request in Payments & refunds with the customer email, service,
description, total amount, optional deposit, optional appointment ID, and expiry.
The customer receives a private payment page link when email delivery is enabled.
The same page can collect the remaining balance after a deposit.

The server creates Stripe Checkout using its stored amounts. Verified Stripe state
updates payment status; a browser redirect is not treated as proof of payment.
Changing a service's price does not rewrite existing requests.

The owner can issue a full or partial refund from a transaction. Review the amount
and reason before confirming. Refunds use the original payment method. The interface
tracks pending, succeeded, failed, and cancelled states and the remaining refundable
balance. Cancelling an appointment does not automatically issue a refund.

Use **Sync Stripe status** to reconcile Dashboard changes or delayed provider events.
An uncertain refund retains its operation ID and reservation. Retry that operation
instead of creating a separate refund. Stripe settlement may take time.

No real charges or refunds were issued as implementation checks.

## Stripe configuration

Reuse the existing root `.env` test/live Stripe secret-key variables. Add dedicated
KLX webhook secrets; the existing PoolPay endpoint secrets are not interchangeable.

1. Confirm the supplied account is the account that should receive KLX service payments.
   This implementation uses direct merchant payments, not Stripe Connect transfers.
2. Keep `KLX_STRIPE_MODE=test` during review.
3. Create an account webhook/event destination pointing to:
   `https://klxluxeplus.poolpay.space/api/stripe/webhook`.
4. Subscribe to:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
   - `refund.created`
   - `refund.updated`
   - `refund.failed`
   - `charge.refunded`
5. Save the test destination signing secret as `KLX_STRIPE_TEST_WEBHOOK_SECRET`.
   For local testing, use Stripe CLI to forward events to the local app's
   `/api/stripe/webhook` and use the CLI listener's signing secret.
6. Configure accurate branding, support email/phone, statement descriptor, and receipts.
   Choose whether Stripe or KLX sends refund notices to avoid duplicate emails.
7. After an approved release, configure a separate live destination and set
   `KLX_STRIPE_LIVE_WEBHOOK_SECRET`. Set `KLX_STRIPE_MODE=live` only when ready
   to accept real payments.

The publishable key is not needed for the hosted redirect flow. No account-wide
Stripe settings were changed during implementation.

References: [Stripe webhooks](https://docs.stripe.com/webhooks),
[Checkout confirmation](https://docs.stripe.com/checkout/fulfillment),
[refund behavior](https://docs.stripe.com/refunds).

## Email queue and scheduled processing

Configure a verified Resend sender or authenticated SMTP using the root environment.
The intended From and Reply-To are `support@poolpay.space`; the provider must authorize
that sender. KLX's sender override is `KLX_EMAIL_FROM`.

Requests and quotes persist notification intents alongside their records. The outbox
processor repairs missed queue insertion and retries failed sends. From Overview,
**Process pending emails** processes a batch. Automated processing requires a scheduled
POST to `/api/jobs` with `Authorization: Bearer <KLX_JOB_SECRET>`.
Generate a long random job secret; keep it server-side.

The provided cron draft uses the KLX container's environment instead of putting a
secret into a cron command. Its production installation remains part of the
deployment work requiring approval. Messages stop automatic retry after five failures;
the admin queue shows failures for operator investigation.

## Production activation work remaining

Before an approved deployment:

1. Complete and verify the dedicated image build/deploy workflow. The former static
   `out/` upload cannot deploy this application.
2. Configure the production KLX database URL with a hostname reachable from its
   container, rather than the developer computer's localhost.
3. Persist the media directory across releases using a volume/object storage.
4. Validate the Node container, health endpoint, reverse proxy, HTTPS, canonical
   redirects, notification schedule, and rollback behavior.
5. Inject runtime secrets; initialize indexes/services; provision the owner.
6. Confirm actual prices, timezone, availability, approved policies, and advertisement
   content. Run a complete Stripe sandbox payment/refund and sender-delivery check.
7. Obtain the user's push/deployment confirmation and then release.

The application build and local integration tests do not verify Docker, the live
server, public webhook delivery, customer emails, or live payment settlement.

## Verification commands

```sh
npm run typecheck:klx
npm run lint --workspace=@repo/klx-luxe-plus
npm run test:workflows --workspace=@repo/klx-luxe-plus
npm run test:seo --workspace=@repo/klx-luxe-plus
npm run build:klx
```

Workflow tests use temporary MongoDB databases. They exercise owner setup, draft
publication, concurrent appointments, daylight-saving validation, hidden services,
payment idempotency, deposit balances, environment/amount checks, and refund reservations.
