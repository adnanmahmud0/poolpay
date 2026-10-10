# 📱 PoolPay Mobile App Authentication & Session Integration Guide (Flutter)

This guide documents the complete Authentication API and Session Management integration for the **PoolPay Flutter Mobile App (`derival81`)**.

> **Important Updates**:
>
> 1. Social login (Google / Facebook) and Stripe subscriptions have been removed.
> 2. Direct **Email / Phone Number + Password with OTP Verification** is the authentication standard.
> 3. **Auto-Logout on App Close** & **Auto-Logout after Inactivity (20 Minutes default / dynamic from Admin Panel)** are detailed below with complete Flutter implementations.

---

## 🌐 API Base URLs

| Environment           | Base URL                                                             |
| :-------------------- | :------------------------------------------------------------------- |
| **Live Server**       | `https://adnan5000.binarybards.online`                               |
| **Local Development** | `http://localhost:5000` _(Android Emulator: `http://10.0.2.2:5000`)_ |
| **Production**        | `https://api.poolpay.space`                                          |

---

## 🔐 Authentication Endpoints

### 1️⃣ User Registration

Register a new account with email, phone number, name, and password.

- **Endpoint**: `POST /api/v1/auth/register`
- **Headers**: `Content-Type: application/json`
- **Request Body**:

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

- **Response (201 Created)**:

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

- **Endpoint**: `POST /api/v1/auth/verify-email`
- **Headers**: `Content-Type: application/json`
- **Request Body**:

```json
{
  "identifier": "john.doe@example.com",
  "code": "123456"
}
```

- **Response (200 OK)**:

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

- **Endpoint**: `POST /api/v1/auth/resend-verification-code`
- **Headers**: `Content-Type: application/json`
- **Request Body**:

```json
{
  "identifier": "john.doe@example.com"
}
```

---

### 4️⃣ User Login (Includes Session Timeout)

Login using Email OR Phone Number with Password. The server returns the active JWT tokens plus `sessionTimeoutMinutes` (configured by the Admin).

- **Endpoint**: `POST /api/v1/auth/login`
- **Headers**: `Content-Type: application/json`
- **Request Body**:

```json
{
  "identifier": "john.doe@example.com",
  "password": "Password123!"
}
```

_(Or with phone: `{"identifier": "+1234567890", "password": "Password123!"}`)_

- **Response (200 OK - Direct Login)**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User Logged In Successfully!",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "sessionTimeoutMinutes": 20,
    "requires2FA": false,
    "user": {
      "_id": "66d3a...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1234567890",
      "role": "user",
      "status": "active",
      "membershipTier": "regular",
      "isVerified": true
    }
  }
}
```

- **Response (200 OK - When 2FA is Enabled on Account)**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "2FA code sent to your email and phone number",
  "data": {
    "requires2FA": true,
    "email": "john.doe@example.com",
    "phone": "+1234567890"
  }
}
```

---

### 5️⃣ Verify 2FA (If Enabled)

- **Endpoint**: `POST /api/v1/auth/verify-2fa`
- **Headers**: `Content-Type: application/json`
- **Request Body**:

```json
{
  "identifier": "john.doe@example.com",
  "code": "123456"
}
```

- **Response (200 OK)**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "User Logged In Successfully!",
  "data": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi...",
    "sessionTimeoutMinutes": 20,
    "user": { ... }
  }
}
```

---

### 6️⃣ Fetch System Auth & Session Policies

Mobile apps can fetch global authentication policies and the session timeout on app launch.

- **Endpoint**: `GET /api/v1/settings/auth-status`
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Response (200 OK)**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Settings retrieved successfully",
  "data": {
    "platformName": "PoolPay",
    "isTwoFactorAuthenticationEnabled": true,
    "supportEmail": "support@poolpay.space",
    "sessionTimeoutMinutes": 20
  }
}
```

---

### 7️⃣ Refresh Access Token

Refresh an expiring access token while the user is actively using the app.

- **Endpoint**: `POST /api/v1/auth/refresh-token`
- **Headers**: `Content-Type: application/json`
- **Request Body**:

