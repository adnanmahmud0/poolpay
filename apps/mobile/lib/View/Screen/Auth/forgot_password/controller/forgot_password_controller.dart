import 'dart:convert';
import 'package:derival81/Utils/ToastMessage/custom_toast.dart';
import 'package:derival81/service/api_url.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../otp/view/otp_screen.dart';

class ForgotPasswordController extends GetxController {
  final TextEditingController emailController = TextEditingController();
  var isLoading = false.obs;

  Future<void> sendResetLink() async {
    if (emailController.text.isEmpty) {
      CustomToast.showWarning("Required", "Please enter your email");
      return;
    }

    try {
      isLoading.value = true;
      var response = await http.post(
        Uri.parse(ApiUrl.forgotPasswordUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({"identifier": emailController.text}),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        var data = jsonDecode(response.body);
        CustomToast.showSuccess(
          "OTP Sent",
          data['message'] ?? "Please check your Email and Phone for the reset code.",
        );
        Get.to(() => OtpScreen(), arguments: {
          'email': emailController.text,
          'type': 'forgot_password',
        });
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to send reset code.",
        );
      }
    } catch (e) {
      CustomToast.showError("Oh Snap!", "Something went wrong.");
    } finally {
      isLoading.value = false;
    }
  }

  @override
  void onClose() {
    emailController.dispose();
    super.onClose();
  }
}
