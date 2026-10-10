import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';
import '../../../../helper/shared_prefe/shared_prefe.dart';
import '../../../../../service/api_url.dart';

import '../../Auth/login/view/login_screen.dart';
import '../../Auth/login/controller/login_controller.dart';
import '../../../../service/api/token_service.dart';
import '../../../../service/session_inactivity_watcher.dart';
import '../../../../../Utils/ToastMessage/custom_toast.dart';

class ProfileController extends GetxController {
  final userName = ''.obs;
  final userEmail = ''.obs;
  final userPhone = '+16079004569'.obs;
  final profileImage = ''.obs;
  final twoFactorEnabled = false.obs;
  final appVersion = '1.0.6'.obs;
  final linkedPaymentMethodsCount = 0.obs;
  final isLoading = false.obs;
  final isStripeConnected = false.obs;
  final isConnectLoading = false.obs;
  final membershipTier = 'GUEST'.obs;
  final membershipProvider = ''.obs;
  final subscriptionStatus = ''.obs;
  final subscriptionExpiry = ''.obs;
  final totalActiveGroups = 0.obs;
  final autoRenewEnabled = false.obs;

  // Support & Contact Channels
  final supportEmail = 'support@poolpay.space'.obs;
  final supportPhone = '+16079004569'.obs;
  final supportWhatsapp = '+16079004569'.obs;

  @override
  void onInit() {
    super.onInit();
    getProfile();
    fetchContactSettings();
    fetchPaymentMethodsCount();
    fetchStripeStatus();
    fetchMembershipStatus();
  }

  Future<void> fetchPaymentMethodsCount() async {
    try {
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null) return;

      final response = await http.get(
        Uri.parse(ApiUrl.paymentMethodsUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List list = data['data'] ?? [];
        linkedPaymentMethodsCount.value = list.length;
      }
    } catch (e) {
      print("Error fetching payment methods count: $e");
    }
  }

