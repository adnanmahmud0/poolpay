# 📱 Complete In-App Purchase (IAP) & Subscription Architecture Guide
**PoolPay Mobile (`derival81`) & Backend API (`apps/api`)**
*Apple App Store (StoreKit 2) & Google Play Billing (AndroidPublisher v3)*

---

## 📑 Table of Contents
1. [Executive Summary & Core Architecture](#1-executive-summary--core-architecture)
2. [Configured Identifiers & Products](#2-configured-identifiers--products)
3. [Backend Architecture & Code Implementation](#3-backend-architecture--code-implementation)
   - 3.1 [IAP Configuration Module (`iap.config.ts`)](#31-iap-configuration-module-iapconfigts)
   - 3.2 [Google Play Billing Verification (`purchases.subscriptions.get`)](#32-google-play-billing-verification)
   - 3.3 [Apple StoreKit 2 Verification (`App Store Server API` + JWT ES256)](#33-apple-storekit-2-verification)
   - 3.4 [Database Updates & Audit Logging](#34-database-updates--audit-logging)
   - 3.5 [API Endpoints & Request/Response Contracts](#35-api-endpoints--requestresponse-contracts)
4. [Frontend Architecture & Code Implementation (Flutter)](#4-frontend-architecture--code-implementation-flutter)
   - 4.1 [Dependencies & Platform Permissions](#41-dependencies--platform-permissions)
   - 4.2 [App Configuration & Centralized Identifiers](#42-app-configuration--centralized-identifiers)
   - 4.3 [Subscription Controller (`subscription_controller.dart`)](#43-subscription-controller-subscription_controllerdart)
   - 4.4 [Handling the Purchase Lifecycle & The Crucial Acknowledgment Step](#44-handling-the-purchase-lifecycle--the-crucial-acknowledgment-step)
   - 4.5 [Restoring Purchases](#45-restoring-purchases)
   - 4.6 [UI Subscription Paywall Screen](#46-ui-subscription-paywall-screen)
5. [Apple App Store Connect Setup Instructions](#5-apple-app-store-connect-setup-instructions)
   - 5.1 [Agreements, Tax, and Banking](#51-agreements-tax-and-banking)
   - 5.2 [Register App & Bundle ID](#52-register-app--bundle-id)
   - 5.3 [Creating Auto-Renewable Subscriptions](#53-creating-auto-renewable-subscriptions)
   - 5.4 [Generating StoreKit 2 Private Key (`.p8`) & API Identifiers](#54-generating-storekit-2-private-key-p8--api-identifiers)
   - 5.5 [Generating App-Specific Shared Secret](#55-generating-app-specific-shared-secret)
   - 5.6 [Setting Up Sandbox Testers](#56-setting-up-sandbox-testers)
6. [Google Play Console & Google Cloud Platform Setup Instructions](#6-google-play-console--google-cloud-platform-setup-instructions)
   - 6.1 [Google Play Developer & Merchant Account](#61-google-play-developer--merchant-account)
   - 6.2 [Package Name & Uploading Initial Signed AAB](#62-package-name--uploading-initial-signed-aab)
   - 6.3 [Creating Subscriptions & Base Plans in Play Console](#63-creating-subscriptions--base-plans-in-play-console)
   - 6.4 [Google Cloud Project & Service Account Creation](#64-google-cloud-project--service-account-creation)
   - 6.5 [Granting Financial Permissions in Play Console](#65-granting-financial-permissions-in-play-console)
   - 6.6 [Configuring License Testing](#66-configuring-license-testing)
7. [Credentials Master List & Base64 Conversion Guide](#7-credentials-master-list--base64-conversion-guide)
   - 7.1 [Complete Credentials Matrix](#71-complete-credentials-matrix)
   - 7.2 [Converting Private Keys to Base64 (Windows PowerShell)](#72-converting-private-keys-to-base64-windows-powershell)
   - 7.3 [Converting Private Keys to Base64 (macOS / Linux Bash)](#73-converting-private-keys-to-base64-macos--linux-bash)
   - 7.4 [Production `.env` Configuration Block](#74-production-env-configuration-block)
8. [End-to-End Integration & Verification Sequence](#8-end-to-end-integration--verification-sequence)
9. [Testing, Sandboxing & Troubleshooting Checklist](#9-testing-sandboxing--troubleshooting-checklist)

---

## 1. Executive Summary & Core Architecture

### Why In-App Purchases (IAP)?
Both the **Apple App Store** (Review Guideline 3.1.1) and **Google Play Store** (Play Billing Policy) mandate that any mobile application unlocking digital features, premium access, group creation limits, or tier upgrades **MUST** use Apple StoreKit and Google Play Billing. Using external gateways (such as Stripe credit card forms) directly inside native apps for digital content leads to immediate app rejection.

In PoolPay:
- **One-time group contributions and peer payouts** are processed through **Stripe Connect**.
- **User Membership Subscriptions (Regular & VIP)** are processed natively through **Google Play Billing** and **Apple StoreKit**.

### Server-Authoritative Verification Architecture
To ensure zero fraud, user memberships are **never** activated directly by the mobile client. All purchases follow a strict server-authoritative pattern:

```
┌─────────────────┐             ┌─────────────────────────┐             ┌─────────────────────┐
│                 │  1. Buy     │   Native Mobile Store   │             │                     │
│   Flutter App   │────────────>│ (Google Play / StoreKit)│             │                     │
│  (PoolPay User) │             └───────────┬─────────────┘             │                     │
│                 │<────────────────────────┘                           │                     │
│                 │   2. Encrypted Receipt / Token                      │   PoolPay Server    │
│                 │                                                     │  (Express.js API)   │
│                 │   3. POST /verify-google OR /verify-apple           │                     │
│                 │────────────────────────────────────────────────────>│                     │
│                 │                                                     │───┐                 │
│                 │                                                     │   │ 4. Verify with  │
│                 │                                                     │   │    Google/Apple │
│                 │                                                     │<──┘    Official API │
│                 │                                                     │                     │
│                 │   6. 200 OK + Updated User Model                    │   5. Update MongoDB │
│                 │<────────────────────────────────────────────────────│      (VIP/REGULAR)  │
│                 │                                                     └─────────────────────┘
│                 │   7. completePurchase()
│                 │───────────────────────────────────────────> Native Store (Acknowledged)
└─────────────────┘
```

---

## 2. Configured Identifiers & Products

The following IDs are fixed in code and match across Flutter, Express, Google Play, and Apple:

| Property | Platform | Value | Purpose |
|---|---|---|---|
| **Package Name** | Android | `com.poolpay.rosca` | Android Application ID |
| **Bundle Identifier** | iOS | `com.poolpay.app` | iOS App Bundle ID |
| **Regular Subscription SKU** | Cross-Platform | `regular_yearly_subscription` | Upgrades user to **REGULAR** Tier |
| **VIP Subscription SKU** | Cross-Platform | `vip_yearly_subscription` | Upgrades user to **VIP** Tier |
| **Subscription Duration** | Both Stores | `1 Year` (Auto-Renewable) | Yearly billing period |
| **Production API Base URL**| Both Stores | `https://api.poolpay.space` | Backend REST endpoint |

---

## 3. Backend Architecture & Code Implementation

Backend code is located under `apps/api/src/app/modules/mobileMembership/` and `apps/api/src/app/config/`.

### 3.1 IAP Configuration Module (`iap.config.ts`)
File: [`apps/api/src/app/config/iap.config.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/api/src/app/config/iap.config.ts)

This file initializes:
1. **Google Play `androidpublisher(v3)` client**:
   - Reads `GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64` directly from memory (ideal for Docker / EC2 / ECS without mounting files).
   - Falls back to `GOOGLE_PLAY_SERVICE_ACCOUNT_PATH` (file on disk).
   - Authorizes with scope `https://www.googleapis.com/auth/androidpublisher`.
2. **Apple App Store Server API (StoreKit 2) JWT Generator**:
   - Reads `APPLE_PRIVATE_KEY_BASE64` or `APPLE_PRIVATE_KEY_PATH`.
   - Signs an **ES256** JWT bearer token using `jsonwebtoken` with headers:
     ```json
     {
       "alg": "ES256",
       "kid": "<APPLE_KEY_ID>",
       "typ": "JWT"
     }
     ```
   - Payload:
     ```json
     {
       "iss": "<APPLE_ISSUER_ID>",
       "iat": 1725500000,
       "exp": 1725503600,
       "aud": "appstoreconnect-v1",
       "bid": "com.poolpay.app"
     }
     ```

### 3.2 Google Play Billing Verification
File: [`apps/api/src/app/modules/mobileMembership/mobileMembership.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/api/src/app/modules/mobileMembership/mobileMembership.service.ts#L45-L108)

The backend calls the Google Play Developer API:
```typescript
const response = await client.purchases.subscriptions.get({
  packageName: "com.poolpay.rosca",
  subscriptionId: productId, // "regular_yearly_subscription" or "vip_yearly_subscription"
  token: purchaseToken,      // Returned by Flutter Google Play billing plugin
});
```
- Validates `response.data.expiryTimeMillis`.
- If `expiryDate.getTime() < Date.now()`, the request is rejected with HTTP 400.
- Extracts `orderId` (e.g., `GPA.3351-4829-1092-28491`).

### 3.3 Apple StoreKit 2 Verification
File: [`apps/api/src/app/modules/mobileMembership/mobileMembership.service.ts`](file:///c:/Users/Adnan/ZProject/adnan/derival81/apps/api/src/app/modules/mobileMembership/mobileMembership.service.ts#L247-L325)

The backend queries Apple's modern **App Store Server API**:
- Production URL: `https://api.storekit.itunes.apple.com/inApps/v1/subscriptions/{transactionId}`
- Sandbox URL: `https://api.storekit-sandbox.itunes.apple.com/inApps/v1/subscriptions/{transactionId}`
- If production returns 404, the service automatically falls back to the Sandbox endpoint to verify sandbox/testflight transactions seamlessly.
- Decodes the returned JWS payload (`signedTransactionInfo`):
  ```typescript
  const txPayload = decodeJwsPayload<StoreKit2TransactionPayload>(lastTx.signedTransactionInfo);
  ```
- Also supports the legacy App Store receipt validation API (`https://buy.itunes.apple.com/verifyReceipt`) with automatic `status === 21007` sandbox fallback for older iOS versions.

### 3.4 Database Updates & Audit Logging
Once verified, the service executes inside a MongoDB transaction (`withTransaction`):
```typescript
user.membershipTier = targetTier; // "regular" or "vip"
user.subscriptionStatus = SubscriptionStatus.ACTIVE;
user.subscriptionExpiry = expiryDate;
user.membershipProvider = platform === "google" ? MembershipProvider.GOOGLE_PLAY : MembershipProvider.APPLE_STORE;
user.platformSubscriptionId = orderIdOrTransactionId;
user.purchaseToken = token;
user.autoRenewEnabled = autoRenewing;
user.membershipStartedAt = user.membershipStartedAt || now;
user.lastBillingDate = now;
await user.save({ session });
```
Additionally:
- Records an `AuditLog` entry with action `MEMBERSHIP_UPGRADE`.
- Dispatches a real-time socket event: `emitRealTimeNotification(userId, title, body)`.
- Sends a push notification via Firebase FCM: `enqueuePushNotification(...)`.
- Sends an email alert: `enqueueEmailNotification(...)`.

### 3.5 API Endpoints & Request/Response Contracts

#### 1. Verify Google Purchase
- **Method**: `POST`
- **Path**: `/api/v1/mobile-membership/verify-google`
- **Auth**: `Bearer <User_Access_Token>`
- **Body**:
  ```json
  {
    "productId": "vip_yearly_subscription",
    "token": "eocpdlhjhgkd..."
  }
  ```
- **Success Response (200 OK)**:
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

#### 2. Verify Apple Purchase
- **Method**: `POST`
- **Path**: `/api/v1/mobile-membership/verify-apple`
- **Auth**: `Bearer <User_Access_Token>`
- **Body** *(supports StoreKit 2 `transactionId` or legacy `receiptData`)*:
  ```json
  {
    "productId": "regular_yearly_subscription",
    "transactionId": "2000000123456789",
    "receiptData": "MIIT/wYJKoZIhvcNAQcCoIIT8DCCE+wCAQEx..."
  }
  ```
- **Success Response (200 OK)**: Same structure as Google.

#### 3. Sync Subscription Status
- **Method**: `POST`
- **Path**: `/api/v1/mobile-membership/sync`
- **Auth**: `Bearer <User_Access_Token>`
- **Behavior**: Calls Apple or Google servers using stored tokens to refresh expiry date or check for cancellations.

#### 4. Get Current Status
- **Method**: `GET`
- **Path**: `/api/v1/mobile-membership/status`
- **Auth**: `Bearer <User_Access_Token>`

---

## 4. Frontend Architecture & Code Implementation (Flutter)

Frontend code is located under `derival81/lib/`.

### 4.1 Dependencies & Platform Permissions
In [`derival81/pubspec.yaml`](file:///c:/Users/Adnan/ZProject/adnan/derival81/derival81/pubspec.yaml):
```yaml
dependencies:
  flutter:
    sdk: flutter
  in_app_purchase: ^3.2.0
  get: ^4.6.6
  http: ^1.6.0
```

#### Android Configuration
File: `derival81/android/app/src/main/AndroidManifest.xml`
Ensure the Google Play Billing permission is included:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="com.android.vending.BILLING" />
    <uses-permission android:name="android.permission.INTERNET" />
    ...
</manifest>
```

#### iOS Configuration
Open the iOS workspace in Xcode (`derival81/ios`):
1. Select the **Runner** target.
2. Go to **Signing & Capabilities**.
3. Click **+ Capability** and select **In-App Purchase**.

### 4.2 App Configuration & Centralized Identifiers
File: [`derival81/lib/config/app_credentials.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/derival81/lib/config/app_credentials.dart#L74-L92)

```dart
class AppCredentials {
  // Production server URL
  static const String defaultServerUrl = 'https://api.poolpay.space';
  static const String baseUrl = String.fromEnvironment('BASE_URL', defaultValue: defaultServerUrl);

  // Store Product IDs
  static const String regularSubscriptionId = 'regular_yearly_subscription';
  static const String vipSubscriptionId = 'vip_yearly_subscription';

  static const Set<String> subscriptionProductIds = {
    regularSubscriptionId,
    vipSubscriptionId,
  };
}
```

### 4.3 Subscription Controller (`subscription_controller.dart`)
File: [`derival81/lib/View/Screen/Subscription/controller/subscription_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/derival81/lib/View/Screen/Subscription/controller/subscription_controller.dart)

Key components implemented in GetX:

```dart
class SubscriptionController extends GetxController {
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _subscription;

  var isIapAvailable = false.obs;
  var products = <ProductDetails>[].obs;
  var isLoading = false.obs;
  var upgradingTier = "".obs;

  @override
  void onInit() {
    super.onInit();
    _initIap();
  }

  Future<void> _initIap() async {
    // 1. Subscribe to purchase updates stream
    final Stream<List<PurchaseDetails>> purchaseUpdated = _iap.purchaseStream;
    _subscription = purchaseUpdated.listen(
      _handlePurchaseUpdates,
      onDone: () => _subscription?.cancel(),
      onError: (error) => debugPrint("IAP Stream Error: $error"),
    );

    // 2. Check store availability & load products
    isIapAvailable.value = await _iap.isAvailable();
    if (isIapAvailable.value) {
      final ProductDetailsResponse response =
          await _iap.queryProductDetails(AppCredentials.subscriptionProductIds);
      if (response.error == null) {
        products.value = response.productDetails;
      }
    }
  }
```

### 4.4 Handling the Purchase Lifecycle & The Crucial Acknowledgment Step

```dart
  Future<void> upgradeTo(String tier) async {
    ProductDetails? targetProduct = getProduct(tier);
    if (targetProduct == null) {
      CustomToast.showError("Error", "Product details not loaded from store.");
      return;
    }

    final PurchaseParam purchaseParam = PurchaseParam(productDetails: targetProduct);
    await _iap.buyNonConsumable(purchaseParam: purchaseParam);
  }

  Future<void> _handlePurchaseUpdates(List<PurchaseDetails> purchaseDetailsList) async {
    for (var purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.status == PurchaseStatus.pending) {
        isLoading.value = true;
      } else if (purchaseDetails.status == PurchaseStatus.error) {
        isLoading.value = false;
        CustomToast.showError("Failed", purchaseDetails.error?.message ?? "Error");
        if (purchaseDetails.pendingCompletePurchase) {
          await _iap.completePurchase(purchaseDetails);
        }
      } else if (purchaseDetails.status == PurchaseStatus.purchased ||
                 purchaseDetails.status == PurchaseStatus.restored) {
        // Step 1: Send token to PoolPay backend for verification
        bool verified = await _verifyPurchaseOnServer(purchaseDetails);

        if (verified) {
          // CRITICAL STEP: Acknowledge purchase with store
          if (purchaseDetails.pendingCompletePurchase) {
            await _iap.completePurchase(purchaseDetails);
          }
          await profileController.fetchMembershipStatus();
          CustomToast.showSuccess("Success", "Subscription activated!");
        } else {
          CustomToast.showError("Verification Failed", "Could not verify purchase with server.");
        }
        isLoading.value = false;
      }
    }
  }
```

> [!CAUTION]
> **Why `completePurchase()` is Mandatory:**
> If you do not call `_iap.completePurchase(purchaseDetails)`, Google Play assumes the purchase was aborted or unfulfilled and **automatically refunds the customer after 3 days**. Never omit this step!

### 4.5 Restoring Purchases
App Store Review Guidelines require a visible **"Restore Purchases"** button for non-consumable items and auto-renewable subscriptions:
```dart
Future<void> restorePurchases() async {
  isRestoring.value = true;
  try {
    if (isIapAvailable.value) {
      await _iap.restorePurchases();
    }
    // Also trigger server-side sync
    String? token = await PrefsHelper.getString(PrefsHelper.token);
    if (token != null) {
      await http.post(
        Uri.parse(ApiUrl.mobileMembershipSyncUrl),
        headers: {'Authorization': 'Bearer $token'},
      );
    }
    await profileController.fetchMembershipStatus();
    CustomToast.showSuccess("Restored", "Purchases successfully restored!");
  } finally {
    isRestoring.value = false;
  }
}
```

### 4.6 UI Subscription Paywall Screen
File: [`derival81/lib/View/Screen/Subscription/view/subscription_screen.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/derival81/lib/View/Screen/Subscription/view/subscription_screen.dart)
- Displays current user tier card (e.g., Guest, Regular, VIP).
- Displays cards for `GUEST`, `REGULAR` ($5.00/yr), and `VIP` ($10.00/yr).
- Formats store-provided localized price strings (`targetProduct.price`).
- Disables the button for the active tier.
- Shows auto-renewal terms & privacy policy links as mandated by Apple and Google.

---

## 5. Apple App Store Connect Setup Instructions

Follow these steps in your [Apple Developer Account](https://developer.apple.com/) and [App Store Connect](https://appstoreconnect.apple.com/):

### 5.1 Agreements, Tax, and Banking
> [!IMPORTANT]
> You **cannot** test or sell In-App Purchases until Apple has approved your Paid Applications Agreement.
1. Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2. Click **Agreements, Tax, and Banking**.
3. Under **Agreements**, find **Paid Applications**.
4. Review and accept the terms, then enter your banking and tax information.
5. Wait for the status to show **Active**.

### 5.2 Register App & Bundle ID
1. Go to [Apple Developer Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list).
2. Under **Identifiers**, confirm Bundle ID `com.poolpay.app` exists and has **In-App Purchase** enabled under Capabilities.
3. In App Store Connect ➔ **My Apps**, create the app if not already created, matching Bundle ID `com.poolpay.app`.

### 5.3 Creating Auto-Renewable Subscriptions
1. In App Store Connect, open **PoolPay** ➔ In the left sidebar under **Monetization**, select **Subscriptions**.
2. Click **Create Subscription Group** and name it: `PoolPay Memberships`.
3. Inside the group, click the **+** icon to create Subscription 1:
   - **Reference Name**: `PoolPay Regular Yearly`
   - **Product ID**: `regular_yearly_subscription`
   - **Subscription Duration**: `1 Year`
   - Set price (e.g., $5.00 / year).
   - Under **Localization**, add English: Title: `Regular Yearly Membership`, Description: `Access to create 1 active group and participate in circles.`
   - Under **App Store Review Information**, upload a screenshot of the subscription paywall screen.
4. Click **+** again to create Subscription 2:
   - **Reference Name**: `PoolPay VIP Yearly`
   - **Product ID**: `vip_yearly_subscription`
   - **Subscription Duration**: `1 Year`
   - Set price (e.g., $10.00 / year).
   - Under **Localization**, add English: Title: `VIP Yearly Membership`, Description: `Access to unlimited active groups, premium badges, and priority features.`
   - Upload review screenshot.
5. Save both subscriptions.

### 5.4 Generating StoreKit 2 Private Key (`.p8`) & API Identifiers
The modern StoreKit 2 API uses an ES256 key:
1. In App Store Connect, click **Users and Access** in the top navigation bar.
2. Select the **Integrations** tab (or **Keys** tab in older UI).
3. In the left sub-menu, select **In-App Purchase**.
4. Click **Generate In-App Purchase Key** (or **+**).
5. Name the key (e.g., `PoolPay IAP Server Key`).
6. Once created, note the **Key ID** (e.g., `Q2XGP426C3`).
7. Note the **Issuer ID** (a UUID displayed at the top of the page, e.g., `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
8. Click **Download API Key** to download the file `SubscriptionKey_Q2XGP426C3.p8`.
   > [!WARNING]
   > Apple only allows you to download this file **ONCE**. Store it securely.

### 5.5 Generating App-Specific Shared Secret
(Used as a fallback for legacy receipt validation):
1. In App Store Connect ➔ **My Apps** ➔ **PoolPay**.
2. In the left menu, select **Subscriptions** (or **App Information**).
3. Under the **App-Specific Shared Secret** section on the right, click **Manage**.
4. Click **Generate** and copy the 32-character hexadecimal key (e.g., `3d8a9f...`).

### 5.6 Setting Up Sandbox Testers
1. In App Store Connect ➔ **Users and Access** ➔ in the left sidebar under **Sandbox**, select **Testers**.
2. Click **+** to add a tester:
   - Use an email address that is **NOT** associated with an existing Apple ID.
   - Enter a password.
3. On a physical testing iPhone:
   - Open **Settings** ➔ **App Store**.
   - Scroll down to **SANDBOX ACCOUNT**.
   - Sign in with the test email created above.
   *(Do NOT sign out of your personal Apple ID at the top of Settings; only sign into the Sandbox Account at the bottom).*

---

## 6. Google Play Console & Google Cloud Platform Setup Instructions

### 6.1 Google Play Developer & Merchant Account
1. Open [Google Play Console](https://play.google.com/console).
2. Ensure you have set up a **Payments Profile** under **Settings ➔ Developer account ➔ Payments profile**.

### 6.2 Package Name & Uploading Initial Signed AAB
> [!IMPORTANT]
> Google Play Billing APIs will return `BillingClient: Billing unavailable` or `Item not found` until an **initial signed AAB containing the billing permission** has been uploaded to at least the **Internal Testing** track.
1. Build the release App Bundle:
   ```bash
   cd derival81
   flutter build appbundle --release
   ```
2. In Google Play Console, navigate to **Testing ➔ Internal testing**.
3. Create a new release and upload the `.aab` file.
4. Add yourself to the testers list and copy the join link.

### 6.3 Creating Subscriptions & Base Plans in Play Console
1. In Google Play Console, open your app (`com.poolpay.rosca`).
2. In the left sidebar under **Monetize**, click **Products ➔ Subscriptions**.
3. Click **Create subscription**:
   - **Subscription 1 (Regular)**:
     - Product ID: `regular_yearly_subscription`
     - Name: `Regular Yearly Membership`
     - Click **Add base plan**:
       - Base Plan ID: `regular-yearly-base`
       - Type: **Auto-renewing**
       - Billing period: `1 Year`
       - Price: Set price (e.g., $5.00)
       - Click **Activate** on the base plan.
   - **Subscription 2 (VIP)**:
     - Product ID: `vip_yearly_subscription`
     - Name: `VIP Yearly Membership`
     - Click **Add base plan**:
       - Base Plan ID: `vip-yearly-base`
       - Type: **Auto-renewing**
       - Billing period: `1 Year`
       - Price: Set price (e.g., $10.00)
       - Click **Activate** on the base plan.
4. Save both subscriptions.

### 6.4 Google Cloud Project & Service Account Creation
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select or create the Google Cloud project linked to your Google Play Console.
3. In the search bar, search for **Google Play Android Developer API** and click **Enable**.
4. In the left menu, select **IAM & Admin ➔ Service Accounts**.
5. Click **+ Create Service Account**:
   - Service account name: `poolpay-iap-service`
   - Description: `Service account for validating Android in-app purchases`
   - Click **Create and Continue**, then click **Done**.
6. In the list, click on the newly created service account.
7. Switch to the **Keys** tab ➔ Click **Add Key ➔ Create new key** ➔ Select **JSON** ➔ Click **Create**.
8. The JSON file (e.g. `poolpay-e80df-0bfcd3a3ff84.json`) will download to your computer.

### 6.5 Granting Financial Permissions in Play Console
1. Return to [Google Play Console](https://play.google.com/console).
2. Go to **Settings ➔ Developer account ➔ API access**.
3. Look for the newly created service account under **Service accounts**.
4. Click **Manage Play Console permissions** (or **Grant access**).
5. Under the **App permissions** tab, select **PoolPay** (`com.poolpay.rosca`).
6. Under the **Account permissions / Financial permissions** tab, verify and check:
   - ✅ *View financial data, orders, and cancellation survey responses*
   - ✅ *Manage orders and subscriptions*
7. Click **Invite user** or **Save changes**.

### 6.6 Configuring License Testing
1. In Google Play Console, navigate to **Settings ➔ Developer account ➔ License testing**.
2. Add the Gmail addresses of your testers.
3. Set **License response** to `RESPOND_NORMALLY`.
4. This ensures test accounts can make test purchases using Google's test payment card without incurring real charges.

---

## 7. Credentials Master List & Base64 Conversion Guide

### 7.1 Complete Credentials Matrix

| Environment Variable | Provider | Type / Format | Where To Find In Console | Where To Place In Codebase |
|---|---|---|---|---|
| `GOOGLE_PLAY_PACKAGE_NAME` | Google | String | Play Console (`com.poolpay.rosca`) | Server `.env` |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64` | Google | Base64 String | Generated from GCP JSON Key | Server `.env` |
| `GOOGLE_PLAY_REGULAR_PRODUCT_ID` | Google | String | `regular_yearly_subscription` | Server `.env` |
| `GOOGLE_PLAY_VIP_PRODUCT_ID` | Google | String | `vip_yearly_subscription` | Server `.env` |
| `APPLE_BUNDLE_ID` | Apple | String | `com.poolpay.app` | Server `.env` |
| `APPLE_ISSUER_ID` | Apple | UUID String | App Store Connect ➔ Users & Access ➔ Integrations ➔ In-App Purchase | Server `.env` |
| `APPLE_KEY_ID` | Apple | 10-char Alphanumeric | App Store Connect ➔ Key ID (e.g. `Q2XGP426C3`) | Server `.env` |
| `APPLE_PRIVATE_KEY_BASE64` | Apple | Base64 String | Generated from `SubscriptionKey_Q2XGP426C3.p8` | Server `.env` |
| `APPLE_SHARED_SECRET` | Apple | 32-char Hex String | App Store Connect ➔ Subscriptions ➔ App-Specific Shared Secret | Server `.env` |
| `APPLE_REGULAR_PRODUCT_ID` | Apple | String | `regular_yearly_subscription` | Server `.env` |
| `APPLE_VIP_PRODUCT_ID` | Apple | String | `vip_yearly_subscription` | Server `.env` |

---

### 7.2 Converting Private Keys to Base64 (Windows PowerShell)

In Windows PowerShell, multi-line `.p8` and `.json` files can be converted to clean, single-line Base64 strings using the commands below:

#### Convert Apple `.p8` Private Key:
```powershell
# Run from repository root or directory containing the file
$p8Base64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("apps\api\SubscriptionKey_Q2XGP426C3.p8"))
# Copy directly to your Windows clipboard:
$p8Base64 | Set-Clipboard
Write-Host "Apple .p8 Base64 copied to clipboard!"
```

#### Convert Google Service Account `.json`:
```powershell
# Run from repository root or directory containing the file
$jsonBase64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("derival81\poolpay-e80df-0bfcd3a3ff84.json"))
# Copy directly to your Windows clipboard:
$jsonBase64 | Set-Clipboard
Write-Host "Google JSON Base64 copied to clipboard!"
```

---

### 7.3 Converting Private Keys to Base64 (macOS / Linux Bash)

On macOS or Linux terminals (or inside your EC2 server):

#### Convert Apple `.p8` Private Key:
```bash
# macOS (BSD base64)
base64 -i SubscriptionKey_Q2XGP426C3.p8 | tr -d '\n' | pbcopy

# Linux / Ubuntu (GNU base64)
base64 -w 0 SubscriptionKey_Q2XGP426C3.p8
```

#### Convert Google Service Account `.json`:
```bash
# macOS (BSD base64)
base64 -i google-service-account.json | tr -d '\n' | pbcopy

# Linux / Ubuntu (GNU base64)
base64 -w 0 google-service-account.json
```

---

### 7.4 Production `.env` Configuration Block

Add the following block to your production root `.env` file (e.g. on your EC2 instance `/home/ubuntu/poolpay/.env`):

```env
# ==============================================================================
# MOBILE IN-APP PURCHASES & SUBSCRIPTIONS (Google Play & Apple StoreKit 2)
# ==============================================================================

# ----------------- Android (Google Play Billing) -----------------
GOOGLE_PLAY_PACKAGE_NAME=com.poolpay.rosca
GOOGLE_PLAY_REGULAR_PRODUCT_ID=regular_yearly_subscription
GOOGLE_PLAY_VIP_PRODUCT_ID=vip_yearly_subscription
# Paste the single-line Base64 string of your Google Cloud service account JSON here:
GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIs...

# ----------------- iOS (Apple StoreKit 2 & App Store Server API) -----------------
APPLE_BUNDLE_ID=com.poolpay.app
APPLE_KEY_ID=Q2XGP426C3
APPLE_ISSUER_ID=your_apple_issuer_uuid_here
APPLE_REGULAR_PRODUCT_ID=regular_yearly_subscription
APPLE_VIP_PRODUCT_ID=vip_yearly_subscription
# Optional fallback shared secret:
APPLE_SHARED_SECRET=your_32_char_app_specific_shared_secret_here
# Paste the single-line Base64 string of your SubscriptionKey_Q2XGP426C3.p8 file here:
APPLE_PRIVATE_KEY_BASE64=LS0tLS1CRUdJTiBQUklWQVRFIEtFWS...
```

---

## 8. End-to-End Integration & Verification Sequence

Here is the exact runtime sequence when a user buys a membership:

| Step | Component | Action | Details |
|---|---|---|---|
| **1** | **User** | Opens Membership Screen | Flutter navigates to `SubscriptionScreen`. |
| **2** | **Flutter App** | `_initIap()` | Calls `_iap.queryProductDetails({'regular_yearly_subscription', 'vip_yearly_subscription'})`. |
| **3** | **Mobile Stores** | Returns Products | Apple / Google returns localized price strings (e.g., "$5.00 / year"). |
| **4** | **User** | Taps "Upgrade to VIP" | Triggers `controller.upgradeTo('VIP')`. |
| **5** | **Flutter App** | `_iap.buyNonConsumable()` | Native payment sheet pops up with FaceID/TouchID/Google Pay. |
| **6** | **Store OS** | Payment Approved | Purchases stream fires with `status: PurchaseStatus.purchased`. |
| **7** | **Flutter App** | `_verifyPurchaseOnServer()` | Dispatches POST to `https://api.poolpay.space/api/v1/mobile-membership/verify-google` or `verify-apple`. |
| **8** | **Backend** | Authenticates Token | Backend checks with Google Play Developer API or StoreKit 2 Server API using credentials. |
| **9** | **Backend** | Updates MongoDB | Sets `user.membershipTier = 'vip'`, sets expiry date, and writes audit log. |
| **10** | **Backend** | Returns 200 OK | Returns `{ success: true, user: { membershipTier: 'vip' } }`. |
| **11** | **Flutter App** | `_iap.completePurchase()` | **Crucial:** Acknowledges transaction with store so it isn't auto-refunded. |
| **12** | **Flutter App** | Re-renders UI | User badge and membership card instantly flip to VIP. |

---

## 9. Testing, Sandboxing & Troubleshooting Checklist

### Accelerated Sandbox Subscription Timers
In testing environments, store renewals happen at accelerated speeds to allow quick verification of renewals, expirations, and cancellations:

| Real-World Duration | Google Play License Testing | Apple App Store Sandbox |
|---|---|---|
| **1 Year** | **5 minutes** | **1 hour** |
| **1 Month** | **5 minutes** | **5 minutes** |
| **Auto-Renewals** | Up to 6 times before expiring | Up to 6 times before expiring |

---

### Common Issues & Troubleshooting Steps

#### Issue 1: `BillingClient: responseCode 3 (Billing unavailable)`
- **Cause**: Device doesn't have Google Play Services installed, or no signed APK/AAB was ever uploaded to Google Play Console.
- **Fix**: You **must** upload at least one release AAB to an **Internal Testing** track in Google Play Console with the same package name (`com.poolpay.rosca`) and version code. Ensure you are testing on an Android device that is signed into a Google account.

#### Issue 2: `Query product details returned empty`
- **Cause**: The product ID in code does not match the product ID in the developer console, or the product base plan is inactive.
- **Fix**: 
  - Ensure the product ID is exactly `regular_yearly_subscription` or `vip_yearly_subscription`.
  - In Google Play Console, verify that the **Base Plan** is set to **Active**.
  - In App Store Connect, verify that the Paid Applications contract is active and review screenshots are attached.

#### Issue 3: Apple Error `21007` (`This receipt is from the test environment`)
- **Cause**: A receipt generated in the Sandbox/TestFlight environment was posted to the production verification URL (`https://buy.itunes.apple.com/verifyReceipt`).
- **Fix**: The PoolPay backend already handles this automatically! `mobileMembership.service.ts` catches `status === 21007` and automatically re-routes the receipt to `https://sandbox.itunes.apple.com/verifyReceipt`.

#### Issue 4: Google 401/403 `The project id used to call the Google Play Developer API has not been linked`
- **Cause**: The Google Cloud service account has not been granted API access inside Google Play Console.
- **Fix**: Open Google Play Console ➔ **Settings ➔ API access** ➔ Locate the service account email ➔ Click **Grant access** ➔ Check **View financial data** and **Manage orders and subscriptions** ➔ Save changes.

#### Issue 5: Subscriptions auto-refunded after 3 days
- **Cause**: Missing purchase acknowledgment (`completePurchase`).
- **Fix**: Ensure that `InAppPurchase.instance.completePurchase(purchaseDetails)` is called as soon as the server verification endpoint returns HTTP 200.

#### Issue 6: Corrupted Base64 in Production `.env`
- **Cause**: Multi-line strings broken across newlines when copied into `.env`.
- **Fix**: Ensure the Base64 string is completely on a **single line** with no whitespace or carriage returns (`\r\n`). Use the PowerShell `[Convert]::ToBase64String(...)` or Linux `base64 -w 0` commands provided in Section 7.
