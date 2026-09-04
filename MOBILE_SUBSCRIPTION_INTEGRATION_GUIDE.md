# 📱 Mobile In-App Purchase & Subscriptions Integration Guide (Flutter)

This guide documents the native **Google Play Billing** and **Apple StoreKit In-App Purchase (IAP)** subscription integration for the PoolPay mobile application (`derival81`). 

> **Notice**: Stripe web subscriptions have been completely removed. All membership subscriptions (Regular & VIP) are processed natively via **Google Play Store (Android)** and **Apple App Store (iOS)**.

---

## 🌐 API Base URLs

| Environment | Base URL |
| :--- | :--- |
| **Live Server (Production)** | `https://api.poolpay.space` |
| **Local Development** | `http://localhost:5000` *(Android Emulator: `http://10.0.2.2:5000`)* |

---

## 🏷️ Membership Tiers & Store Product IDs

| Tier | Google Play Product ID (SKU) | Apple App Store Product ID (SKU) | Default Duration |
| :--- | :--- | :--- | :--- |
| **Regular Membership** | `regular_membership` | `com.poolpay.app.regular` | 1 Year / 1 Month |
| **VIP Membership** | `vip_membership` | `com.poolpay.app.vip` | 1 Year / 1 Month |

---

## 🔄 Subscription Architecture Flow

```
+------------------+         +-------------------------------+         +--------------------------+
|                  |         |                               |         |                          |
|   Flutter App    | ------> | Google Play / Apple StoreKit  | ------> |      PoolPay Backend     |
|   (derival81)    |         |        (In-App Purchase)      |         |     (Express.js API)     |
|                  |         |                               |         |                          |
+------------------+         +-------------------------------+         +--------------------------+
        |                                   |                                    |
        | 1. User selects Regular or VIP   |                                    |
        | 2. Initiates Store Purchase       |                                    |
        | --------------------------------->|                                    |
        |                                   |                                    |
        | 3. Returns Purchase Token / Receipt                                    |
        | <---------------------------------|                                    |
        |                                                                        |
        | 4. POST /api/v1/mobile-membership/verify-google OR /verify-apple       |
        | ---------------------------------------------------------------------->|
        |                                                                        |
        | 5. Backend validates with Google/Apple Server & Activates Membership   |
        | <----------------------------------------------------------------------|
        |                                                                        |
        | 6. User upgraded to REGULAR / VIP tier in Real-Time                    |
```

---

## 📡 Backend API Endpoints

### 1️⃣ Verify Google Play Subscription (Android)
Verify and activate a subscription purchased through Google Play Billing.

* **Endpoint**: `POST /api/v1/mobile-membership/verify-google`
* **Headers**: 
  * `Content-Type: application/json`
  * `Authorization: Bearer <ACCESS_TOKEN>`
* **Request Body**:
```json
{
  "productId": "regular_membership",
  "token": "purchase_token_returned_by_google_play_billing"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Google Play subscription verified and membership tier activated successfully.",
  "data": {
    "message": "Google Play subscription verified and membership tier activated successfully.",
    "user": {
      "membershipTier": "regular",
      "subscriptionStatus": "active",
      "subscriptionExpiry": "2027-09-01T12:00:00.000Z",
      "membershipProvider": "google_play",
      "autoRenewEnabled": true
    }
  }
}
```

---

### 2️⃣ Verify Apple App Store Subscription (iOS)
Verify and activate a subscription purchased through Apple StoreKit.

* **Endpoint**: `POST /api/v1/mobile-membership/verify-apple`
* **Headers**: 
  * `Content-Type: application/json`
  * `Authorization: Bearer <ACCESS_TOKEN>`
* **Request Body**:
```json
{
  "receiptData": "MIIT/wYJKoZIhvcNAQcCoIIT8DCCE+wCAQEx..."
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Apple App Store receipt verified and membership activated successfully.",
  "data": {
    "message": "Apple App Store receipt verified and membership activated successfully.",
    "user": {
      "membershipTier": "vip",
      "subscriptionStatus": "active",
      "subscriptionExpiry": "2027-09-01T12:00:00.000Z",
      "membershipProvider": "apple_store",
      "autoRenewEnabled": true
    }
  }
}
```

---

### 3️⃣ Sync Active Subscription Status
Synchronize the local membership status on-demand directly against Google Play or App Store.

* **Endpoint**: `POST /api/v1/mobile-membership/sync`
* **Headers**: 
  * `Content-Type: application/json`
  * `Authorization: Bearer <ACCESS_TOKEN>`
* **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Mobile subscription status synced successfully.",
  "data": {
    "user": {
      "membershipTier": "regular",
      "subscriptionStatus": "active",
      "subscriptionExpiry": "2027-09-01T12:00:00.000Z",
      "membershipProvider": "google_play",
      "autoRenewEnabled": true
    }
  }
}
```

---

### 4️⃣ Get Current Membership Status
Retrieve the user's current membership status, tier, provider, and expiry date.

* **Endpoint**: `GET /api/v1/mobile-membership/status` *(Alias: `GET /api/v1/membership/status`)*
* **Headers**: 
  * `Authorization: Bearer <ACCESS_TOKEN>`
* **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Membership status retrieved successfully",
  "data": {
    "membershipTier": "regular",
    "subscriptionStatus": "active",
    "subscriptionExpiry": "2027-09-01T12:00:00.000Z",
    "membershipProvider": "google_play",
    "autoRenewEnabled": true
  }
}
```

---

## 🛠️ Flutter In-App Purchase Service Example

Install standard Flutter IAP plugin:
```yaml
dependencies:
  in_app_purchase: ^3.2.0
```

```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:in_app_purchase/in_app_purchase.dart';

class SubscriptionService {
  static const String baseUrl = 'https://api.poolpay.space/api/v1';

  /// Verify purchase with backend after InAppPurchase completes
  static Future<Map<String, dynamic>> verifyPurchase({
    required PurchaseDetails purchaseDetails,
    required String accessToken,
  }) async {
    final isAndroid = Platform.isAndroid;
    final endpoint = isAndroid
        ? '$baseUrl/mobile-membership/verify-google'
        : '$baseUrl/mobile-membership/verify-apple';

    final body = isAndroid
        ? {
            'productId': purchaseDetails.productID,
            'token': purchaseDetails.verificationData.serverVerificationData,
          }
        : {
            'receiptData': purchaseDetails.verificationData.serverVerificationData,
          };

    final response = await http.post(
      Uri.parse(endpoint),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $accessToken',
      },
      body: jsonEncode(body),
    );

    return jsonDecode(response.body);
  }

  /// Get current membership status
  static Future<Map<String, dynamic>> getStatus(String accessToken) async {
    final response = await http.get(
      Uri.parse('$baseUrl/mobile-membership/status'),
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    );
    return jsonDecode(response.body);
  }

  /// Sync subscription with stores
  static Future<Map<String, dynamic>> syncStatus(String accessToken) async {
    final response = await http.post(
      Uri.parse('$baseUrl/mobile-membership/sync'),
      headers: {
        'Authorization': 'Bearer $accessToken',
      },
    );
    return jsonDecode(response.body);
  }
}
```
