# In-App Purchase & Subscription Credentials Setup Guide
**PoolPay / Derival81 — iOS (Apple StoreKit) & Android (Google Play Billing)**

This document provides a complete, step-by-step checklist of the credentials needed for in-app subscriptions, how to generate them, and where to place them in your project.

---

## 1. Quick Summary of Required Credentials

You only need to generate and provide **2 credentials**:

| # | Provider | Credential Name | Format | Where It Goes |
|---|---|---|---|---|
| **1** | **Apple App Store** | **App-Specific Shared Secret** | 32-character hex string | Root `.env` (`APPLE_SHARED_SECRET`) |
| **2** | **Google Play** | **Service Account JSON Key** | `.json` file | Put file in `apps/api/` & set path in root `.env` |

---

## 2. Configured Identifiers (Pre-set in Code)

The following identifiers are already configured in your Flutter app and Backend API. When creating your apps and subscriptions in Google Play Console and Apple App Store Connect, use these **exact values**:

| Platform | Property | Configured Value |
|---|---|---|
| **Android** | Package Name / Application ID | `com.poolpay.rosca` |
| **Android** | Regular Subscription Product ID | `regular_yearly_subscription` |
| **Android** | VIP Subscription Product ID | `vip_yearly_subscription` |
| **iOS** | Bundle Identifier | `com.poolpay.app` |
| **iOS** | Regular Subscription Product ID | `regular_yearly_subscription` |
| **iOS** | VIP Subscription Product ID | `vip_yearly_subscription` |

---

## 3. Apple App Store Setup (iOS)

### Step A: Create Subscription Group and Products
1. Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2. Navigate to **My Apps** ➔ Select **PoolPay** (Bundle ID: `com.poolpay.app`).
3. In the left sidebar under **Monetization**, select **Subscriptions**.
4. Click **Create Subscription Group** (e.g., name it `PoolPay Memberships`).
5. Inside the group, click **+** to add two Auto-Renewable Subscriptions:
   - **Regular Subscription**:
     - Reference Name: `PoolPay Regular Yearly`
     - Product ID: `regular_yearly_subscription`
     - Subscription Duration: `1 Year`
     - Set your desired price (e.g. $29.99 / year).
   - **VIP Subscription**:
     - Reference Name: `PoolPay VIP Yearly`
     - Product ID: `vip_yearly_subscription`
     - Subscription Duration: `1 Year`
     - Set your desired price (e.g. $99.99 / year).
6. Save both subscriptions.

### Step B: Generate the App-Specific Shared Secret
1. In App Store Connect, under your app, go to **Subscriptions** (or **App Information**).
2. Look for the **App-Specific Shared Secret** section on the right side of the screen.
3. Click **Manage** (or **Generate App-Specific Shared Secret**).
4. Copy the 32-character hexadecimal key (e.g., `a1b2c3d4e5f67890abcdef1234567890`).

### Step C: Set Up iOS Sandbox Testers (Testing)
1. Go to **Users and Access** in the top navigation bar.
2. In the left sidebar under **Sandbox**, select **Testers**.
3. Click **+** to create a test user with a dummy email and password.
4. On a physical iPhone, go to **Settings ➔ App Store ➔ Sandbox Account**, sign in with this test user, and test purchases without real charges.

---

## 4. Google Play Console Setup (Android)

Google Play server-to-server verification requires a **Google Cloud Service Account** linked with access to your Google Play Console.

