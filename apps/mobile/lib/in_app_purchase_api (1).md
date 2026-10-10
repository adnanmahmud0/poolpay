# PoolPay Mobile In-App Purchase API Documentation

This document describes the in-app purchase (IAP) integration for the PoolPay mobile application. The APIs enable mobile apps on Android and iOS to verify purchases made natively through the Google Play Store and Apple App Store, and sync the user's membership tier to the backend.

## 1. Overview

The Mobile Membership API endpoints allow the mobile app to send purchase receipts/tokens to the server. The server then contacts the respective app store backend (Google or Apple) to validate the purchase. If valid, the user's membership tier is upgraded or renewed.

## 2. API Endpoints

All endpoints are protected and require a Bearer token (`checkAuth(Role.USER)`).
Base URL prefix: `/api/v1/mobile-membership`

### 2.1 Verify Google Play Purchase

- **Endpoint**: `POST /verify-google`
- **Description**: Verifies a purchase token against the Google Play Store API.
- **Request Body**:
  ```json
  {
    "token": "string (Required) - The purchase token from Google Play billing",
    "productId": "string (Required) - The product ID purchased"
  }
  ```
- **Process**:
  1. The server receives the `token` and `productId`.
  2. It maps the `productId` to a local `MembershipTier` (e.g., `REGULAR`, `VIP`).
  3. It calls the Google Play Developer API (`googleapis`) to fetch the subscription details.
  4. If valid, the user's `subscriptionExpiry` is updated based on the timestamp returned by Google, and the `membershipTier` is set.
  5. Clears any legacy Stripe subscription values to prevent conflicts.

### 2.2 Verify Apple App Store Purchase

- **Endpoint**: `POST /verify-apple`
- **Description**: Verifies an App Store receipt against Apple's receipt validation servers.
- **Request Body**:
  ```json
  {
    "receiptData": "string (Required) - Base64 encoded receipt data from StoreKit"
  }
  ```
- **Process**:
  1. The server receives the `receiptData`.
  2. It forwards the receipt to Apple's validation endpoint (sandbox or production based on the environment).
  3. Apple returns the latest receipt info, which contains the `product_id` and `expires_date_ms`.
  4. The server maps the `product_id` to a `MembershipTier`, updates the user's `subscriptionExpiry`, and sets the provider to `APPLE_APP_STORE`.

### 2.3 Sync Subscription Status

- **Endpoint**: `POST /sync`
- **Description**: Re-validates the user's active mobile subscription directly with Google or Apple.
- **Request Body**: _None_
- **Process**:
  1. Retrieves the user's stored `purchaseToken` or receipt, and their `membershipProvider`.
  2. Queries Google or Apple again to get the latest status.
  3. If the subscription has expired or was canceled, it downgrades the user to `FREE`.
  4. If auto-renew was disabled, it updates the `autoRenewEnabled` flag in the database.

### 2.4 Get Membership Status

- **Endpoint**: `GET /status`
- **Description**: Retrieves the user's current membership status, tier, and provider.
- **Request Body**: _None_
- **Response Data**:
  ```json
  {
    "membershipTier": "FREE | REGULAR | VIP",
    "subscriptionStatus": "ACTIVE | CANCELLED | EXPIRED",
    "subscriptionExpiry": "2026-08-10T12:00:00.000Z",
    "membershipProvider": "GOOGLE_PLAY | APPLE_APP_STORE | STRIPE",
    "autoRenewEnabled": true,
    "platformSubscriptionId": "string"
  }
  ```

## 3. How It Works (The Verification Flow)

The integration relies on a **Server-Side Verification Model** which is highly recommended by Apple and Google to prevent fraud.

1. **In-App Purchase (Client Side)**:
   - The user opens the app and selects a membership tier (Regular or VIP).
   - The mobile app triggers the native billing SDK (Google Play Billing Library or Apple StoreKit).
   - The user confirms the payment via fingerprint, FaceID, or password.
   - The native SDK returns a success response containing a `token` (Android) or `receiptData` (iOS).

2. **Validation (Server Side)**:
   - The mobile app immediately sends this token/receipt to the PoolPay backend via `POST /verify-google` or `POST /verify-apple`.
   - The PoolPay Node.js backend acts as a secure middleman. It takes the token and sends it to Google's or Apple's servers using private developer credentials configured on the server.

3. **Database Update & Notifications**:
   - Google/Apple responds to the backend with the true status of the token (preventing spoofing).
   - If the receipt is valid and not expired, the backend assigns the `MembershipTier` to the user in MongoDB.
   - The backend records the action in the `AuditLog`.
   - The backend fires off realtime push notifications and an email notifying the user of their successful upgrade.
   - The backend returns a success response to the mobile app, which then updates the UI.

4. **Background Synchronization**:
   - The user can trigger `POST /sync` manually (e.g. "Restore Purchases" button in the app) to force the backend to fetch the latest expiry dates directly from the store.
   - This ensures that if a user cancels their subscription in their iPhone settings, the backend will catch it upon sync and downgrade them appropriately.
