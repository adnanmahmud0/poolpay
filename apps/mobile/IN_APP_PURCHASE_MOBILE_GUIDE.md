# 📱 Mobile App Developer Guide: In-App Purchases & Subscriptions

**PoolPay Mobile App (`derival81`) — Flutter, GetX & StoreKit / Google Play Billing**
_Client-Side In-App Purchase Architecture, Stream Management & Backend Verification_

---

## 📑 Table of Contents

1. [Overview & Membership Tiers](#1-overview--membership-tiers)
2. [Platform Prerequisites & Permissions](#2-platform-prerequisites--permissions)
   - 2.1 [Android Manifest & Billing Permission](#21-android-manifest--billing-permission)
   - 2.2 [iOS Capabilities & Xcode Setup](#22-ios-capabilities--xcode-setup)
3. [Architecture & Key Codebase Files](#3-architecture--key-codebase-files)
4. [Centralized Configuration (`app_credentials.dart` & `api_url.dart`)](#4-centralized-configuration-app_credentialsdart--api_urldart)
5. [In-App Purchase Service & Controller Implementation](#5-in-app-purchase-service--controller-implementation)
   - 5.1 [Initializing IAP & Listening to Purchase Stream](#51-initializing-iap--listening-to-purchase-stream)
   - 5.2 [Querying Product Details from Stores](#52-querying-product-details-from-stores)
   - 5.3 [Initiating a Purchase (`buyNonConsumable`)](#53-initiating-a-purchase-buynonconsumable)
   - 5.4 [Handling Purchase Updates & Receipt Extraction](#54-handling-purchase-updates--receipt-extraction)
   - 5.5 [Sending Receipts to PoolPay Backend](#55-sending-receipts-to-poolpay-backend)
   - 5.6 [The Mandatory Acknowledgment Step (`completePurchase`)](#56-the-mandatory-acknowledgment-step-completepurchase)
   - 5.7 [Restoring Past Purchases (`restorePurchases`)](#57-restoring-past-purchases-restorepurchases)
6. [Subscription Paywall UI (`subscription_screen.dart`)](#6-subscription-paywall-ui-subscription_screendart)
7. [Store Console Setup for Mobile Developers](#7-store-console-setup-for-mobile-developers)
   - 7.1 [Google Play Console Setup](#71-google-play-console-setup)
   - 7.2 [Apple App Store Connect Setup](#72-apple-app-store-connect-setup)
8. [Testing & Sandboxing (Step-by-Step)](#8-testing--sandboxing-step-by-step)
   - 8.1 [Android License Testing](#81-android-license-testing)
   - 8.2 [iOS Sandbox Account Testing](#82-ios-sandbox-account-testing)
   - 8.3 [Accelerated Sandbox Renewal Timers](#83-accelerated-sandbox-renewal-timers)
9. [Troubleshooting Common Mobile IAP Errors](#9-troubleshooting-common-mobile-iap-errors)

---

## 1. Overview & Membership Tiers

The PoolPay Flutter app (`derival81`) provides three membership tiers. While `GUEST` is free, `REGULAR` and `VIP` are purchased as **yearly auto-renewable subscriptions**:

| Tier        | Price  | Duration | In-App Purchase Product ID (SKU) | Unlocked Features                                        |
| ----------- | ------ | -------- | -------------------------------- | -------------------------------------------------------- |
| **GUEST**   | Free   | Lifetime | None (Default)                   | Join circles via invite, view groups.                    |
| **REGULAR** | $5.00  | 1 Year   | `regular_yearly_subscription`    | Create 1 active group, Stripe onboarding, 1% commission. |
| **VIP**     | $10.00 | 1 Year   | `vip_yearly_subscription`        | Unlimited active groups, VIP badge, premium priority.    |

> [!IMPORTANT]
> Apple App Store and Google Play policies require digital subscriptions to be billed **strictly** through their respective native in-app billing engines. Never present Stripe or web-based checkout inside the mobile app for memberships.

---

## 2. Platform Prerequisites & Permissions

### 2.1 Android Manifest & Billing Permission

File: `derival81/android/app/src/main/AndroidManifest.xml`

Make sure the billing permission is present under `<manifest>`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.poolpay.rosca">

    <!-- REQUIRED FOR GOOGLE PLAY IN-APP PURCHASES -->
    <uses-permission android:name="com.android.vending.BILLING" />
    <uses-permission android:name="android.permission.INTERNET" />
    ...
</manifest>
```

### 2.2 iOS Capabilities & Xcode Setup

1. Open the iOS project in Xcode:
   ```bash
   open derival81/ios/Runner.xcworkspace
   ```
2. Select the **Runner** target in the left navigation pane.
3. Click on the **Signing & Capabilities** tab.
4. Click **+ Capability** in the top left corner.
5. Search for and add **In-App Purchase**.
6. Verify your Bundle Identifier is set to: `com.poolpay.app`.

---

## 3. Architecture & Key Codebase Files

The entire mobile IAP flow is organized into modular files within `derival81/lib/`:

```
derival81/lib/
├── config/
│   └── app_credentials.dart           # Centralized Product IDs & Server URL
├── service/
│   └── api_url.dart                   # Backend verification endpoints
└── View/Screen/Subscription/
    ├── controller/
    │   └── subscription_controller.dart # GetX IAP Stream, Purchase & Verify logic
    └── view/
        └── subscription_screen.dart     # Paywall UI, tier cards & terms
```

---

## 4. Centralized Configuration (`app_credentials.dart` & `api_url.dart`)

### Centralized Product IDs

File: [`derival81/lib/config/app_credentials.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/derival81/lib/config/app_credentials.dart)

```dart
class AppCredentials {
  static const String defaultServerUrl = 'https://api.poolpay.space';
  static const String baseUrl = String.fromEnvironment('BASE_URL', defaultValue: defaultServerUrl);

  // Cross-Platform In-App Purchase SKUs:
  static const String regularSubscriptionId = 'regular_yearly_subscription';
  static const String vipSubscriptionId = 'vip_yearly_subscription';

  static const Set<String> subscriptionProductIds = {
    regularSubscriptionId,
    vipSubscriptionId,
  };
}
```

### Verification Endpoints

File: [`derival81/lib/service/api_url.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/derival81/lib/service/api_url.dart)

```dart
class ApiUrl {
  static const String baseUrl = AppCredentials.baseUrl;

  // Mobile In-App Purchase Verification Endpoints
  static const String verifyGoogleUrl = '$baseUrl/api/v1/mobile-membership/verify-google';
  static const String verifyAppleUrl = '$baseUrl/api/v1/mobile-membership/verify-apple';
  static const String mobileMembershipSyncUrl = '$baseUrl/api/v1/mobile-membership/sync';
  static const String mobileMembershipStatusUrl = '$baseUrl/api/v1/mobile-membership/status';
}
```

---

## 5. In-App Purchase Service & Controller Implementation

### 5.1 Initializing IAP & Listening to Purchase Stream

File: [`derival81/lib/View/Screen/Subscription/controller/subscription_controller.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/derival81/lib/View/Screen/Subscription/controller/subscription_controller.dart)

The `SubscriptionController` sets up a persistent subscription to `InAppPurchase.instance.purchaseStream` as soon as it initializes:

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

  @override
  void onClose() {
    _subscription?.cancel(); // Always cancel stream when leaving screen
    super.onClose();
  }

  Future<void> _initIap() async {
    // 1. Listen to the purchase stream:
    final Stream<List<PurchaseDetails>> purchaseUpdated = _iap.purchaseStream;
    _subscription = purchaseUpdated.listen(
      (List<PurchaseDetails> purchaseDetailsList) {
        _handlePurchaseUpdates(purchaseDetailsList);
      },
      onDone: () => _subscription?.cancel(),
      onError: (error) => debugPrint("Purchase Stream Error: $error"),
    );

    // 2. Query available products:
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

### 5.2 Querying Product Details from Stores

`queryProductDetails` connects to Apple App Store or Google Play Store to fetch:

- Real-time localized pricing (e.g. `$5.00`, `€4.99`, `£4.49`)
- Product title & description
- Currency symbol and code

Helper to fetch a specific tier's product:

```dart
ProductDetails? getProduct(String tier) {
  String targetId = tier.toUpperCase() == "VIP"
      ? AppCredentials.vipSubscriptionId
      : AppCredentials.regularSubscriptionId;
  return products.firstWhereOrNull((p) => p.id == targetId);
}
```

### 5.3 Initiating a Purchase (`buyNonConsumable`)

```dart
Future<void> upgradeTo(String tier) async {
  if (!isIapAvailable.value) {
    CustomToast.showError("Unavailable", "In-App Purchases are not available on this device.");
    return;
  }

  ProductDetails? targetProduct = getProduct(tier);
  if (targetProduct == null) {
    CustomToast.showError("Error", "Product details not found in store.");
    return;
  }

  upgradingTier.value = tier.toLowerCase();
  isLoading.value = true;

  try {
    final PurchaseParam purchaseParam = PurchaseParam(productDetails: targetProduct);
    // Auto-renewable subscriptions use buyNonConsumable
    await _iap.buyNonConsumable(purchaseParam: purchaseParam);
  } catch (e) {
    isLoading.value = false;
    upgradingTier.value = "";
    CustomToast.showError("Error", "Failed to start purchase: $e");
  }
}
```

### 5.4 Handling Purchase Updates & Receipt Extraction

The native OS emits purchase events to the stream listener:

```dart
Future<void> _handlePurchaseUpdates(List<PurchaseDetails> purchaseDetailsList) async {
  for (var purchaseDetails in purchaseDetailsList) {
    if (purchaseDetails.status == PurchaseStatus.pending) {
      isLoading.value = true;
    } else {
      isLoading.value = false;
      upgradingTier.value = "";

      if (purchaseDetails.status == PurchaseStatus.error) {
        CustomToast.showError("Purchase Error", purchaseDetails.error?.message ?? "Purchase failed");
        if (purchaseDetails.pendingCompletePurchase) {
          await _iap.completePurchase(purchaseDetails);
        }
      } else if (purchaseDetails.status == PurchaseStatus.canceled) {
        CustomToast.showWarning("Cancelled", "Purchase was cancelled.");
        if (purchaseDetails.pendingCompletePurchase) {
          await _iap.completePurchase(purchaseDetails);
        }
      } else if (purchaseDetails.status == PurchaseStatus.purchased ||
                 purchaseDetails.status == PurchaseStatus.restored) {

        // Step 1: Verify token with PoolPay backend server
        bool verified = await _verifyPurchaseOnServer(purchaseDetails);

        if (verified) {
          // Step 2: Complete the purchase with store
          if (purchaseDetails.pendingCompletePurchase) {
            await _iap.completePurchase(purchaseDetails);
          }
          await profileController.fetchMembershipStatus();
          CustomToast.showSuccess("Success", "Subscription activated successfully!");
        } else {
          CustomToast.showError("Verification Failed", "Failed to verify receipt with server.");
        }
      }
    }
  }
}
```

### 5.5 Sending Receipts to PoolPay Backend

```dart
Future<bool> _verifyPurchaseOnServer(PurchaseDetails purchase) async {
  try {
    String? token = await PrefsHelper.getString(PrefsHelper.token);
    if (token == null) return false;

    http.Response response;

    if (Platform.isAndroid) {
      // Android sends purchaseToken & productId
      response = await http.post(
        Uri.parse(ApiUrl.verifyGoogleUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          "token": purchase.verificationData.serverVerificationData,
          "productId": purchase.productID,
        }),
      );
    } else if (Platform.isIOS) {
      // iOS sends receiptData, transactionId & productId
      response = await http.post(
        Uri.parse(ApiUrl.verifyAppleUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          "receiptData": purchase.verificationData.serverVerificationData,
          "transactionId": purchase.purchaseID,
          "productId": purchase.productID,
        }),
      );
    } else {
      return false;
    }

    return response.statusCode == 200 || response.statusCode == 201;
  } catch (e) {
    debugPrint("Server verification exception: $e");
    return false;
  }
}
```

### 5.6 The Mandatory Acknowledgment Step (`completePurchase`)

> [!CAUTION]
> **CRITICAL STORE POLICY REQUIREMENT:**
> After the server successfully verifies the receipt, you **MUST** execute:
>
> ```dart
> if (purchaseDetails.pendingCompletePurchase) {
>   await _iap.completePurchase(purchaseDetails);
> }
> ```
>
> If your app fails to call `completePurchase()`, Google Play considers the transaction unacknowledged and **automatically cancels the purchase and refunds the user's money after 3 days!**

### 5.7 Restoring Past Purchases (`restorePurchases`)

Both Apple and Google require a clearly visible button to restore prior purchases:

```dart
Future<void> restorePurchases() async {
  try {
    isRestoring.value = true;
    if (isIapAvailable.value) {
      await _iap.restorePurchases();
    }

    // Also trigger server-side recheck
    String? token = await PrefsHelper.getString(PrefsHelper.token);
    if (token != null) {
      await http.post(
        Uri.parse(ApiUrl.mobileMembershipSyncUrl),
        headers: {'Authorization': 'Bearer $token'},
      );
    }

    await profileController.fetchMembershipStatus();
    CustomToast.showSuccess("Success", "Purchases restored and synced!");
  } finally {
    isRestoring.value = false;
  }
}
```

---

## 6. Subscription Paywall UI (`subscription_screen.dart`)

File: [`derival81/lib/View/Screen/Subscription/view/subscription_screen.dart`](file:///c:/Users/Adnan/ZProject/adnan/derival81/derival81/lib/View/Screen/Subscription/view/subscription_screen.dart)

Key features built into the screen:

1. **Current Status Header**: Shows the user's active tier (Guest / Regular / VIP) and expiration date.
2. **Dynamic Pricing**: Uses `targetProduct.price` if available, falling back to `$5.00` or `$10.00` if store products are loading.
3. **State Management**: Automatically disables the button for the tier the user is already on.
4. **Compliance Footer**: Includes mandatory text explaining:
   - Subscription charges are billed to Apple ID / Google Play Account.
   - Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period.
   - How to manage and cancel subscriptions in device account settings.
   - Direct links to Privacy Policy and Terms of Service.

---

## 7. Store Console Setup for Mobile Developers

### 7.1 Google Play Console Setup

1. **Upload AAB**: Build and upload a release AAB to the **Internal Testing** track:
   ```bash
   flutter build appbundle --release
   ```
2. **Create Subscriptions**:
   - Go to **Monetize ➔ Products ➔ Subscriptions**.
   - Create `regular_yearly_subscription` and `vip_yearly_subscription`.
   - Add an **Auto-renewing** base plan with a **1 Year** billing period.
   - Set price and click **Activate**.

### 7.2 Apple App Store Connect Setup

1. In [App Store Connect](https://appstoreconnect.apple.com/) ➔ **My Apps** ➔ **PoolPay**.
2. Go to **Monetization ➔ Subscriptions**.
3. Create Subscription Group: `PoolPay Memberships`.
4. Create Subscriptions:
   - `regular_yearly_subscription` (Duration: 1 Year, Price: Tier 5)
   - `vip_yearly_subscription` (Duration: 1 Year, Price: Tier 10)
5. Add localized titles and descriptions.
6. Upload a screenshot of the `SubscriptionScreen` for App Store Review.

---

## 8. Testing & Sandboxing (Step-by-Step)

### 8.1 Android License Testing

1. In Google Play Console, navigate to **Settings ➔ Developer account ➔ License testing**.
2. Add your Google email address.
3. Set **License response** to `RESPOND_NORMALLY`.
4. Install the Internal Testing build on a physical Android phone signed into this Google account.
5. In the payment sheet, Google will show **"Test card, always approves"**. No real money will be charged.

### 8.2 iOS Sandbox Account Testing

1. In App Store Connect ➔ **Users and Access** ➔ **Sandbox Testers**, create a test account (e.g. `testuser@poolpay.space`).
2. On your testing iPhone:
   - Go to **Settings ➔ App Store**.
   - Scroll to the bottom to **Sandbox Account**.
   - Sign in with the tester credentials.
3. Run the app via Xcode or TestFlight. When purchasing, the store will prompt for the Sandbox Apple ID with `[Environment: Sandbox]`.

### 8.3 Accelerated Sandbox Renewal Timers

Store subscriptions renew at accelerated speeds in testing:

| Real Duration     | Google License Testing             | Apple Sandbox                      |
| ----------------- | ---------------------------------- | ---------------------------------- |
| **1 Year**        | **5 minutes**                      | **1 hour**                         |
| **1 Month**       | **5 minutes**                      | **5 minutes**                      |
| **Auto-Renewals** | Renews up to 6 times, then expires | Renews up to 6 times, then expires |

---

## 9. Troubleshooting Common Mobile IAP Errors

| Error                                                    | Root Cause                                            | Solution                                                                                                                         |
| -------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **`BillingClient: Billing unavailable`**                 | No release AAB uploaded to Play Console               | You must upload at least 1 signed build to the **Internal Testing** track in Play Console.                                       |
| **`ProductDetails list is empty`**                       | Product ID typo or Base Plan inactive                 | Check `AppCredentials.subscriptionProductIds`. Verify base plans in Play Console / Store Connect are set to **Active**.          |
| **`You already own this item`**                          | A test purchase has not been acknowledged or canceled | Call `restorePurchases()`, or in Play Console order management, cancel the test order.                                           |
| **Purchase succeeds in store but reverts on app reload** | Missing `completePurchase()` call                     | Ensure `_iap.completePurchase(purchaseDetails)` is called as soon as the server responds with 200 OK.                            |
| **Server verification fails (401 Unauthorized)**         | Missing user JWT token                                | Verify `PrefsHelper.getString(PrefsHelper.token)` is returning a valid user auth token before calling `_verifyPurchaseOnServer`. |
