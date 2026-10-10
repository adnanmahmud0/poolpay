import 'dart:convert';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:http/http.dart' as http;
import 'app_credentials.dart';

/// Fetches the active environment mode from the server on app launch
/// and configures Stripe accordingly.
///
/// Usage in main():
///   await AppConfigService.initialize();
///   Stripe.publishableKey = AppConfigService.stripePublishableKey;
class AppConfigService {
  AppConfigService._();

  static String _appEnvironment = 'test';
  static String _stripePublishableKey = AppCredentials.stripePublishableKeyTest;
  static String _platformName = 'PoolPay';
  static bool _initialized = false;

  /// The current environment: 'test' or 'production'
  static String get appEnvironment => _appEnvironment;

  /// The Stripe publishable key to use (server-sourced or local fallback)
  static String get stripePublishableKey => _stripePublishableKey;

  /// Platform display name
  static String get platformName => _platformName;

  /// True when running in test/sandbox mode
  static bool get isTestMode => _appEnvironment == 'test';

  /// True when running in live/production mode
  static bool get isProductionMode => _appEnvironment == 'production';

  /// Whether the service has been successfully initialized
  static bool get isInitialized => _initialized;

  /// Fetch the active config from the server.
  ///
  /// - On success: updates [appEnvironment] and [stripePublishableKey].
  /// - On network error or non-200 response: silently uses the compile-time
  ///   test key from [AppCredentials] so the app still works offline.
  static Future<void> initialize() async {
    try {
      final uri = Uri.parse('${AppCredentials.baseUrl}/api/v1/settings/config');
      final response = await http
          .get(uri, headers: {'Content-Type': 'application/json'})
          .timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body) as Map<String, dynamic>;
        final data = body['data'] as Map<String, dynamic>?;

        if (data != null) {
          final env = data['appEnvironment'] as String? ?? 'test';
          final key = data['stripePublishableKey'] as String? ?? '';
          final name = data['platformName'] as String? ?? 'PoolPay';

          _appEnvironment = env;
          _platformName = name;

          // Use server key if it looks valid, otherwise fall back to local constants
          if (key.isNotEmpty &&
              (key.startsWith('pk_test_') || key.startsWith('pk_live_'))) {
            _stripePublishableKey = key;
          } else {
            _stripePublishableKey = env == 'production'
                ? (AppCredentials.stripePublishableKeyLive.isNotEmpty
                    ? AppCredentials.stripePublishableKeyLive
                    : AppCredentials.stripePublishableKeyTest)
                : AppCredentials.stripePublishableKeyTest;
          }
        }
      }
    } catch (_) {
      // Network unavailable or server error — use safe test fallback
      _appEnvironment = 'test';
      _stripePublishableKey = AppCredentials.stripePublishableKeyTest;
    } finally {
      _initialized = true;
    }
  }

  /// Re-initialize Stripe with the current [stripePublishableKey].
  /// Call this after [initialize()] to apply the environment key.
  static Future<void> applyStripeSettings() async {
    Stripe.publishableKey = _stripePublishableKey;
    Stripe.merchantIdentifier = AppCredentials.stripeMerchantIdentifier;
    Stripe.urlScheme = AppCredentials.stripeUrlScheme;
    await Stripe.instance.applySettings();
  }
}
