# Stripe Live Credentials & Production Setup Guide
**PoolPay / Derival81 — Production Payment Gateway & Stripe Connect Configuration**

This document provides a comprehensive, step-by-step guide to setting up and configuring your live Stripe account, retrieving production API keys, creating production webhook endpoints, and activating live payments across the backend and mobile app.

---

## 1. Quick Summary of Required Credentials

When switching to Production, you need **4 live credentials** from your Stripe Dashboard:

| # | Credential Name | Format / Prefix | Description | Where It Goes |
|---|---|---|---|---|
| **1** | **Live Secret Key** | `sk_live_...` | Backend server key for charging cards & initiating transfers | Root `.env` (`STRIPE_LIVE_SECRET_KEY`) |
| **2** | **Live Publishable Key** | `pk_live_...` | Client key for tokenizing cards in the app & web | Root `.env` & Flutter `app_credentials.dart` |
| **3** | **Live Webhook Secret** | `whsec_...` | Signs incoming direct payment events (PaymentIntents, charges) | Root `.env` (`STRIPE_LIVE_WEBHOOK_SECRET`) |
| **4** | **Live Connect Webhook Secret** | `whsec_...` | Signs incoming Stripe Connect events (Transfers, Payouts) | Root `.env` (`STRIPE_LIVE_CONNECT_WEBHOOK_SECRET`) |

---

## 2. Step-by-Step Setup Instructions