### Step A: Create Subscriptions in Google Play Console
1. Log in to [Google Play Console](https://play.google.com/console).
2. Select your app (Package name: `com.poolpay.rosca`).
3. In the left sidebar under **Monetize**, select **Products ➔ Subscriptions**.
4. Click **Create subscription**:
   - **Regular Subscription**:
     - Product ID: `regular_yearly_subscription`
     - Name: `Regular Yearly Membership`
     - Click **Add base plan** ➔ select **Auto-renewing** ➔ Billing period: `1 Year` ➔ Set price ➔ click **Activate**.
   - **VIP Subscription**:
     - Product ID: `vip_yearly_subscription`
     - Name: `VIP Yearly Membership`
     - Click **Add base plan** ➔ select **Auto-renewing** ➔ Billing period: `1 Year` ➔ Set price ➔ click **Activate**.
5. Save both subscriptions.

### Step B: Create a Service Account in Google Cloud
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select the Google Cloud project that is linked to your Google Play Developer account.
3. Search for **Google Play Android Developer API** in the top search bar and click **Enable**.
4. In the left menu, navigate to **IAM & Admin ➔ Service Accounts**.
5. Click **+ Create Service Account**:
   - Name: `poolpay-iap-service`
   - Description: `Service account for Google Play in-app purchase verification`
   - Click **Create and Continue**, then click **Done**.
6. Find the newly created service account in the list, click on it, and switch to the **Keys** tab.
7. Click **Add Key ➔ Create new key** ➔ select **JSON** ➔ click **Create**.
8. A `.json` file will automatically download to your computer.

### Step C: Link Service Account in Google Play Console
1. Return to [Google Play Console](https://play.google.com/console).
2. In the left sidebar under **Settings**, select **API access**.
3. You will see your new service account listed under **Service Accounts**.
4. Click **Manage Play Console permissions** (or **Grant access**) next to it.
5. In the **App permissions** tab, add your app (**PoolPay**).
6. In the **Financial permissions** tab, make sure the following are checked:
   - ✅ *View financial data, orders, and cancellation survey responses*
   - ✅ *Manage orders and subscriptions*
7. Click **Apply** / **Save changes**.

### Step D: Setup License Testing (Testing)
1. In Google Play Console, go to **Setup ➔ License testing**.
2. Add your tester Google accounts (emails).
3. Under **License response**, ensure it is set to `RESPOND_NORMALLY`.

---

## 5. Adding the Credentials to the Codebase

### In the Root `.env` File
Open `c:\Users\Adnan\ZProject\adnan\derival81\.env` and update the IAP section:

```env
# ========================================
# Mobile In-App Purchases (Google Play & Apple StoreKit)
# ========================================
GOOGLE_PLAY_PACKAGE_NAME=com.poolpay.rosca
GOOGLE_PLAY_SERVICE_ACCOUNT_PATH=./google-service-account.json
GOOGLE_PLAY_REGULAR_PRODUCT_ID=regular_yearly_subscription
GOOGLE_PLAY_VIP_PRODUCT_ID=vip_yearly_subscription

APPLE_SHARED_SECRET=your_32_character_apple_shared_secret_here
APPLE_REGULAR_PRODUCT_ID=regular_yearly_subscription
APPLE_VIP_PRODUCT_ID=vip_yearly_subscription
```

### Save the Google JSON Key File
1. Take the `.json` file downloaded in Step 4B.
2. Rename it to `google-service-account.json`.
3. Place it in `apps/api/google-service-account.json`.

*(Note: `*.json` service accounts are already protected from git commit).*

---

## 6. How Flutter Handles the Purchase

In `derival81/lib/config/app_credentials.dart`, the cross-platform product IDs are already mapped:

```dart
static const String regularSubscriptionId = 'regular_yearly_subscription';
static const String vipSubscriptionId = 'vip_yearly_subscription';
```

When a user taps **Upgrade to VIP** or **Upgrade to Regular**:
1. The app queries the store using `in_app_purchase`.
2. The store presents the native Google Play or Apple payment sheet.
3. Once approved, the encrypted purchase receipt is sent to your backend:
   - Android: `POST /api/v1/mobile-membership/verify-google`
   - iOS: `POST /api/v1/mobile-membership/verify-apple`
4. The backend securely checks the receipt against Google/Apple servers using the credentials above and updates the user's membership in MongoDB.
