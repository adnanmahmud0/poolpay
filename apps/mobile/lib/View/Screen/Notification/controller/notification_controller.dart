import 'dart:async';
import 'dart:convert';
import 'package:flutter/widgets.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../Utils/ToastMessage/custom_toast.dart';
import '../../../../service/api_url.dart';
import '../model/notification_model.dart';

class NotificationController extends GetxController {
  var notifications = <NotificationModel>[].obs;
  var unreadCount = 0.obs;
  var isLoading = false.obs;

  var currentPage = 1;
  var hasMore = true.obs;
  var isFetchingMore = false.obs;
  final int limit = 10;
  final ScrollController scrollController = ScrollController();
  Timer? _timer;

  @override
  void onInit() {
    super.onInit();
    fetchNotifications(refresh: true);

    // Polling: Refresh notifications every 30 seconds
    _timer = Timer.periodic(const Duration(seconds: 30), (timer) {
      fetchNotifications(refresh: true);
    });

    scrollController.addListener(() {
      if (scrollController.position.pixels == scrollController.position.maxScrollExtent) {
        fetchNotifications();
      }
    });
  }

  @override
  void onClose() {
    _timer?.cancel();
    scrollController.dispose();
    super.onClose();
  }

  Future<void> fetchNotifications({bool refresh = false}) async {
    if (refresh) {
      currentPage = 1;
      hasMore.value = true;
    } else {
      if (!hasMore.value || isFetchingMore.value) return;
    }

    try {
      if (refresh) {
        isLoading.value = true;
      } else {
        isFetchingMore.value = true;
      }

      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString('accessToken');

      if (token == null) {
        return;
      }

      var response = await http.get(
        Uri.parse('${ApiUrl.notificationsUrl}?page=$currentPage&limit=$limit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print("Notifications API Status: ${response.statusCode}");
      print("Notifications API Body: ${response.body}");

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          var dataList = data['data']['data'] as List;
          var fetchedNotifications =
              dataList.map((n) => NotificationModel.fromJson(n)).toList();

          if (refresh) {
            notifications.value = fetchedNotifications;
          } else {
            notifications.addAll(fetchedNotifications);
          }

          if (fetchedNotifications.length < limit) {
            hasMore.value = false;
          } else {
            currentPage++;
          }

          updateUnreadCount();
        }
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError("Error", data['message'] ?? "Failed to load notifications");
      }
    } catch (e) {
      print("Notifications API Error: $e");
      CustomToast.showError("Error", "Something went wrong while fetching notifications");
    } finally {
      if (refresh) {
        isLoading.value = false;
      } else {
        isFetchingMore.value = false;
      }
    }
  }

  void updateUnreadCount() {
    unreadCount.value = notifications.where((n) => n.isUnread).length;
  }

  void markAsRead(int index) {
    // Local update
    notifications[index] = NotificationModel(
      id: notifications[index].id,
      title: notifications[index].title,
      description: notifications[index].description,
      date: notifications[index].date,
      type: notifications[index].type,
      isUnread: false,
    );
    updateUnreadCount();
    // TODO: Make API call to mark as read if endpoint exists
  }
}
