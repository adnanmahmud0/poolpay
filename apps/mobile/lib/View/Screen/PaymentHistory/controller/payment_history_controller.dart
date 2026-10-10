import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../../../../service/api_url.dart';
import '../../../../helper/shared_prefe/shared_prefe.dart';
import '../model/my_stats_model.dart';

class PaymentHistoryController extends GetxController {
  var selectedFilter = 'All'.obs;
  final List<String> filters = ['All', 'Pending', 'Paid', 'Failed', 'Late', 'Manual Review', 'Recovery Required'];

  var isLoading = false.obs;
  var totalPayout = 0.0.obs;
  var isDetailed = false.obs;
  var turnHistory = <TurnHistory>[].obs;
  
  // Pagination
  var currentPage = 1.obs;
  var totalPages = 1.obs;
  var isMoreLoading = false.obs;
  final ScrollController scrollController = ScrollController();

  @override
  void onInit() {
    super.onInit();
    fetchMyStats();
    fetchFilteredPayments(null);
    
    scrollController.addListener(() {
      if (scrollController.position.pixels == scrollController.position.maxScrollExtent) {
        loadMore();
      }
    });
  }

  Future<void> fetchMyStats() async {
    try {
      isLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      
      if (token == null) return;

      var response = await http.get(
        Uri.parse(ApiUrl.myStatsUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          var stats = MyStatsModel.fromJson(data['data']);
          totalPayout.value = stats.totalPayout;
          isDetailed.value = stats.isDetailed;
        }
      }
    } catch (e) {
      print("Error fetching stats: $e");
    } finally {
      isLoading.value = false;
    }
  }

  double get totalContributed => totalPayout.value;

  int get paymentsCount => turnHistory.length;

  List<TurnHistory> get filteredPayments => turnHistory;

  void setFilter(String filter) {
    selectedFilter.value = filter;
    currentPage.value = 1;
    if (filter == 'All') {
      fetchFilteredPayments(null);
    } else {
      fetchFilteredPayments(filter.toLowerCase());
    }
  }

  Future<void> loadMore() async {
    if (currentPage.value < totalPages.value && !isMoreLoading.value) {
      isMoreLoading.value = true;
      String? status = selectedFilter.value == 'All' ? null : selectedFilter.value.toLowerCase();
      await fetchFilteredPayments(status, isLoadMore: true);
      isMoreLoading.value = false;
    }
  }

  Future<void> fetchFilteredPayments(String? status, {bool isLoadMore = false}) async {
    try {
      if (isLoadMore) {
        isMoreLoading.value = true;
      } else {
        isLoading.value = true;
        currentPage.value = 1;
      }
      
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null) return;

      int pageToFetch = isLoadMore ? currentPage.value + 1 : 1;
      
      // Construct URL with query parameters
      Uri uri = Uri.parse(ApiUrl.myPaymentsUrl).replace(
        queryParameters: {
          if (status != null && status.isNotEmpty) 'status': status,
          'page': pageToFetch.toString(),
          'limit': '10',
        },
      );
      
      var response = await http.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          if (data['meta'] != null) {
            currentPage.value = data['meta']['page'] ?? 1;
            totalPages.value = data['meta']['totalPage'] ?? 1;
          }

          var paymentsList = (data['data'] as List? ?? [])
              .map((e) => TurnHistory.fromJson(e))
              .toList();
          
          if (isLoadMore) {
            turnHistory.addAll(paymentsList);
          } else {
            turnHistory.assignAll(paymentsList);
          }
        }
      }
    } catch (e) {
      print("Error fetching filtered payments: $e");
    } finally {
      isLoading.value = false;
      isMoreLoading.value = false;
    }
  }

  @override
  void onClose() {
    scrollController.dispose();
    super.onClose();
  }
}
