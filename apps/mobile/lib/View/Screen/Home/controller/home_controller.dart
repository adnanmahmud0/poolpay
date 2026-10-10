import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import '../../../../helper/shared_prefe/shared_prefe.dart';
import '../../../../../service/api_url.dart';
import '../model/advertisement_model.dart';
import 'dart:async';

class HomeController extends GetxController {
  var userName = "Loading...".obs;
  var totalSaved = 0.obs;
  var totalPayout = 0.obs;
  var activeGroups = 0.obs;
  var selectedIndex = 0.obs;
  var isLoading = false.obs;

  var advertisements = <AdvertisementModel>[].obs;
  var currentAdIndex = 0.obs;
  Timer? _adTimer;

  @override
  void onInit() {
    super.onInit();
    getProfile();
    fetchFinancialStats();
    fetchAdvertisements();
  }

  void startAdTimer() {
    _adTimer?.cancel();
    if (advertisements.isNotEmpty) {
      _adTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
        if (advertisements.isNotEmpty) {
          currentAdIndex.value = (currentAdIndex.value + 1) % advertisements.length;
        }
      });
    }
  }

  void changeTabIndex(int index) {
    selectedIndex.value = index;
  }

  Future<void> getProfile() async {
    try {
      isLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);

      if (token == null) {
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
          userName.value = fName.isNotEmpty ? "$fName $lName".trim() : 'User';
        }
      }
    } catch (e) {
      print("Error fetching profile on home: $e");
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> fetchFinancialStats() async {
    try {
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null) return;

      var response = await http.get(
        Uri.parse(ApiUrl.myStatsUrl),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          var stats = data['data'];
          if (stats != null) {
            totalSaved.value = (stats['totalSavings'] ?? 0).toInt();
            activeGroups.value = (stats['totalActiveGroups'] ?? 0).toInt();
            totalPayout.value = (stats['totalPayout'] ?? 0).toInt();
          }
        }
      }
    } catch (e) {
      print("Error fetching financial stats: $e");
    }
  }

  Future<void> fetchAdvertisements() async {
    try {
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      final Map<String, String> headers = {
        'Content-Type': 'application/json',
      };
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }

      var response = await http.get(
        Uri.parse("${ApiUrl.advertisementsUrl}/active"),
        headers: headers,
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          var adsList = (data['data'] as List? ?? [])
              .map((e) => AdvertisementModel.fromJson(e))
              .toList();
          
          // Sort by priority descending
          adsList.sort((a, b) => b.priority.compareTo(a.priority));
          
          advertisements.assignAll(adsList);
          debugPrint("[Home] Successfully loaded ${adsList.length} active advertisements");
          startAdTimer();
        }
      } else {
        debugPrint("[Home] Failed to load ads. Status: ${response.statusCode}");
      }
    } catch (e) {
      debugPrint("Error fetching advertisements: $e");
    }
  }

  void showAdPopup() {
    if (advertisements.isEmpty) return;
    final ad = advertisements.first; // Show the highest priority ad
    
    Get.dialog(
      barrierDismissible: true,
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  child: ad.bannerImage.isNotEmpty 
                    ? Image.network(
                        ad.bannerImage,
                        width: double.infinity,
                        height: 200,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          height: 200,
                          color: const Color(0xFFF1F5F9),
                          child: const Icon(Icons.image, size: 50, color: Color(0xFF94A3B8)),
                        ),
                      )
                    : Container(height: 10, color: Colors.transparent),
                ),
                Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    children: [
                      Text(
                        ad.title,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        ad.description,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF475569),
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ],
            ),
            Positioned(
              right: -10,
              top: -10,
              child: GestureDetector(
                onTap: () => Get.back(),
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))
                    ],
                  ),
                  child: const Icon(Icons.close, size: 20, color: Color(0xFF0F172A)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void onClose() {
    _adTimer?.cancel();
    super.onClose();
  }
}