```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

- **Response (200 OK)**:

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

## ⏱️ Auto-Logout Implementation in Flutter

To satisfy the requirements:

1. **Auto-logout when the user closes the app**
2. **Auto-logout after 20 minutes (or dynamic minutes from Admin Panel) of inactivity**

Here is the production-ready implementation:

### 1. Inactivity Watcher (`session_inactivity_watcher.dart`)

Wrap your top-level `MaterialApp` widget with this widget. Every tap, scroll, or swipe resets the timer. If 20 minutes pass without interaction, it automatically logs out the user.

```dart
import 'dart:async';
import 'package:flutter/material.dart';

class SessionInactivityWatcher extends StatefulWidget {
  final Widget child;
  final int timeoutMinutes;
  final VoidCallback onTimeout;

  const SessionInactivityWatcher({
    Key? key,
    required this.child,
    this.timeoutMinutes = 20, // Configured via backend / Admin Panel
    required this.onTimeout,
  }) : super(key: key);

  @override
  State<SessionInactivityWatcher> createState() =>
      _SessionInactivityWatcherState();
}

class _SessionInactivityWatcherState extends State<SessionInactivityWatcher> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer(Duration(minutes: widget.timeoutMinutes), () {
      widget.onTimeout();
    });
  }

  void _handleUserInteraction([_]) {
    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: _handleUserInteraction,
      onPointerMove: _handleUserInteraction,
      onPointerUp: _handleUserInteraction,
      child: widget.child,
    );
  }
}
```

---

### 2. Auto-Logout on App Close (`app_lifecycle_manager.dart`)

To ensure the app logs out when closed, **tokens must not persist across app kills**. Store tokens in an in-memory session or clear them when the app is detached/closed:

```dart
import 'package:flutter/material.dart';

class AppLifecycleManager extends StatefulWidget {
  final Widget child;
  final VoidCallback onAppClosed;

  const AppLifecycleManager({
    Key? key,
    required this.child,
    required this.onAppClosed,
  }) : super(key: key);

  @override
  State<AppLifecycleManager> createState() => _AppLifecycleManagerState();
}

class _AppLifecycleManagerState extends State<AppLifecycleManager>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    // When the user exits / kills the app
    if (state == AppLifecycleState.detached) {
      widget.onAppClosed();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
```

---

### 3. Integrating in `main.dart`

```dart
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final GlobalKey<NavigatorState> _navigatorKey = GlobalKey<NavigatorState>();
  int _sessionTimeoutMinutes = 20; // Updated from login response

  void _logout(String reason) {
    // 1. Clear in-memory / local token data
    AuthSession.clear();

    // 2. Redirect to Login Screen
    _navigatorKey.currentState?.pushNamedAndRemoveUntil(
      '/login',
      (route) => false,
    );

    ScaffoldMessenger.of(_navigatorKey.currentContext!).showSnackBar(
      SnackBar(content: Text(reason)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AppLifecycleManager(
      onAppClosed: () => _logout('App closed'),
      child: SessionInactivityWatcher(
        timeoutMinutes: _sessionTimeoutMinutes,
        onTimeout: () => _logout('Session expired due to 20 minutes of inactivity'),
        child: MaterialApp(
          navigatorKey: _navigatorKey,
          title: 'PoolPay',
          initialRoute: '/login',
          routes: {
            '/login': (context) => const LoginScreen(),
            '/home': (context) => const HomeScreen(),
          },
        ),
      ),
    );
  }
}

/// Simple In-Memory Session Storage (Ensures no auto-login after app kill)
class AuthSession {
  static String? accessToken;
  static String? refreshToken;
  static Map<String, dynamic>? currentUser;

  static bool get isLoggedIn => accessToken != null;

  static void setSession({
    required String access,
    required String refresh,
    required Map<String, dynamic> user,
  }) {
    accessToken = access;
    refreshToken = refresh;
    currentUser = user;
  }

  static void clear() {
    accessToken = null;
    refreshToken = null;
    currentUser = null;
  }
}
```
