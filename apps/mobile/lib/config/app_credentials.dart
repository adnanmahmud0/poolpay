/// Centralized Secure Credentials & Environment Configuration for PoolPay / Derival81.
///
/// Functions identically to a .env configuration in Dart, providing unified,
/// type-safe access to API endpoints, Stripe credentials, In-App Purchase product IDs,
/// Google Play Billing keys, Apple StoreKit identifiers, and Firebase configs.
///
/// Supports optional compile-time overrides via `--dart-define`
/// (e.g. `flutter run --dart-define=IS_PRODUCTION=true --dart-define=STRIPE_PUBLISHABLE_KEY=pk_live_...`).
class AppCredentials {
  AppCredentials._();

  // ==========================================
  // 1. ENVIRONMENT MODE
  // ==========================================
  static const bool isProduction = bool.fromEnvironment(
    'IS_PRODUCTION',
    defaultValue: false,
  );

  static const String appName = 'PoolPay';
  static const String appVersion = '1.0.0';

  // ==========================================
  // 2. BACKEND API & SOCKET SERVER
  // ==========================================
  /// Primary backend domain used across REST API and WebSocket connections
  static const String defaultServerUrl = 'https://api.poolpay.space';

  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: defaultServerUrl,
  );

  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: defaultServerUrl,
  );

  // ==========================================
  // 3. STRIPE PAYMENT GATEWAY (One-Time Group Payments & Payouts)
  // Note: Memberships use native In-App Purchases (Section 4), NOT Stripe.
  // ==========================================

  /// === TEST / SANDBOX keys ===
  /// Used when the server reports appEnvironment = 'test'.
  static const String stripePublishableKeyTest =
      'pk_test_51TYsUAJHb7pfiK7aYC88nXq73lLofUXlsRpF2vrAHBxw8NhJ5kdcWGdHYtLyUXKDj3IxT53ENl95CSDlOVwVWk0i004X1mt2nS';

  /// === PRODUCTION / LIVE keys ===
  /// Active production publishable key from Stripe dashboard.
  static const String stripePublishableKeyLive =
      'pk_live_51TYsTqJNT8rnr6WMVMHvhjPD7GxSCktdRXmqBAtDXP3TeI8WgApmRf3j13TQHsYSEdcxqLgSn1ah8ApeGNcEST3z00AOPuvWGE';

  /// Client-side Stripe publishable key — compile-time override or test fallback.
  /// At runtime, AppConfigService replaces this with the server-fetched key.
  static const String stripePublishableKey = String.fromEnvironment(
    'STRIPE_PUBLISHABLE_KEY',
    defaultValue: stripePublishableKeyTest,
  );

  /// Apple Pay / Google Pay Merchant Identifier registered in Stripe
  static const String stripeMerchantIdentifier = String.fromEnvironment(
    'STRIPE_MERCHANT_ID',
    defaultValue: 'merchant.space.poolpay',
  );

  /// Deep link URL scheme used for Stripe 3D Secure redirects
  static const String stripeUrlScheme = String.fromEnvironment(
    'STRIPE_URL_SCHEME',
    defaultValue: 'poolpay',
  );

  // ==========================================
  // 4. IN-APP PURCHASES & SUBSCRIPTIONS (Apple StoreKit & Google Play)
  // Cross-platform Subscription Product IDs (configured in App Store Connect & Play Console)
  // ==========================================
  static const String regularSubscriptionId = 'regular_yearly_subscription';
  static const String vipSubscriptionId = 'vip_yearly_subscription';

  /// Complete set of active subscription product IDs across iOS and Android
  static const Set<String> subscriptionProductIds = {
    regularSubscriptionId,
    vipSubscriptionId,
  };

  /// Backwards-compatible aliases for Apple & Google specific references
  static const String appleRegularSubscriptionId = regularSubscriptionId;
  static const String appleVipSubscriptionId = vipSubscriptionId;
  static const String googleRegularSubscriptionId = regularSubscriptionId;
  static const String googleVipSubscriptionId = vipSubscriptionId;

  // ==========================================
  // 5. FIREBASE & CLOUD MESSAGING
  // ==========================================
  static const String firebaseProjectId = 'poolpay-e80df';
  static const String firebaseStorageBucket = 'poolpay-e80df.appspot.com';

  // ==========================================
  // 6. CUSTOMER SUPPORT & CONTACT CHANNELS
  // ==========================================
  static const String supportEmail = 'support@poolpay.space';
  static const String supportPhone = '+16079004569';
  static const String supportWhatsapp = '+16079004569';
}
