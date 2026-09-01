# 📱 PoolPay Mobile App Authentication Integration Guide (Flutter)

This guide documents the complete Authentication API integration for the **PoolPay Flutter Mobile App (`derival81`)**. 

Social login (Google / Facebook) has been completely removed in favor of secure, direct **Email / Phone Number + Password with OTP Verification**.

---

## 🌐 API Base URLs

| Environment | Base URL |
| :--- | :--- |
| **Live Server** | `https://adnan5000.binarybards.online` |
| **Local Development** | `http://localhost:5000` *(Android Emulator: `http://10.0.2.2:5000`)* |
| **Production** | `https://api.poolpay.space` |

---

## 🔐 Authentication Endpoints

### 1️⃣ User Registration
Register a new account with email, phone number, name, and password.

* **Endpoint**: `POST /api/v1/auth/register`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "password": "Password123!",
  "agreeToTerms": true,
  "agreeToForfeitOnRemoval": true,
  "agreeToSms": true
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful. Please verify your account with the code sent to your email and phone number.",
  "data": {
    "identifier": "john.doe@example.com",
    "verificationRequired": true,
    "user": {
      "_id": "66d3a...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "role": "user",
      "status": "pending",
      "isVerified": false
    }
  }
}
```

---

### 2️⃣ Account Verification (OTP)
Verify account using the 6-digit code sent via email/SMS.

* **Endpoint**: `POST /api/v1/auth/verify-email`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "identifier": "john.doe@example.com",
  "code": "123456"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Account verified successfully! You can now log in.",
  "data": null
}
```

---

### 3️⃣ Resend Verification Code
Resend OTP if expired or not received.

* **Endpoint**: `POST /api/v1/auth/resend-verification-code`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "identifier": "john.doe@example.com"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Verification code resent successfully to your email and phone number.",
  "data": null
}
```

---

### 4️⃣ User Login
Login using Email OR Phone Number with Password.

* **Endpoint**: `POST /api/v1/auth/login`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "identifier": "john.doe@example.com",
  "password": "Password123!"
}
```
*(Or with phone number: `{"identifier": "+1234567890", "password": "Password123!"}`)*

* **Response (200 OK - Direct Login)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User Logged In Successfully!",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "requires2FA": false,
    "user": {
      "_id": "66d3a...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "role": "user",
      "status": "active",
      "isVerified": true
    }
  }
}
```

* **Response (200 OK - When 2FA is Enabled on Account)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "2FA verification code sent to your email and phone number",
  "data": {
    "requires2FA": true,
    "twoFactorToken": "temp_token_for_verification"
  }
}
```

---

### 5️⃣ Verify 2FA (If Enabled)
* **Endpoint**: `POST /api/v1/auth/verify-2fa`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "twoFactorToken": "temp_token_for_verification",
  "code": "123456"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "2FA verification successful!",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "user": { ... }
  }
}
```

---

### 6️⃣ Refresh Access Token
Refresh an expired access token using the refresh token.

* **Endpoint**: `POST /api/v1/auth/refresh-token`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Access token generated successfully",
  "data": {
    "accessToken": "eyJhbGciOi..."
  }
}
```

---

### 7️⃣ Forgot Password (Request OTP)
* **Endpoint**: `POST /api/v1/auth/forgot-password`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "identifier": "john.doe@example.com"
}
```

---

### 8️⃣ Reset Password (Submit OTP & New Password)
* **Endpoint**: `POST /api/v1/auth/reset-password`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
```json
{
  "identifier": "john.doe@example.com",
  "code": "123456",
  "newPassword": "NewPassword123!"
}
```

---

### 9️⃣ Change Password (Authenticated User)
* **Endpoint**: `POST /api/v1/auth/change-password`
* **Headers**: 
  * `Content-Type: application/json`
  * `Authorization: Bearer <ACCESS_TOKEN>`
* **Request Body**:
```json
{
  "oldPassword": "Password123!",
  "newPassword": "NewPassword123!"
}
```

---

## 🛠️ Flutter Dart Service Example

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseUrl = 'https://adnan5000.binarybards.online/api/v1';

  // 1. Register
  static Future<Map<String, dynamic>> register({
    required String firstName,
    required String lastName,
    required String email,
    required String phone,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'phone': phone,
        'password': password,
        'agreeToTerms': true,
        'agreeToForfeitOnRemoval': true,
        'agreeToSms': true,
      }),
    );
    return jsonDecode(response.body);
  }

  // 2. Verify OTP
  static Future<Map<String, dynamic>> verifyEmail({
    required String identifier,
    required String code,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/verify-email'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier,
        'code': code,
      }),
    );
    return jsonDecode(response.body);
  }

  // 3. Login
  static Future<Map<String, dynamic>> login({
    required String identifier,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'identifier': identifier,
        'password': password,
      }),
    );
    return jsonDecode(response.body);
  }

  // 4. Refresh Token
  static Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/refresh-token'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'refreshToken': refreshToken}),
    );
    return jsonDecode(response.body);
  }
}
```
