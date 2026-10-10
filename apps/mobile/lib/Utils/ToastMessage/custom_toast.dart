import 'package:flutter/material.dart';
import 'package:get/get.dart';

class CustomToast {
  static void showSuccess(String title, String message) {
    Get.snackbar(
      title == "Success" ? "Success! 🎉" : title,
      message,
      snackPosition: SnackPosition.TOP,
      backgroundColor: const Color(0xFF16A34A).withOpacity(0.9), // Beautiful green
      colorText: Colors.white,
      margin: const EdgeInsets.all(16),
      borderRadius: 16,
      duration: const Duration(seconds: 3),
      icon: const Icon(Icons.check_circle_outline, color: Colors.white, size: 28),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      borderWidth: 1,
      borderColor: Colors.white.withOpacity(0.2),
      isDismissible: true,
      forwardAnimationCurve: Curves.easeOutBack,
      snackStyle: SnackStyle.FLOATING,
    );
  }

  static void showError(String title, String message) {
    // Hide technical auth errors from user to prevent confusion during token refresh
    if (message.toLowerCase().contains("jwt") || 
        message.toLowerCase().contains("unauthorized") ||
        message.toLowerCase().contains("token expired")) {
      return;
    }
    Get.snackbar(
      title == "Error" ? "Error ⚠️" : title,
      message,
      snackPosition: SnackPosition.TOP,
      backgroundColor: const Color(0xFFDC2626).withOpacity(0.9), // Beautiful red
      colorText: Colors.white,
      margin: const EdgeInsets.all(16),
      borderRadius: 16,
      duration: const Duration(seconds: 4),
      icon: const Icon(Icons.error_outline, color: Colors.white, size: 28),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      borderWidth: 1,
      borderColor: Colors.white.withOpacity(0.2),
      isDismissible: true,
      forwardAnimationCurve: Curves.easeOutBack,
      snackStyle: SnackStyle.FLOATING,
    );
  }

  static void showWarning(String title, String message) {
    Get.snackbar(
      title == "Warning" ? "Warning ⚠️" : title,
      message,
      snackPosition: SnackPosition.TOP,
      backgroundColor: const Color(0xFFF59E0B).withOpacity(0.9), // Beautiful amber
      colorText: Colors.white,
      margin: const EdgeInsets.all(16),
      borderRadius: 16,
      duration: const Duration(seconds: 3),
      icon: const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 28),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      borderWidth: 1,
      borderColor: Colors.white.withOpacity(0.2),
      isDismissible: true,
      forwardAnimationCurve: Curves.easeOutBack,
      snackStyle: SnackStyle.FLOATING,
    );
  }
}