### Step 1: Activate Your Stripe Account
1. Log in to the [Stripe Dashboard](https://dashboard.stripe.com/).
2. If your account is in Test mode, click **Activate account** in the top navigation or sidebar.
3. Complete the business verification steps:
   - Legal business details (or Individual / Sole Proprietorship)
   - Business bank account details (where Stripe deposits your earnings)
   - Identity verification (KYC)
4. Once verified, flip the top toggle from **Test mode** to **Live mode** (the orange test banner will disappear).

---

### Step 2: Retrieve Live API Keys (Secret & Publishable)

1. In the Stripe Dashboard (in **Live mode**), navigate to:
   👉 **Developers** (top right) ➔ **API keys** (or [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)).
2. **Publishable Key**:
   - You will see a key starting with `pk_live_...`.
   - Copy this key.
3. **Secret Key**:
   - Under **Standard keys**, look for **Secret key**.
   - Click **Reveal live key** (you may be prompted for two-factor authentication or password).
   - Copy the key starting with `sk_live_...`.
   > [!CAUTION]
   > The Secret Key grants full administrative access to charge cards and move money. Never share it, publish it, or commit it to Git repositories.

---

### Step 3: Configure Live Webhooks (Direct & Connect)

PoolPay uses **two webhook listeners** to keep contributions, group pots, transfers, and audit logs synchronized:
- **Account Webhook**: Handles direct card charges, 3DS authentication, and payment intents.
- **Connect Webhook**: Handles group creator and pool winner transfers, bank account verification, and payouts.

Both webhooks point to your server's endpoint:
```text
https://api.poolpay.space/api/v1/webhook/stripe
```

#### A. Create the Main Account Webhook
1. In Stripe Dashboard (Live mode), go to **Developers ➔ Webhooks**.
2. Make sure you are on the **Hosted endpoints** tab.
3. Click **+ Add endpoint**:
   - **Endpoint URL**: `https://api.poolpay.space/api/v1/webhook/stripe`
   - **Description**: `PoolPay Production Payments`
   - **Listen to**: Select **Events on your account**
4. Click **+ Select events** and check the following:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `payment_intent.canceled`
   - ✅ `charge.refunded`
   - ✅ `customer.created`
   - ✅ `customer.updated`
5. Click **Add endpoint**.
6. On the webhook details page, under **Signing secret**, click **Reveal**.
7. Copy the secret starting with `whsec_...`.
   ➔ This is your **`STRIPE_LIVE_WEBHOOK_SECRET`**.

#### B. Create the Stripe Connect Webhook
1. In the same **Developers ➔ Webhooks** page, click **+ Add endpoint** again:
   - **Endpoint URL**: `https://api.poolpay.space/api/v1/webhook/stripe`
   - **Description**: `PoolPay Production Connect Payouts`
   - **Listen to**: Select **Events on Connected accounts** (radio button)
2. Click **+ Select events** and check the following:
   - ✅ `account.updated`
   - ✅ `account.application.deauthorized`
   - ✅ `transfer.created`
   - ✅ `transfer.reversed`
   - ✅ `payout.paid`
   - ✅ `payout.failed`
3. Click **Add endpoint**.
4. Click **Reveal** under Signing secret.
5. Copy the secret starting with `whsec_...`.
   ➔ This is your **`STRIPE_LIVE_CONNECT_WEBHOOK_SECRET`**.

---

### Step 4: Configure Stripe Connect (For Group Payouts)

PoolPay uses **Stripe Connect** so that group creators and pool winners can link their bank accounts or debit cards and receive pot payouts automatically:

1. In Stripe Dashboard, click **Connect** in the left sidebar (or navigate to [dashboard.stripe.com/connect](https://dashboard.stripe.com/connect)).
2. Click **Settings** (gear icon) ➔ **Connect Settings**.
3. Under **Branding**:
   - Upload the PoolPay logo (`assets/images/Apps-Logo.png`)
   - Set Business Name to `PoolPay`
   - Brand color: `#1A227F`
4. Under **Onboarding**:
   - Ensure **Express** or **Custom** onboarding is enabled.
5. Under **Payouts**:
   - Verify that automated or manual transfers to connected accounts are enabled.

---

### Step 5: Configure Apple Pay & Google Pay (Optional)

If offering 1-click Apple Pay / Google Pay in the mobile app:

1. In Stripe Dashboard, go to **Settings ➔ Payment methods**.
2. Find **Apple Pay** and click **Configure**.
3. Under **iOS certificates**, click **Add new application**.
4. Enter your Merchant ID: `merchant.space.poolpay`.
5. Follow Stripe's prompt to generate and upload the Apple Pay Payment Processing Certificate from Apple Developer portal.

---

## 3. Where to Add Credentials in the Project

### A. In Root `.env` (Backend API & Admin Web)
Open `c:\Users\Adnan\ZProject\adnan\derival81\.env` and replace lines 103–106:

```env
# ========================================
# Stripe Configuration (PRODUCTION / Live)
# ========================================
STRIPE_LIVE_SECRET_KEY=sk_live_YOUR_ACTUAL_LIVE_SECRET_KEY
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_LIVE_PUBLISHABLE_KEY
STRIPE_LIVE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_LIVE_WEBHOOK_SECRET
STRIPE_LIVE_CONNECT_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_LIVE_CONNECT_WEBHOOK_SECRET
```

### B. In Flutter Mobile App
Open `derival81/lib/config/app_credentials.dart` and add your live publishable key:

```dart
  /// === PRODUCTION / LIVE keys ===
  static const String stripePublishableKeyLive =
      'pk_live_YOUR_ACTUAL_LIVE_PUBLISHABLE_KEY';
```

*(Note: In PoolPay, the mobile app also dynamically fetches the active publishable key from `GET /api/v1/settings/config` on launch, so even if you leave the Dart constant empty, the server automatically serves the correct key).*

---

## 4. How to Switch to Live Mode in PoolPay

PoolPay is designed with a **1-click Environment Switcher**:

1. Log into the **Admin Web Dashboard** at `https://poolpay.space/dashboard` (or your local admin URL).
2. Go to **Settings** (`/dashboard/settings`).
3. Scroll to the **Environment Mode** section at the top:
   - Current mode will show **⚠️ Test Mode (Sandbox)**.
4. Click **Switch to Production**.
5. A confirmation dialog will warn you that this switches to:
   - The production database (`poolPay-db-live`)
   - The live Stripe keys (`sk_live_...` / `pk_live_...`)
6. Click **Confirm & Switch to Production**.

### What Happens Instantly:
- **Backend API**: Automatically swaps Mongoose connection to `poolPay-db-live`, and uses `STRIPE_LIVE_*` credentials for all new payments and webhooks.
- **Admin Panel**: The top navbar updates to a green **🟢 LIVE** badge.
- **Flutter App**: On next launch (or pull-to-refresh), the app detects production mode, removes the amber `⚠️ SANDBOX` banner from the home screen, hides demo join codes, and initiates payments through live Stripe.

---

## 5. Pre-Flight Production Checklist

Before accepting real money, verify:

- [ ] All 4 `STRIPE_LIVE_*` variables in `.env` are filled and do not contain `REPLACE_WHEN_READY`.
- [ ] Both Webhook endpoints in Stripe Dashboard show HTTP `200 OK` on test events.
- [ ] You have run a test $1 transaction in live mode using a real credit card.
- [ ] The transaction shows up in both Stripe Dashboard (Live) and PoolPay Admin Dashboard under **Payments**.
- [ ] You performed a small refund test from the Stripe Dashboard to verify the refund webhook.
