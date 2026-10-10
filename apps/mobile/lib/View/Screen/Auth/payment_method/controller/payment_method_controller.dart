import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../../helper/shared_prefe/shared_prefe.dart';
import '../../../Home/view/home_screen.dart';
import '../model/payment_method_model.dart';
import '../../../../../service/api_url.dart';
import '../../../Payment/controller/payment_controller.dart';

class PaymentMethodController extends GetxController {
  var isLoading = false.obs;
  var isSheetLoading = false.obs;
  var isConnectLoading = false.obs;
  var isStripeConnected = false.obs;
  var savedMethods = <PaymentMethodModel>[].obs;

  // Legacy text controllers kept in case bank form is needed elsewhere
  final TextEditingController routingController = TextEditingController();
  final TextEditingController accountController = TextEditingController();
  final TextEditingController accountHolderNameController =
      TextEditingController();

  @override
  void onInit() {
    super.onInit();
    fetchPaymentMethods();
    checkStripeConnectStatus();
  }

  @override
  void onClose() {
    routingController.dispose();
    accountController.dispose();
    accountHolderNameController.dispose();
    super.onClose();
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  Map<String, String> _authHeaders(String token) => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  // ── Payment Methods API ───────────────────────────────────────────────────

  Future<void> fetchPaymentMethods() async {
    try {
      isLoading.value = true;
      final token = await _getToken();
      if (token == null) return;

      final response = await http.get(
        Uri.parse(ApiUrl.paymentMethodsUrl),
        headers: _authHeaders(token),
      );

      debugPrint('[fetchPaymentMethods] status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List list = data['data'] ?? [];
        savedMethods.assignAll(
          list.map((item) => PaymentMethodModel.fromJson(item)).toList(),
        );
      }
    } catch (e) {
      debugPrint('[fetchPaymentMethods] error: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> deletePaymentMethod(String id) async {
    try {
      isLoading.value = true;
      final token = await _getToken();
      if (token == null) {
        _showErrorSnackbar('Not authenticated');
        return;
      }

      final response = await http.delete(
        Uri.parse(ApiUrl.deletePaymentMethodUrl(id)),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        final body =
            response.body.isNotEmpty ? jsonDecode(response.body) : {};
        if (response.statusCode == 204 || body['success'] == true) {
          savedMethods.removeWhere((method) => method.id == id);

          if (Get.isRegistered<PaymentController>()) {
            Get.find<PaymentController>()
                .paymentMethods
                .removeWhere((method) => method.id == id);
          }

          Get.snackbar(
            'Success',
            body['message'] ?? 'Payment method deleted successfully',
            backgroundColor: Colors.green,
            colorText: Colors.white,
          );
        } else {
          _showErrorSnackbar(
              body['message'] ?? 'Failed to delete payment method');
        }
      } else {
        final body =
            response.body.isNotEmpty ? jsonDecode(response.body) : {};
        _showErrorSnackbar(
            body['message'] ?? 'Failed to delete payment method');
      }
    } catch (e) {
      debugPrint('[deletePaymentMethod] error: $e');
      _showErrorSnackbar('Failed to delete payment method');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> setDefaultMethod(String id) async {
    try {
      final token = await _getToken();
      if (token == null) return;

      final response = await http.patch(
        Uri.parse(ApiUrl.setDefaultPaymentMethodUrl(id)),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final updated = savedMethods.map((m) {
          return m.copyWith(isDefault: m.id == id);
        }).toList();
        savedMethods.assignAll(updated);
        if (Get.isRegistered<PaymentController>()) {
          Get.find<PaymentController>().fetchPaymentMethods();
        }
        Get.snackbar(
          'Default Updated',
          'This payment method will now be used for automatic payments.',
          backgroundColor: const Color(0xFF22C55E),
          colorText: Colors.white,
          duration: const Duration(seconds: 2),
        );
      } else {
        final data = jsonDecode(response.body);
        _showErrorSnackbar(data['message'] ?? 'Failed to set default');
      }
    } catch (e) {
      debugPrint('[setDefaultMethod] error: $e');
      _showErrorSnackbar('Network error. Please try again.');
    }
  }

  // ── Stripe Payment Sheet ──────────────────────────────────────────────────

  /// Opens Stripe's native Payment Sheet so the user can add any card or
  /// payment method. Stripe tokenises the card — no card data ever touches
  /// your server or app code. After the user saves, we register the resulting
  /// paymentMethodId with our backend.
  Future<void> openStripePaymentSheet() async {
    if (isSheetLoading.value) return;
    try {
      isSheetLoading.value = true;

      final token = await _getToken();
      if (token == null) {
        _showErrorSnackbar('Not authenticated. Please log in again.');
        return;
      }

      // Step 1: Create SetupIntent (allows saving without charging)
      final siResponse = await http.post(
        Uri.parse(ApiUrl.createSetupIntentUrl),
        headers: _authHeaders(token),
      );

      debugPrint(
          '[openStripePaymentSheet] setupIntent status: ${siResponse.statusCode}');

      if (siResponse.statusCode != 200 && siResponse.statusCode != 201) {
        _showErrorSnackbar('Failed to initialise payment setup. Try again.');
        return;
      }

      final siData = jsonDecode(siResponse.body);
      final String? clientSecret =
          siData['data']?['clientSecret'] ?? siData['clientSecret'];
      final String? setupIntentId =
          siData['data']?['setupIntentId'] ?? siData['setupIntentId'];

      if (clientSecret == null) {
        _showErrorSnackbar('Invalid setup response from server.');
        return;
      }

      // Step 2: Create Ephemeral Key (lets Payment Sheet show saved cards)
      String? customerId;
      String? ephemeralKeySecret;

      try {
        final ekResponse = await http.post(
          Uri.parse(ApiUrl.createEphemeralKeyUrl),
          headers: _authHeaders(token),
        );
        if (ekResponse.statusCode == 200) {
          final ekData = jsonDecode(ekResponse.body);
          customerId =
              ekData['data']?['customerId']?.toString();
          ephemeralKeySecret =
              ekData['data']?['ephemeralKeySecret']?.toString();
        }
      } catch (e) {
        debugPrint('[openStripePaymentSheet] ephemeral key fetch failed: $e');
        // Non-fatal — Payment Sheet still works without ephemeral key
      }

      // Step 3: Get user's display name
      final email = await _getUserEmail();

      // Step 4: Initialise Payment Sheet (supports all 21 payment methods)
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          setupIntentClientSecret: clientSecret,
          merchantDisplayName: 'PoolPay',
          customerId: customerId,
          customerEphemeralKeySecret: ephemeralKeySecret,
          returnURL: 'poolpay://stripe-redirect',
          allowsDelayedPaymentMethods: true,
          billingDetails: BillingDetails(email: email),
          style: ThemeMode.light,
          // Enable Google Pay on Android and Apple Pay on iOS only if merchantIdentifier is configured
          googlePay: Platform.isAndroid
              ? const PaymentSheetGooglePay(
                  merchantCountryCode: 'US',
                  currencyCode: 'USD',
                  testEnv: true, // set false in production
                )
              : null,
          applePay: (Platform.isIOS &&
                  Stripe.merchantIdentifier != null &&
                  Stripe.merchantIdentifier!.isNotEmpty)
              ? const PaymentSheetApplePay(
                  merchantCountryCode: 'US',
                )
              : null,
          appearance: const PaymentSheetAppearance(
            colors: PaymentSheetAppearanceColors(
              primary: Color(0xFF1A227F),
            ),
            shapes: PaymentSheetShape(
              borderRadius: 12,
            ),
          ),
        ),
      );

      // Step 5: Present the sheet — user adds their payment method
      await Stripe.instance.presentPaymentSheet();

      // Step 6: Sheet succeeded — call backend to sync the confirmed payment method
      // The SetupIntent is now confirmed on Stripe's side. We ask our backend to
      // retrieve it, extract the paymentMethodId, and register it in the database.
      if (setupIntentId == null) {
        // Fallback: no setupIntentId — just refresh the list
        await fetchPaymentMethods();
        Get.snackbar(
          'Payment Method Added',
          'Your payment method has been saved.',
          backgroundColor: Colors.green,
          colorText: Colors.white,
        );
        return;
      }

      debugPrint('[openStripePaymentSheet] syncing setupIntentId: $setupIntentId');

      final syncResponse = await http.post(
        Uri.parse(ApiUrl.syncSetupIntentUrl),
        headers: _authHeaders(token),
        body: jsonEncode({'setupIntentId': setupIntentId}),
      );

      debugPrint('[openStripePaymentSheet] sync status: ${syncResponse.statusCode}');
      debugPrint('[openStripePaymentSheet] sync body: ${syncResponse.body}');

      if (syncResponse.statusCode == 200 || syncResponse.statusCode == 201) {
        await fetchPaymentMethods();
        if (Get.isRegistered<PaymentController>()) {
          Get.find<PaymentController>().fetchPaymentMethods();
        }
        Get.snackbar(
          'Payment Method Added',
          'Your payment method has been saved successfully.',
          backgroundColor: Colors.green,
          colorText: Colors.white,
        );
      } else {
        final data = jsonDecode(syncResponse.body);
        _showErrorSnackbar(data['message'] ?? 'Failed to save payment method. Try again.');
        // Still refresh — the method may have been saved
        await fetchPaymentMethods();
      }

    } on StripeException catch (e) {
      // User cancelled — silent dismiss
      if (e.error.code == FailureCode.Canceled) {
        debugPrint('[openStripePaymentSheet] user cancelled');
        return;
      }
      debugPrint('[openStripePaymentSheet] StripeException: ${e.error.message}');
      _showErrorSnackbar(e.error.localizedMessage ?? 'Payment setup failed.');
    } catch (e) {
      debugPrint('[openStripePaymentSheet] error: $e');
      _showErrorSnackbar('Something went wrong. Please try again.');
    } finally {
      isSheetLoading.value = false;
    }
  }

  Future<String?> _getUserEmail() async {
    final userData = await PrefsHelper.getString(PrefsHelper.userData);
    if (userData != null) {
      try {
        final user = jsonDecode(userData);
        return user['email'] as String?;
      } catch (_) {}
    }
    return null;
  }

  // ── Stripe Connect (Payouts) ──────────────────────────────────────────────

  Future<void> checkStripeConnectStatus() async {
    try {
      final token = await _getToken();
      if (token == null) return;

      final response = await http.get(
        Uri.parse(ApiUrl.stripeConnectStatusUrl),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        isStripeConnected.value =
            data['data']?['connected'] == true || data['connected'] == true;
      }
    } catch (e) {
      debugPrint('[checkStripeConnectStatus] error: $e');
    }
  }

  Future<void> startStripeOnboarding() async {
    try {
      isConnectLoading.value = true;
      final token = await _getToken();
      if (token == null) {
        _showErrorSnackbar('Not authenticated');
        return;
      }

      final response = await http.post(
        Uri.parse(ApiUrl.stripeConnectAccountLinkUrl),
        headers: _authHeaders(token),
        body: jsonEncode({
          "returnUrl": "poolpay://stripe-connect/return",
          "refreshUrl": "poolpay://stripe-connect/refresh"
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final String? link = data['data'] is String
            ? data['data']
            : data['data']?['url'] ?? data['url'];

        if (link != null && link.isNotEmpty) {
          await _launchURL(link);
        } else {
          _showErrorSnackbar('Invalid onboarding URL received');
        }
      } else {
        final data = jsonDecode(response.body);
        _showErrorSnackbar(data['message'] ?? 'Failed to start onboarding');
      }
    } catch (e) {
      debugPrint('[startStripeOnboarding] error: $e');
      _showErrorSnackbar('Failed to start Stripe onboarding');
    } finally {
      isConnectLoading.value = false;
    }
  }

  Future<void> accessPayoutDashboard() async {
    try {
      isConnectLoading.value = true;
      final token = await _getToken();
      if (token == null) {
        _showErrorSnackbar('Not authenticated');
        return;
      }

      final response = await http.get(
        Uri.parse(ApiUrl.stripeConnectLoginLinkUrl),
        headers: _authHeaders(token),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final String? link = data['data'] is String
            ? data['data']
            : data['data']?['url'] ?? data['url'];

        if (link != null && link.isNotEmpty) {
          await _launchURL(link);
        } else {
          _showErrorSnackbar('Invalid dashboard URL received');
        }
      } else {
        final data = jsonDecode(response.body);
        _showErrorSnackbar(data['message'] ?? 'Failed to open dashboard');
      }
    } catch (e) {
      debugPrint('[accessPayoutDashboard] error: $e');
      _showErrorSnackbar('Failed to open payout dashboard');
    } finally {
      isConnectLoading.value = false;
    }
  }

  Future<void> _launchURL(String urlString) async {
    final Uri url = Uri.parse(urlString);
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } else {
      _showErrorSnackbar('Could not open link');
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  void skipForNow() {
    Get.offAll(() => HomeScreen());
  }

  void continueToDashboard() {
    Get.offAll(() => HomeScreen());
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  void _showErrorSnackbar(String message) {
    Get.snackbar(
      'Error',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.redAccent,
      colorText: Colors.white,
    );
  }
}
