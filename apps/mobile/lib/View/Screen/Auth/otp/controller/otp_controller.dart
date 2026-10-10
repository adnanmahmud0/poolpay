import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../complete_profile/view/complete_profile_screen.dart';
import '../../set_password/view/set_password_screen.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../../../../service/api_url.dart';
import '../../login/view/login_screen.dart';
import '../../login/controller/login_controller.dart';
import '../../../../../Utils/ToastMessage/custom_toast.dart';
import '../../../Home/view/home_screen.dart';
import '../../../../../helper/shared_prefe/shared_prefe.dart';
import '../../../../../service/session_inactivity_watcher.dart';

class OtpController extends GetxController {
  final TextEditingController otpController = TextEditingController();
  var isLoading = false.obs;

  var resendCooldown = 120.obs; // 2 minutes
  var isResendEnabled = false.obs;
  var failCount = 0.obs;
  var lockoutTime = 0.obs; // 15 minutes in seconds
  
  var channel = "email".obs;
  var email = "".obs;
  var type = "".obs;

  @override
  void onInit() {
    super.onInit();
    var args = Get.arguments;
    if (args != null && args is Map) {
      email.value = args['email'] ?? '';
      type.value = args['type'] ?? '';
      channel.value = args['channel'] ?? 'email';
    }
    startResendTimer();
  }

  void startResendTimer() {
    resendCooldown.value = 120;
    isResendEnabled.value = false;
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (resendCooldown.value > 0) {
        resendCooldown.value--;
        return true;
      } else {
        isResendEnabled.value = true;
        return false;
      }
    });
  }

  void startLockoutTimer() {
    lockoutTime.value = 900; // 15 minutes
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (lockoutTime.value > 0) {
        lockoutTime.value--;
        return true;
      } else {
        failCount.value = 0;
        return false;
      }
    });
  }

  Future<void> confirmOtp() async {
    // Implement confirm OTP logic
    if (otpController.text.length == 6) {
      if (lockoutTime.value > 0) {
        CustomToast.showError("Locked Out", "Too many failed attempts. Please try again in ${lockoutTime.value ~/ 60}m ${lockoutTime.value % 60}s.");
        return;
      }
      
      if (email.value.isEmpty) {
        CustomToast.showError("Error", "Email not found. Please try again.");
        return;
      }

      if (type.value == 'signup') {
          try {
            isLoading.value = true;
            var response = await http.post(
              Uri.parse(ApiUrl.verifyEmailUrl),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({
                "identifier": email.value,
                "code": otpController.text,
              }),
            );

            if (response.statusCode == 200) {
              var data = jsonDecode(response.body);
              if (data['success'] == true) {
                CustomToast.showSuccess(
                  "Success",
                  data['message'] ?? "Email verified successfully.",
                );
                FocusScope.of(Get.context!).unfocus();
                Future.delayed(const Duration(milliseconds: 300), () {
                  Get.offAll(() => LoginScreen());
                });
              } else {
                _handleFail();
                CustomToast.showError(
                  "Error",
                  data['message'] ?? "Verification failed.",
                );
              }
            } else {
              _handleFail();
              var data = jsonDecode(response.body);
              CustomToast.showError(
                "Error",
                data['message'] ?? "Verification failed. Please try again.",
              );
            }
          } catch (e) {
            CustomToast.showError("Oh Snap!", "Something went wrong.");
          } finally {
            isLoading.value = false;
          }
        } else if (type == 'login_2fa') {
          try {
            isLoading.value = true;
            var response = await http.post(
              Uri.parse(ApiUrl.verify2FAUrl),
              headers: {'Content-Type': 'application/json'},
              body: jsonEncode({
                "identifier": email.value,
                "code": otpController.text,
              }),
            );

            if (response.statusCode == 200 || response.statusCode == 201) {
              var data = jsonDecode(response.body);
              var responseData = data['data'];

              if (responseData != null) {
                String? accessToken = responseData['accessToken'];
                String? refreshToken = responseData['refreshToken'];
                var userObj = responseData['user'];
                bool? isUpdatedProfile = userObj?['isUpdatedProfile'];

                if (accessToken != null) {
                  await PrefsHelper.setString(PrefsHelper.token, accessToken);
                }
                if (refreshToken != null) {
                  await PrefsHelper.setString(
                      PrefsHelper.refreshToken, refreshToken);
                }
                if (userObj != null) {
                  await PrefsHelper.setString(
                      PrefsHelper.userData, jsonEncode(userObj));
                  if (userObj['_id'] != null) {
                    await PrefsHelper.setString(
                        PrefsHelper.userId, userObj['_id'].toString());
                  }
                }

                int timeoutMinutes = responseData['sessionTimeoutMinutes'] ?? 20;
                SessionInactivityWatcher.start(minutes: timeoutMinutes);

                CustomToast.showSuccess(
                  "Welcome Back!",
                  data['message'] ?? "Logged in successfully.",
                );

                FocusScope.of(Get.context!).unfocus();
                if (isUpdatedProfile == false) {
                  Get.offAll(() => CompleteProfileScreen());
                } else {
                  Get.offAll(() => HomeScreen());
                }
              }
            } else {
              _handleFail();
              var data = jsonDecode(response.body);
              CustomToast.showError(
                "Error",
                data['message'] ?? "2FA verification failed.",
              );
            }
          } catch (e) {
            CustomToast.showError("Oh Snap!", "Something went wrong.");
          } finally {
            isLoading.value = false;
          }
        } else {
          FocusScope.of(Get.context!).unfocus();
          Get.to(() => SetPasswordScreen(), arguments: {
            'email': email.value,
            'code': otpController.text,
          });
        }
    } else {
      Get.snackbar("Error", "Please enter a valid 6-digit OTP");
    }
  }

  void _handleFail() {
    failCount.value++;
    if (failCount.value >= 5) {
      startLockoutTimer();
      CustomToast.showError("Locked Out", "5 failed attempts. Locked for 15 minutes.");
    }
  }

  Future<void> resendOtp() async {
    if (!isResendEnabled.value) return;

    if (email.value.isEmpty) {
      CustomToast.showError("Error", "Email not found.");
      return;
    }

    try {
      var response = await http.post(
        Uri.parse(ApiUrl.resendVerificationCodeUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({"identifier": email.value}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        var data = jsonDecode(response.body);
        CustomToast.showSuccess(
          "Success",
          data['message'] ?? "OTP sent to your Email and Phone successfully.",
        );
        startResendTimer();
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to resend OTP.",
        );
      }
    } catch (e) {
      CustomToast.showError("Oh Snap!", "Something went wrong.");
    }
  }

  @override
  void onClose() {
    otpController.dispose();
    super.onClose();
  }
}
