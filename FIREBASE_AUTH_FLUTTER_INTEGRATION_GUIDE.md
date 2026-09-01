# 📱 Firebase Authentication Integration Guide (Flutter Mobile App)

This guide provides instructions for the Flutter mobile application developer (`derival81`) to integrate **Google Sign-In** and **Facebook Login** using **Firebase Authentication** with the PoolPay backend API.

---

## 🏗️ Architecture Flow

```
+------------------+         +--------------------------+         +--------------------------+
|                  |         |                          |         |                          |
|   Flutter App    | ------> |  Firebase Auth (Client)  | ------> |      PoolPay Backend     |
|   (derival81)    |         |     (poolpay-e80df)      |         |     (Express.js API)     |
|                  |         |                          |         |                          |
+------------------+         +--------------------------+         +--------------------------+
        |                                 |                                    |
        | 1. Trigger Google/Facebook Sign-In                                  |
        | ------------------------------->|                                    |
        |                                 |                                    |
        | 2. Returns Firebase User + idToken                                  |
        | <-------------------------------|                                    |
        |                                                                      |
        | 3. POST /api/v1/auth/firebase-login { idToken: "<FIREBASE_TOKEN>" }  |
        | -------------------------------------------------------------------->|
        |                                                                      |
        | 4. Verifies Token with Firebase Admin & returns App JWT & Profile    |
        | <--------------------------------------------------------------------|
        |                                                                      |
        | 5. Save accessToken / refreshToken & Navigate to Home                |
```

---

## 1️⃣ Firebase Console Prerequisites (Android & iOS)

* **Firebase Project ID**: `poolpay-e80df`
* **Console URL**: [https://console.firebase.google.com/project/poolpay-e80df/authentication/users](https://console.firebase.google.com/project/poolpay-e80df/authentication/users)

### Android Configuration:
1. Ensure your machine's **SHA-1** and **SHA-256** fingerprints are registered in Firebase Project Settings:
   ```bash
   cd android && ./gradlew signingReport
   ```
2. Download `google-services.json` from the Firebase console and place it at:
   `derival81/android/app/google-services.json`

### iOS Configuration:
1. Download `GoogleService-Info.plist` from Firebase Console and add it to Xcode under the `Runner` target.
2. In `ios/Runner/Info.plist`, ensure `CFBundleURLTypes` includes your `REVERSED_CLIENT_ID`.

---

## 2️⃣ Flutter Package Dependencies

Add the following to `pubspec.yaml` (if not already present):

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.11.0
  firebase_auth: ^5.4.4
  google_sign_in: ^6.2.2
  flutter_facebook_auth: ^7.1.1 # Optional if Facebook login is active
  http: ^1.2.0
```

Run `flutter pub get`.

---

## 3️⃣ Backend API Specifications

### Endpoint:
* **URL**: `POST {{BASE_URL}}/api/v1/auth/firebase-login`
  *(Aliases: `POST {{BASE_URL}}/api/v1/auth/google` and `POST {{BASE_URL}}/api/v1/auth/facebook`)*
* **Headers**: `Content-Type: application/json`

### Request Body:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
  "isDashboardLogin": false
}
```

### Response `200 OK`:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User Logged In Successfully with Firebase!",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "6740bc43f112e4521098a1b2",
      "firstName": "John",
      "lastName": "Doe",
      "fullName": "John Doe",
      "email": "john.doe@gmail.com",
      "profileImage": "https://lh3.googleusercontent.com/a/...",
      "role": "user",
      "status": "active",
      "isVerified": true,
      "authProviders": ["google", "firebase"],
      "membershipTier": "regular",
      "kycStatus": "pending"
    }
  }
}
```

---

## 4️⃣ Ready-to-Use Dart Code Implementation

### `lib/service/social_auth_service.dart`

```dart
import 'dart:convert';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:http/http.dart' as http;

class SocialAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: '242742534531-aqo3sktplktf2otg7t9vl2u7u3u7ak4e.apps.googleusercontent.com',
  );

  /// 🔹 Google Sign-In Flow
  Future<Map<String, dynamic>?> signInWithGoogle(String apiBaseUrl) async {
    try {
      // 1. Trigger Google Sign-In
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null; // User cancelled

      // 2. Obtain auth details
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // 3. Sign in to Firebase
      final UserCredential userCredential = await _auth.signInWithCredential(credential);
      final User? firebaseUser = userCredential.user;
      if (firebaseUser == null) throw Exception("Firebase user is null");

      // 4. Retrieve Firebase ID Token
      final String? idToken = await firebaseUser.getIdToken();
      if (idToken == null) throw Exception("Failed to retrieve Firebase ID Token");

      // 5. Send ID Token to PoolPay Backend
      return await _exchangeTokenWithBackend(apiBaseUrl, idToken);
    } catch (e) {
      print("Google Sign-In Error: $e");
      rethrow;
    }
  }

  /// 🔹 Facebook Login Flow
  Future<Map<String, dynamic>?> signInWithFacebook(String apiBaseUrl) async {
    try {
      // 1. Trigger Facebook Login
      final LoginResult result = await FacebookAuth.instance.login(
        permissions: ['email', 'public_profile'],
      );

      if (result.status != LoginStatus.success) {
        if (result.status == LoginStatus.cancelled) return null;
        throw Exception(result.message ?? "Facebook login failed");
      }

      // 2. Obtain Firebase Credential
      final OAuthCredential credential = FacebookAuthProvider.credential(
        result.accessToken!.tokenString,
      );

      // 3. Sign in to Firebase
      final UserCredential userCredential = await _auth.signInWithCredential(credential);
      final User? firebaseUser = userCredential.user;
      if (firebaseUser == null) throw Exception("Firebase user is null");

      // 4. Retrieve Firebase ID Token
      final String? idToken = await firebaseUser.getIdToken();
      if (idToken == null) throw Exception("Failed to retrieve Firebase ID Token");

      // 5. Send ID Token to PoolPay Backend
      return await _exchangeTokenWithBackend(apiBaseUrl, idToken);
    } catch (e) {
      print("Facebook Sign-In Error: $e");
      rethrow;
    }
  }

  /// 🔹 Backend Exchange Function
  Future<Map<String, dynamic>> _exchangeTokenWithBackend(String baseUrl, String idToken) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/v1/auth/firebase-login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'idToken': idToken,
        'isDashboardLogin': false,
      }),
    );

    final data = jsonDecode(response.body);

    if (response.statusCode == 200 && data['success'] == true) {
      return data['data']; // Contains accessToken, refreshToken, user
    } else {
      throw Exception(data['message'] ?? 'Authentication failed with backend');
    }
  }
}
```

---

## 5️⃣ Integrating into Login Controller

In your `lib/View/Screen/Auth/login/controller/login_controller.dart`:

```dart
final SocialAuthService _socialAuthService = SocialAuthService();

Future<void> loginWithGoogle() async {
  try {
    isLoading(true);
    final result = await _socialAuthService.signInWithGoogle(ApiUrl.baseUrl);
    if (result != null) {
      final accessToken = result['accessToken'];
      final refreshToken = result['refreshToken'];
      final userData = result['user'];

      // Save tokens to SharedPreferences / Secure Storage
      await saveTokens(accessToken, refreshToken);
      
      // Navigate to Home / Dashboard
      Get.offAllNamed(AppRoutes.home);
      CustomToast.showSuccess("Success", "Welcome, ${userData['firstName']}!");
    }
  } catch (error) {
    CustomToast.showError("Login Failed", error.toString());
  } finally {
    isLoading(false);
  }
}
```

---

## 6️⃣ Error Handling & Edge Cases

| Error Message | Cause | Solution |
| :--- | :--- | :--- |
| `Invalid or expired Firebase ID token` | Token expired or invalid signature. | Call `await user.getIdToken(true)` to force refresh the token before posting. |
| `Social login is currently disabled by admin.` | Admin disabled social login in settings. | Enable social login from the web admin dashboard under Settings. |
| `Your account has been blocked.` | User status is `blocked`. | Contact admin support. |
