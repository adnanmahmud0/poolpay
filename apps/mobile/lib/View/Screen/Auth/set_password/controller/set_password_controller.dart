import 'dart:convert';
import 'package:derival81/Utils/ToastMessage/custom_toast.dart';
import 'package:derival81/service/api_url.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../login/view/login_screen.dart';
import '../../login/controller/login_controller.dart';

class SetPasswordController extends GetxController {
  final TextEditingController newPasswordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();

  var isLoading = false.obs;

  Future<void> savePassword() async {
    if (newPasswordController.text.isEmpty || confirmPasswordController.text.isEmpty) {
      CustomToast.showWarning("Required", "Please fill in all fields");
      return;
    }

    if (newPasswordController.text != confirmPasswordController.text) {
      CustomToast.showError("Error", "Passwords do not match");
      return;
    }

    var args = Get.arguments;
    if (args == null || args is! Map) {
      CustomToast.showError("Error", "Required data missing. Please try again.");
      return;
    }

    String email = args['email'] ?? '';
    String code = args['code'] ?? '';

    if (email.isEmpty || code.isEmpty) {
      CustomToast.showError("Error", "Session expired. Please restart the process.");
      return;
    }

    try {
      isLoading.value = true;
      var response = await http.post(
        Uri.parse(ApiUrl.resetPasswordUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "identifier": email,
          "code": code,
          "newPassword": newPasswordController.text,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        var data = jsonDecode(response.body);
        CustomToast.showSuccess(
          "Success",
          data['message'] ?? "Password updated successfully.",
        );
        Get.delete<LoginController>(force: true);
        Get.offAll(() => const LoginScreen());
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to update password.",
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
    newPasswordController.dispose();
    confirmPasswordController.dispose();
    super.onClose();
  }
}