  Future<void> getProfile() async {
    try {
      isLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);

      if (token == null) {
        print("No access token found");
        return;
      }

      var response = await http.get(
        Uri.parse(ApiUrl.getProfileUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        var data = jsonDecode(response.body);
        var userData = data['data'];
        
        if (userData != null) {
          String fName = userData['firstName'] ?? '';
          String lName = userData['lastName'] ?? '';
          userName.value = "$fName $lName".trim();
          userEmail.value = userData['email'] ?? '';
          userPhone.value = (userData['phone'] != null && userData['phone'].toString().isNotEmpty)
              ? userData['phone']
              : '+16079004569';
          profileImage.value = userData['profileImage'] ?? '';
          twoFactorEnabled.value = userData['twoFactorEnabled'] ?? false;
          membershipTier.value = (userData['membershipTier'] ?? 'GUEST').toString().toUpperCase();
          totalActiveGroups.value = userData['totalActiveGroups'] ?? 0;
        }
      } else {
        print("Failed to fetch profile: ${response.statusCode} - ${response.body}");
      }
    } catch (e) {
      print("Error fetching profile: $e");
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchMembershipStatus() async {
    try {
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null) return;

      var response = await http.get(
        Uri.parse(ApiUrl.mobileMembershipStatusUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode != 200) {
        // Fallback to legacy membership status URL
        response = await http.get(
          Uri.parse(ApiUrl.membershipStatusUrl),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        );
      }

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final statusData = data['data'] ?? data;
        if (statusData != null && statusData is Map) {
          membershipTier.value = (statusData['membershipTier'] ?? 'GUEST').toString().toUpperCase();
          membershipProvider.value = (statusData['membershipProvider'] ?? '').toString();
          subscriptionStatus.value = (statusData['subscriptionStatus'] ?? '').toString();
          subscriptionExpiry.value = (statusData['subscriptionExpiry'] ?? '').toString();
          autoRenewEnabled.value = statusData['autoRenewEnabled'] ?? false;
        }
      }
    } catch (e) {
      debugPrint("Error fetching membership status: $e");
    }
  }

  void logout() {
    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Logout',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Are you sure you want to logout?',
                style: TextStyle(
                  fontSize: 15,
                  color: Color(0xFF64748B),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () async {
                        await PrefsHelper.clear();
                        await TokenService.clearTokens();
                        SessionInactivityWatcher.stop();
                        Get.delete<LoginController>(force: true);
                        Get.offAll(() =>  LoginScreen());
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE50914),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Logout',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Get.back(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE2E8F0),
                        foregroundColor: const Color(0xFF0F172A),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  // --- Stripe Connect (Payouts) ---

  Future<void> fetchStripeStatus() async {
    try {
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null) return;

      final response = await http.get(
        Uri.parse(ApiUrl.stripeConnectStatusUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        isStripeConnected.value = data['data']?['connected'] == true ||
            data['connected'] == true;
      }
    } catch (e) {
      debugPrint("Error fetching stripe status: $e");
    }
  }

  Future<void> startStripeOnboarding() async {
    try {
      isConnectLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null) return;

      final response = await http.post(
        Uri.parse(ApiUrl.stripeConnectAccountLinkUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          "returnUrl": "poolpay://stripe-connect/return",
          "refreshUrl": "poolpay://stripe-connect/refresh",
          "business_type": "individual"
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final String? link = data['data'] is String
            ? data['data']
            : data['data']?['url'] ?? data['url'];

        if (link != null && link.isNotEmpty) {
          final Uri url = Uri.parse(link);
          if (await canLaunchUrl(url)) {
            await launchUrl(url, mode: LaunchMode.externalApplication);
          } else {
            _showErrorSnackbar('Could not open link');
          }
        }
      } else {
        final data = jsonDecode(response.body);
        _showErrorSnackbar(data['message'] ?? 'Failed to start onboarding');
      }
    } catch (e) {
      _showErrorSnackbar('Failed to start Stripe onboarding');
    } finally {
      isConnectLoading.value = false;
    }
  }

  Future<void> accessPayoutDashboard() async {
    try {
      isConnectLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null) return;

      final response = await http.get(
        Uri.parse(ApiUrl.stripeConnectLoginLinkUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final String? link = data['data'] is String
            ? data['data']
            : data['data']?['url'] ?? data['url'];

        if (link != null && link.isNotEmpty) {
          final Uri url = Uri.parse(link);
          if (await canLaunchUrl(url)) {
            await launchUrl(url, mode: LaunchMode.externalApplication);
          } else {
            _showErrorSnackbar('Could not open link');
          }
        }
      }
    } catch (e) {
      _showErrorSnackbar('Failed to open payout dashboard');
    } finally {
      isConnectLoading.value = false;
    }
  }

  Future<void> toggleTwoFactor() async {
    try {
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      String? userId = await PrefsHelper.getString(PrefsHelper.userId);

      if (token == null || userId == null) return;

      final bool newValue = !twoFactorEnabled.value;

      final response = await http.patch(
        Uri.parse(ApiUrl.updateProfileUrl(userId)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          "twoFactorEnabled": newValue,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        twoFactorEnabled.value = newValue;
        Get.snackbar(
          'Success',
          'Two-factor authentication ${newValue ? 'enabled' : 'disabled'}',
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: const Color(0xFF10B981),
          colorText: Colors.white,
        );
      } else {
        final data = jsonDecode(response.body);
        _showErrorSnackbar(data['message'] ?? 'Failed to update 2FA status');
      }
    } catch (e) {
      _showErrorSnackbar('Error updating 2FA status');
    }
  }

  void _showErrorSnackbar(String message) {
    Get.snackbar(
      'Error',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.redAccent,
      colorText: Colors.white,
    );
  }

  bool get isStripeEligible => membershipTier.value != 'GUEST';

  bool canCreateGroup() {
    if (membershipTier.value == 'GUEST') return false;
    if (membershipTier.value == 'REGULAR' && totalActiveGroups.value >= 1) return false;
    return true;
  }

  /// Fetches dynamic contact information configured in Admin Panel
  Future<void> fetchContactSettings() async {
    try {
      final response = await http.get(
        Uri.parse(ApiUrl.contactSettingsUrl),
        headers: {'Content-Type': 'application/json'},
      );
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['data'] != null) {
          final contact = data['data'];
          if (contact['supportEmail'] != null &&
              contact['supportEmail'].toString().isNotEmpty) {
            supportEmail.value = contact['supportEmail'].toString();
          }
          if (contact['supportPhone'] != null &&
              contact['supportPhone'].toString().isNotEmpty) {
            supportPhone.value = contact['supportPhone'].toString();
          }
          if (contact['supportWhatsapp'] != null &&
              contact['supportWhatsapp'].toString().isNotEmpty) {
            supportWhatsapp.value = contact['supportWhatsapp'].toString();
          }
        }
      }
    } catch (e) {
      debugPrint("Error fetching contact settings: $e");
    }
  }

  /// Opens the device default email client
  Future<void> openEmail() async {
    final email = supportEmail.value.trim();
    final Uri uri = Uri(
      scheme: 'mailto',
      path: email,
      queryParameters: {'subject': 'Support Request - PoolPay'},
    );
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint("Could not launch email: $e");
      CustomToast.showError("Error", "Could not open email app for $email");
    }
  }

  /// Automatically calls the support phone number
  Future<void> callPhone() async {
    final phone = supportPhone.value.replaceAll(RegExp(r'[^\d+]'), '');
    final Uri uri = Uri(scheme: 'tel', path: phone);
    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint("Could not make call: $e");
      CustomToast.showError("Error", "Could not initiate call to $phone");
    }
  }

