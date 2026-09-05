# 🖥️ Backend Developer Guide: In-App Purchases & Subscriptions
**PoolPay API (`apps/api`) — Express.js, TypeScript & MongoDB**
*Server-Authoritative Validation for Apple StoreKit 2 & Google Play Billing (AndroidPublisher v3)*

---

## 📑 Table of Contents
1. [Architecture & Server-Authoritative Verification](#1-architecture--server-authoritative-verification)
2. [Configured SKUs, Identifiers & Database Model](#2-configured-skus-identifiers--database-model)
3. [File Structure & Key Modules](#3-file-structure--key-modules)
4. [Environment Variables (`.env`) Configuration](#4-environment-variables-env-configuration)
5. [Credentials Acquisition & Base64 Conversion](#5-credentials-acquisition--base64-conversion)
   - 5.1 [Apple StoreKit 2 Private Key (`.p8`) & Identifiers](#51-apple-storekit-2-private-key-p8--identifiers)
   - 5.2 [Google Play Cloud Service Account (`.json`)](#52-google-play-cloud-service-account-json)
   - 5.3 [PowerShell & Bash Base64 Conversion Commands](#53-powershell--bash-base64-conversion-commands)
6. [Core Implementation Breakdown](#6-core-implementation-breakdown)
   - 6.1 [IAP Configuration Module (`iap.config.ts`)](#61-iap-configuration-module-iapconfigts)
   - 6.2 [Google Play Billing Service (`purchases.subscriptions.get`)](#62-google-play-billing-service)
   - 6.3 [Apple StoreKit 2 Service (`App Store Server API` + JWT ES256)](#63-apple-storekit-2-service)
   - 6.4 [Database Updates, Transactions & Notifications](#64-database-updates-transactions--notifications)
7. [API Endpoints Specification](#7-api-endpoints-specification)
   - 7.1 [`POST /api/v1/mobile-membership/verify-google`](#71-post-apiv1mobile-membershipverify-google)
   - 7.2 [`POST /api/v1/mobile-membership/verify-apple`](#72-post-apiv1mobile-membershipverify-apple)
   - 7.3 [`POST /api/v1/mobile-membership/sync`](#73-post-apiv1mobile-membershipsync)
   - 7.4 [`GET /api/v1/mobile-membership/status`](#74-get-apiv1mobile-membershipstatus)
8. [Mock Mode for Local Development](#8-mock-mode-for-local-development)
9. [Production Deployment & Troubleshooting](#9-production-deployment--troubleshooting)

---

## 1. Architecture & Server-Authoritative Verification

In mobile apps, the client device cannot be trusted to set subscription state directly. Users can tamper with local storage or jailbreak devices. Therefore, PoolPay uses a **server-authoritative** validation pattern:

```
┌─────────────────────────────────┐
│     Flutter Mobile Client       │
│  (Google Play / Apple StoreKit) │
└────────────────┬────────────────┘
                 │
                 │ 1. Sends Purchase Token / Receipt Data
                 ▼
┌─────────────────────────────────────────────────────────┐
│              PoolPay Backend (Express API)              │
│                                                         │
│  1. Authenticates user via JWT Access Token             │
│  2. Validates payload using Zod schemas                 │
│  3. Connects securely to Google Play / Apple Server API │
│  4. Validates expiration date, product ID & auto-renew  │
│  5. Atomically updates MongoDB User inside transaction  │
│  6. Creates AuditLog & triggers push notifications      │
│  7. Returns 200 OK with upgraded membership tier        │
└──────────────┬──────────────────────────┬───────────────┘
               │                          │
   2. Verify   ▼                          ▼ 2. Verify
┌───────────────────────────┐    ┌───────────────────────────────┐
│   Google Play Developer   │    │    Apple App Store Server     │
│   API (AndroidPublisher)  │    │     API (StoreKit 2 / JWT)    │
└───────────────────────────┘    └───────────────────────────────┘
```

---

## 2. Configured SKUs, Identifiers & Database Model

### Identifiers Matrix
| Identifier | Platform | Exact Value | Purpose |
|---|---|---|---|
| **Android Package Name** | Google | `com.poolpay.rosca` | Identifies the Android application |
| **iOS Bundle Identifier** | Apple | `com.poolpay.app` | Identifies the iOS application |
| **Regular Membership SKU** | Both | `regular_yearly_subscription` | Maps to `MembershipTier.REGULAR` |
| **VIP Membership SKU** | Both | `vip_yearly_subscription` | Maps to `MembershipTier.VIP` |

### MongoDB User Model Schema
File: `apps/api/src/app/modules/user/user.interface.ts` & `user.model.ts`
When an in-app subscription is verified, the following fields on the `User` document are updated:

```typescript
export enum MembershipTier {
  GUEST = "guest",
  REGULAR = "regular",
  VIP = "vip",
}

export enum SubscriptionStatus {
  INACTIVE = "inactive",
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  GRACE_PERIOD = "grace_period",
}

export enum MembershipProvider {
  STRIPE = "stripe",
  GOOGLE_PLAY = "google_play",
  APPLE_STORE = "apple_store",
  MANUAL = "manual",
}

// User document fields updated on verification:
membershipTier: MembershipTier;          // "regular" | "vip"
subscriptionStatus: SubscriptionStatus;  // "active"
subscriptionExpiry: Date;                // Calculated expiry from Apple/Google
membershipProvider: MembershipProvider;  // "google_play" | "apple_store"
platformSubscriptionId: string;          // Google OrderId / Apple TransactionId
purchaseToken: string;                   // Store purchase token (for re-checks)
autoRenewEnabled: boolean;               // true if active recurring subscription
membershipStartedAt: Date;
lastBillingDate: Date;
```

---

## 3. File Structure & Key Modules

All IAP logic is encapsulated in `apps/api`:

```
apps/api/src/app/
├── config/
│   ├── env.ts                          # Validates and exposes IAP env variables
│   └── iap.config.ts                   # Google client & Apple ES256 JWT generator
├── modules/
│   └── mobileMembership/
│       ├── mobileMembership.controller.ts  # Express HTTP route controllers
│       ├── mobileMembership.interface.ts   # TypeScript interfaces for receipts/tokens
│       ├── mobileMembership.route.ts       # Express router with auth & validation
│       ├── mobileMembership.service.ts     # StoreKit 2 & AndroidPublisher verification logic
│       ├── mobileMembership.swagger.ts     # OpenAPI documentation specs
│       └── mobileMembership.validation.ts  # Zod schemas for verify requests
```

---

## 4. Environment Variables (`.env`) Configuration

Add the following block to your root `.env` (or server environment):

```env
# ==============================================================================
# MOBILE IN-APP PURCHASES & SUBSCRIPTIONS (Backend Configuration)
# ==============================================================================

# ----------------- Android (Google Play Billing) -----------------
GOOGLE_PLAY_PACKAGE_NAME=com.poolpay.rosca
GOOGLE_PLAY_REGULAR_PRODUCT_ID=regular_yearly_subscription
GOOGLE_PLAY_VIP_PRODUCT_ID=vip_yearly_subscription

# Base64-encoded Google Cloud IAM Service Account JSON (Recommended for Docker / CI/CD):
GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIs...

# Optional fallback: Local file path on disk:
GOOGLE_PLAY_SERVICE_ACCOUNT_PATH=./poolpay-service-account.json

# ----------------- iOS (Apple StoreKit 2 & Server API) -----------------
APPLE_BUNDLE_ID=com.poolpay.app
APPLE_KEY_ID=Q2XGP426C3
APPLE_ISSUER_ID=your_apple_issuer_uuid_here
APPLE_TEAM_ID=your_apple_team_id_here
APPLE_REGULAR_PRODUCT_ID=regular_yearly_subscription
APPLE_VIP_PRODUCT_ID=vip_yearly_subscription

# Base64-encoded Apple .p8 Private Key (Recommended for Docker / CI/CD):
APPLE_PRIVATE_KEY_BASE64=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS...

# Optional fallback: Local file path on disk:
APPLE_PRIVATE_KEY_PATH=./SubscriptionKey_Q2XGP426C3.p8

# Optional: Shared secret for legacy receipt validation fallback:
APPLE_SHARED_SECRET=your_32_char_app_specific_shared_secret_here
```

> [!TIP]
> Using the `*_BASE64` variables means your Docker container or EC2 instance does not require copying sensitive private key files into the image or filesystem. The backend parses them directly from memory at startup!

---

## 5. Credentials Acquisition & Base64 Conversion

### 5.1 Apple StoreKit 2 Private Key (`.p8`) & Identifiers
1. Go to [App Store Connect](https://appstoreconnect.apple.com/) ➔ **Users and Access**.
2. Select **Integrations** (or **Keys**) ➔ **In-App Purchase**.
3. Click **+** (Generate In-App Purchase Key). Name it (e.g. `PoolPay IAP Server Key`).
4. Note the **Key ID** (10 characters, e.g. `Q2XGP426C3`).
5. Copy the **Issuer ID** (UUID at the top of the page).
6. Click **Download API Key** to save `SubscriptionKey_Q2XGP426C3.p8`. *(Apple only allows downloading once!)*

### 5.2 Google Play Cloud Service Account (`.json`)
1. Go to [Google Cloud Console](https://console.cloud.google.com/) for the project linked with your Play Console.
2. Enable the **Google Play Android Developer API**.
3. Navigate to **IAM & Admin ➔ Service Accounts** ➔ **Create Service Account** (`poolpay-iap-service`).
4. Click into the created service account ➔ **Keys** tab ➔ **Add Key ➔ Create new key (JSON)**.
5. Download the JSON key file.
6. In [Google Play Console](https://play.google.com/console) ➔ **Settings ➔ API access**:
   - Find the service account and click **Manage Play Console permissions**.
   - Under **App permissions**, select `com.poolpay.rosca`.
   - Under **Financial permissions**, grant:
     - *View financial data, orders, and cancellation survey responses*
     - *Manage orders and subscriptions*
   - Click **Save changes**.

### 5.3 PowerShell & Bash Base64 Conversion Commands

#### On Windows (PowerShell):
```powershell
# Convert Apple .p8 key to single-line Base64 & copy to clipboard:
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("apps\api\SubscriptionKey_Q2XGP426C3.p8")) | Set-Clipboard

# Convert Google Service Account JSON to single-line Base64 & copy to clipboard:
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("derival81\poolpay-e80df-0bfcd3a3ff84.json")) | Set-Clipboard
```

#### On macOS / Linux (Bash):
```bash
# Convert Apple .p8 key:
base64 -w 0 SubscriptionKey_Q2XGP426C3.p8
# macOS (BSD base64):
base64 -i SubscriptionKey_Q2XGP426C3.p8 | tr -d '\n' | pbcopy

# Convert Google Service Account JSON:
base64 -w 0 google-service-account.json
# macOS (BSD base64):
base64 -i google-service-account.json | tr -d '\n' | pbcopy
```

---

## 6. Core Implementation Breakdown

### 6.1 IAP Configuration Module (`iap.config.ts`)
File: [`apps/api/src/app/config/iap.config.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/api/src/app/config/iap.config.ts)

1. **Google Auth**: Uses `google.auth.GoogleAuth`:
   ```typescript
   if (serviceAccountBase64) {
     const jsonStr = Buffer.from(serviceAccountBase64, "base64").toString("utf8");
     const credentials = JSON.parse(jsonStr);
     auth = new google.auth.GoogleAuth({
       credentials,
       scopes: ["https://www.googleapis.com/auth/androidpublisher"],
     });
   }
   const androidPublisher = google.androidpublisher({ version: "v3", auth });
   ```
2. **Apple StoreKit 2 ES256 JWT Token**:
   Signs an ES256 token valid for 1 hour:
   ```typescript
   jwt.sign(
     {
       iss: issuerId,
       iat: Math.floor(Date.now() / 1000),
       exp: Math.floor(Date.now() / 1000) + 3600,
       aud: "appstoreconnect-v1",
       bid: bundleId,
     },
     privateKey,
     {
       algorithm: "ES256",
       header: { alg: "ES256", kid: keyId, typ: "JWT" }
     }
   );
   ```

### 6.2 Google Play Billing Service
File: [`apps/api/src/app/modules/mobileMembership/mobileMembership.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/api/src/app/modules/mobileMembership/mobileMembership.service.ts#L45-L100)

Calls `androidpublisher.purchases.subscriptions.get`:
```typescript
const response = await client.purchases.subscriptions.get({
  packageName: "com.poolpay.rosca",
  subscriptionId: productId,
  token,
});

const data = response.data;
// data.expiryTimeMillis is string milliseconds timestamp
const expiryDate = new Date(parseInt(data.expiryTimeMillis));
const autoRenewing = data.autoRenewing ?? true;
const orderId = data.orderId || token;
```

### 6.3 Apple StoreKit 2 Service
File: [`apps/api/src/app/modules/mobileMembership/mobileMembership.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/api/src/app/modules/mobileMembership/mobileMembership.service.ts#L247-L325)

Queries Apple's modern StoreKit 2 endpoint using the signed bearer token:
```typescript
const url = `${baseUrl}/inApps/v1/subscriptions/${transactionId}`;
const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```
- If production returns 404, the service automatically retries against the Apple Sandbox API (`https://api.storekit-sandbox.itunes.apple.com`).
- Decodes the JWS payload `signedTransactionInfo`:
  ```typescript
  const parts = jws.split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
  // payload.expiresDate is unix epoch milliseconds
  ```

### 6.4 Database Updates, Transactions & Notifications
All state changes occur inside a MongoDB transaction (`withTransaction`):
1. Verifies `expiryDate.getTime() > Date.now()`.
2. Updates `user.membershipTier`, `user.subscriptionStatus = ACTIVE`, `user.subscriptionExpiry`.
3. Creates `AuditLog` entry.
4. Calls `emitRealTimeNotification(userId, ...)` for instant UI refresh via Socket.io.
5. Enqueues push notification via FCM and email confirmation.

---

## 7. API Endpoints Specification

### 7.1 `POST /api/v1/mobile-membership/verify-google`
Verifies an Android subscription token.
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Validation Schema**:
  ```typescript
  z.object({
    body: z.object({
      token: z.string().min(1, "Google purchase token is required"),
      productId: z.string().min(1, "Product ID is required"),
    }),
  });
  ```
- **Request Body**:
  ```json
  {
    "productId": "vip_yearly_subscription",
    "token": "eocpdlhjhgkd..."
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Google Play Store purchase verified and membership activated successfully.",
    "data": {
      "user": {
        "membershipTier": "vip",
        "subscriptionStatus": "active",
        "subscriptionExpiry": "2027-09-05T09:30:00.000Z",
        "membershipProvider": "google_play",
        "autoRenewEnabled": true
      }
    }
  }
  ```

### 7.2 `POST /api/v1/mobile-membership/verify-apple`
Verifies an iOS StoreKit 2 transaction or legacy receipt.
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Validation Schema**:
  ```typescript
  z.object({
    body: z.object({
      transactionId: z.string().optional(),
      receiptData: z.string().optional(),
      productId: z.string().optional(),
    }).refine((data) => data.transactionId || data.receiptData, {
      message: "Either transactionId or receiptData is required",
    }),
  });
  ```
- **Request Body (StoreKit 2)**:
  ```json
  {
    "productId": "regular_yearly_subscription",
    "transactionId": "2000000123456789"
  }
  ```
- **Response (200 OK)**: Identical to Google Play response with `"membershipProvider": "apple_store"`.

### 7.3 `POST /api/v1/mobile-membership/sync`
Forces a server-side re-check of the active user's subscription against Google/Apple servers.
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Response (200 OK)**: Returns the verified subscription state.

### 7.4 `GET /api/v1/mobile-membership/status`
Retrieves the logged-in user's current membership tier and status.
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Membership status retrieved successfully",
    "data": {
      "membershipTier": "regular",
      "subscriptionStatus": "active",
      "subscriptionExpiry": "2027-09-05T09:30:00.000Z",
      "membershipProvider": "google_play",
      "autoRenewEnabled": true
    }
  }
  ```

---

## 8. Mock Mode for Local Development

When working locally without Google Cloud / Apple API keys, you can test the entire membership flow seamlessly:
- Set `NODE_ENV=development` in your local `.env`.
- If `iapConfig.googleClient` or Apple credentials are null, `mobileMembership.service.ts` activates **Mock Mode**:
  ```typescript
  if (process.env.NODE_ENV === "development") {
    logger.info(`[IAP-GOOGLE] Running in MOCK Mode for user ${userId}. Approving mock purchase.`);
    expiryTimeMillis = String(Date.now() + 365 * 24 * 60 * 60 * 1000);
    autoRenewing = true;
  }
  ```
- Any valid test token sent from the Flutter app will be accepted and grant 1 year of membership for testing.

---

## 9. Production Deployment & Troubleshooting

### Common Verification Errors & Solutions

| Error Message / Status | Cause | Solution |
|---|---|---|
| **Google API 401 / 403: "Project not linked"** | GCP project is not linked to Play Console | In Play Console ➔ Settings ➔ API access, grant permissions to the service account. |
| **Apple Error `21007`** | Sandbox receipt posted to Production URL | The backend automatically catches this and retries sandbox URL. |
| **Invalid product ID: xyz** | Flutter sent a product ID not configured | Ensure product IDs are strictly `regular_yearly_subscription` or `vip_yearly_subscription`. |
| **Subscription expired on [Date]** | User passed an old receipt/token | Backend compares `expiryDate < Date.now()` and returns HTTP 400. |
| **JWT verification failed on Apple** | Invalid Issuer ID or Key ID | Verify `APPLE_KEY_ID` matches your `.p8` key and `APPLE_ISSUER_ID` is the UUID from App Store Connect. |
