import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../../service/notification_service.dart';
import '../../../../../helper/shared_prefe/shared_prefe.dart';
import '../../../Home/view/home_screen.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../../service/api_url.dart';
import '../../../../../Utils/ToastMessage/custom_toast.dart';
import '../../complete_profile/view/complete_profile_screen.dart';
import '../../otp/view/otp_screen.dart';
import '../../../../../service/session_inactivity_watcher.dart';

class LoginController extends GetxController {
  var isPasswordVisible = false.obs;
  var isLoading = false.obs;

  void togglePasswordVisibility() {
    isPasswordVisible.value = !isPasswordVisible.value;
  }

  Future<void> login(String identifier, String password) async {
    if (identifier.isEmpty || password.isEmpty) {
      CustomToast.showWarning("Required", "Please fill in all the fields");
      return;
    }

    try {
      isLoading.value = true;
      var response = await http.post(
        Uri.parse(ApiUrl.loginUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "identifier": identifier,
          "password": password,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        var data = jsonDecode(response.body);
        var responseData = data['data'];

        // Check for 2FA
        if (responseData != null && responseData['requires2FA'] == true) {
          isLoading.value = false;
          String userEmail = responseData['email'] ?? identifier;
          String channel = responseData['channel'] ?? 'email';
          
          CustomToast.showSuccess(
            "2FA Required",
            data['message'] ?? "Please check your Email and Phone for the OTP code.",
          );

          Future.delayed(const Duration(milliseconds: 500), () {
            Get.to(() => OtpScreen(), arguments: {
              'email': userEmail,
              'type': 'login_2fa',
              'channel': channel,
            });
          });
          return;
        }

        // Save Tokens and Check Profile (Existing logic)
        if (responseData != null) {
          String? accessToken = responseData['accessToken'];
          String? refreshToken = responseData['refreshToken'];
          var userObj = responseData['user'];
          bool? isUpdatedProfile = userObj?['isUpdatedProfile'];

          if (accessToken != null) {
            await PrefsHelper.setString(PrefsHelper.token, accessToken);
          }
          if (refreshToken != null) {
            await PrefsHelper.setString(PrefsHelper.refreshToken, refreshToken);
          }
          if (userObj != null) {
            await PrefsHelper.setString(
                PrefsHelper.userData, jsonEncode(userObj));
            if (userObj['_id'] != null) {
              await PrefsHelper.setString(
                  PrefsHelper.userId, userObj['_id'].toString());
            }
          }

          // Update FCM Token after login
          try {
            final notificationService = Get.find<NotificationService>();
            notificationService
                .init(); // Re-initialize to get token and send to backend
          } catch (e) {
            print("Error updating FCM token: $e");
          }

          // Start dynamic inactivity auto-logout tracking
          int timeoutMinutes = responseData['sessionTimeoutMinutes'] ?? 20;
          SessionInactivityWatcher.start(minutes: timeoutMinutes);

          CustomToast.showSuccess(
            "Welcome Back!",
            data['message'] ?? "Logged in successfully.",
          );

          if (isUpdatedProfile == false) {
            Future.delayed(const Duration(milliseconds: 500), () {
              if (Get.context != null) FocusScope.of(Get.context!).unfocus();
              Get.offAll(() => CompleteProfileScreen());
            });
          } else {
            Future.delayed(const Duration(milliseconds: 500), () {
              if (Get.context != null) FocusScope.of(Get.context!).unfocus();
              Get.offAll(() => HomeScreen());
            });
          }
        } else {
          isLoading.value = false;
          CustomToast.showSuccess(
            "Welcome Back!",
            data['message'] ?? "Logged in successfully.",
          );
          Future.delayed(const Duration(milliseconds: 500), () {
            FocusScope.of(Get.context!).unfocus();
            Get.offAll(() => HomeScreen());
          });
        }
      } else {
        isLoading.value = false;
        var data = jsonDecode(response.body);
        print("API Error Response: ${response.body}");

        String errorMessage =
            data['message'] ?? "Login failed. Please try again.";

        // Extract detailed validation message if it's a Zod Error
        if (data['errorSources'] != null &&
            data['errorSources'] is List &&
            data['errorSources'].isNotEmpty) {
          errorMessage = data['errorSources'][0]['message'] ?? errorMessage;
        } else if (data['errors'] != null &&
            data['errors'] is List &&
            data['errors'].isNotEmpty) {
          var firstError = data['errors'][0];
          if (firstError is Map && firstError['message'] != null) {
            errorMessage = firstError['message'];
          } else if (firstError is String) {
            errorMessage = firstError;
          }
        }

        CustomToast.showError("Login Failed", errorMessage);
      }
    } catch (e) {
      isLoading.value = false;
      CustomToast.showError(
        "Oh Snap!",
        "Something went wrong while logging in. Please try again.",
      );
    } finally {
      if (!isClosed) {
        isLoading.value = false;
      }
    }
  }
}