  /// Opens WhatsApp app with business link or direct chat
  Future<void> openWhatsapp() async {
    final raw = supportWhatsapp.value.trim();
    Uri? uri;
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      uri = Uri.tryParse(raw);
    } else {
      final cleanNumber = raw.replaceAll(RegExp(r'[^\d]'), '');
      uri = Uri.tryParse("https://wa.me/$cleanNumber?text=Hello%20PoolPay%20Support");
    }

    if (uri == null) {
      CustomToast.showError("Error", "Invalid WhatsApp contact info");
      return;
    }

    try {
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        await launchUrl(uri, mode: LaunchMode.externalNonBrowserApplication);
      }
    } catch (e) {
      debugPrint("Could not launch WhatsApp: $e");
      CustomToast.showError("Error", "Could not open WhatsApp");
    }
  }

  final isDeleteLoading = false.obs;

  /// Submits an account deletion request with password confirmation
  Future<bool> requestAccountDeletion({
    required String password,
    String? reason,
  }) async {
    if (password.trim().isEmpty) {
      CustomToast.showError(
        "Password Required",
        "Please enter your account password to confirm deletion request.",
      );
      return false;
    }

    try {
      isDeleteLoading.value = true;
      final token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null || token.isEmpty) {
        CustomToast.showError("Authentication Error", "Please log in again.");
        return false;
      }

      final response = await http.post(
        Uri.parse(ApiUrl.deleteAccountRequestUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'password': password.trim(),
          if (reason != null && reason.trim().isNotEmpty)
            'reason': reason.trim(),
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        CustomToast.showSuccess(
          "Request Submitted",
          data['message'] ??
              "Your account deletion request has been submitted for administrative review.",
        );
        return true;
      } else {
        final errorMsg = data['message'] ??
            "Failed to submit account deletion request. Please verify your password.";
        CustomToast.showError("Request Failed", errorMsg);
        return false;
      }
    } catch (e) {
      debugPrint("Account deletion request error: $e");
      CustomToast.showError(
        "Network Error",
        "Could not submit account deletion request. Please check your connection.",
      );
      return false;
    } finally {
      isDeleteLoading.value = false;
    }
  }
}
