import 'dart:async';
import 'dart:convert';
import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../View/Screen/Profile/controller/profile_controller.dart';
import '../View/Screen/Auth/payment_method/controller/payment_method_controller.dart';
import '../View/Screen/Auth/complete_profile/view/complete_profile_screen.dart';
import '../helper/shared_prefe/shared_prefe.dart';
import '../View/Screen/Home/view/home_screen.dart';
import '../Utils/ToastMessage/custom_toast.dart';
import 'api_url.dart';
import 'notification_service.dart';
import 'session_inactivity_watcher.dart';

class DeepLinkService extends GetxService {
  late AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;

  Future<DeepLinkService> init() async {
    _appLinks = AppLinks();
    _handleIncomingLinks();
    return this;
  }

  void _handleIncomingLinks() {
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      _processLink(uri);
    }, onError: (err) {
      print('Deep Link Error: $err');
    });
  }

  void _processLink(Uri uri) {
    print('Processing Deep Link: $uri');
    
    // Check for stripe-connect/return or stripe-connect/refresh
    if (uri.scheme == 'poolpay' && uri.host == 'stripe-connect') {
      if (uri.path.contains('return')) {
        _onStripeReturn(success: true);
      } else if (uri.path.contains('refresh')) {
        _onStripeReturn(success: false);
      }
    } else if (uri.scheme == 'poolpay' && (uri.host == 'callback' || uri.host == 'auth')) {
      _handleAuthLink(uri);
    }
  }

  Future<void> _handleAuthLink(Uri uri) async {
    final accessToken = uri.queryParameters['accessToken'];
    final refreshToken = uri.queryParameters['refreshToken'];

    if (accessToken != null && refreshToken != null) {
      await PrefsHelper.setString(PrefsHelper.token, accessToken);
      await PrefsHelper.setString(PrefsHelper.refreshToken, refreshToken);
      
      // Fetch user profile using the new accessToken to save userData and userId
      bool isUpdatedProfile = true;
      try {
        final profileResponse = await http.get(
          Uri.parse(ApiUrl.getProfileUrl),
          headers: {
            'Authorization': 'Bearer $accessToken',
            'Content-Type': 'application/json',
          },
        );

        if (profileResponse.statusCode == 200 || profileResponse.statusCode == 201) {
          final data = jsonDecode(profileResponse.body);
          final userObj = data['data'];
          if (userObj != null) {
            await PrefsHelper.setString(PrefsHelper.userData, jsonEncode(userObj));
            if (userObj['_id'] != null) {
              await PrefsHelper.setString(PrefsHelper.userId, userObj['_id'].toString());
            }
            if (userObj['isUpdatedProfile'] != null) {
              isUpdatedProfile = userObj['isUpdatedProfile'] == true;
            }
          }
        }
      } catch (e) {
        print("Error fetching profile after deep link: $e");
      }

      // Update FCM Token after login
      try {
        final notificationService = Get.find<NotificationService>();
        notificationService.init(); // Re-initialize to get token and send to backend
      } catch (e) {
        print("Error updating FCM token: $e");
      }

      SessionInactivityWatcher.start();
      CustomToast.showSuccess("Success", "Authentication successful!");
      
      // Navigate to Home or Complete Profile screen based on profile status
      if (!isUpdatedProfile) {
        Get.offAll(() => CompleteProfileScreen());
      } else {
        Get.offAll(() => HomeScreen());
      }
    } else {
      CustomToast.showError("Error", "Authentication failed. Tokens missing.");
    }
  }

  void _onStripeReturn({required bool success}) {
    if (success) {
      Get.snackbar(
        'Processing',
        'Verifying your Stripe account status...',
        snackPosition: SnackPosition.BOTTOM,
        duration: const Duration(seconds: 3),
      );

      // Refresh status in controllers if they are active
      if (Get.isRegistered<ProfileController>()) {
        final profileController = Get.find<ProfileController>();
        profileController.fetchStripeStatus();
        profileController.getProfile();
      }
      
      if (Get.isRegistered<PaymentMethodController>()) {
        Get.find<PaymentMethodController>().checkStripeConnectStatus();
      }
    } else {
      Get.snackbar(
        'Onboarding Incomplete',
        'Please complete the onboarding to receive payouts.',
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.orange,
        colorText: Colors.white,
      );
    }
  }

  @override
  void onClose() {
    _linkSubscription?.cancel();
    super.onClose();
  }
}
