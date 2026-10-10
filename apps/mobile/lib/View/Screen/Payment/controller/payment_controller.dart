import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../Auth/payment_method/model/payment_method_model.dart';
import '../../../../service/api_url.dart';

class PaymentController extends GetxController {
  var thisMonthSpent = 0.obs;
  var totalSavings = 0.obs;
  var pendingPayments = 0.obs;
  var totalActiveGroups = 0.obs;
  var isLoading = false.obs;

  // Uses the same model as PaymentMethodController
  var paymentMethods = <PaymentMethodModel>[].obs;

  @override
  void onInit() {
    super.onInit();
    fetchPaymentMethods();
    fetchFinancialStats();
  }

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('accessToken');
  }

  Future<void> fetchPaymentMethods() async {
    try {
      isLoading.value = true;
      final token = await _getToken();
      if (token == null) return;

      final response = await http.get(
        Uri.parse(ApiUrl.paymentMethodsUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      debugPrint('[PaymentController.fetchPaymentMethods] status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // API returns: { "success": true, "data": [...] }
        final List list = data['data'] ?? [];
        paymentMethods.assignAll(
          list.map((item) => PaymentMethodModel.fromJson(item)).toList(),
        );
      }
    } catch (e) {
      debugPrint('[PaymentController.fetchPaymentMethods] error: $e');
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchFinancialStats() async {
    try {
      final token = await _getToken();
      if (token == null) return;

      final response = await http.get(
        Uri.parse(ApiUrl.myStatsUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          final stats = data['data'];
          if (stats != null) {
            thisMonthSpent.value = (stats['totalPayout'] ?? 0).toInt();
            totalSavings.value = (stats['totalSavings'] ?? 0).toInt();
            totalActiveGroups.value = (stats['totalActiveGroups'] ?? 0).toInt();
            pendingPayments.value = (stats['pendingPayments'] ?? stats['pendingCount'] ?? 0).toInt();
          }
        }
      }
    } catch (e) {
      debugPrint('[PaymentController.fetchFinancialStats] error: $e');
    }
  }

  Future<void> selectPaymentMethod(String id) async {
    // Optimistic UI update
    final updated = paymentMethods.map((method) {
      return method.copyWith(isDefault: method.id == id);
    }).toList();
    paymentMethods.assignAll(updated);

    try {
      final token = await _getToken();
      if (token == null) return;

      final response = await http.patch(
        Uri.parse(ApiUrl.setDefaultPaymentMethodUrl(id)),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        Get.snackbar(
          'Default Updated',
          'Selected payment method will now be used for automatic payments.',
          backgroundColor: const Color(0xFF22C55E),
          colorText: Colors.white,
          duration: const Duration(seconds: 2),
        );
      } else {
        // Revert by refetching on failure
        fetchPaymentMethods();
      }
    } catch (e) {
      debugPrint('[PaymentController.selectPaymentMethod] error: $e');
      fetchPaymentMethods();
    }
  }

  Future<void> deletePaymentMethod(String id) async {
    try {
      final token = await _getToken();
      if (token == null) return;

      final response = await http.delete(
        Uri.parse(ApiUrl.deletePaymentMethodUrl(id)),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        paymentMethods.removeWhere((m) => m.id == id);
        Get.snackbar(
          'Removed',
          'Payment method removed successfully.',
          backgroundColor: const Color(0xFF22C55E),
          colorText: Colors.white,
          duration: const Duration(seconds: 2),
        );
      } else {
        Get.snackbar(
          'Error',
          'Failed to remove payment method.',
          backgroundColor: Colors.redAccent,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      debugPrint('[PaymentController.deletePaymentMethod] error: $e');
    }
  }
}
