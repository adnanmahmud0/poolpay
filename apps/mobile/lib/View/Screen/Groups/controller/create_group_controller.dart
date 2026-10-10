import 'dart:convert';
import 'dart:io';
import 'package:derival81/helper/shared_prefe/shared_prefe.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../../service/api_url.dart';
import '../../../../../Utils/ToastMessage/custom_toast.dart';
import 'group_controller.dart';
import '../model/group_model.dart';
import '../view/group_details_screen.dart';
import '../view/active_group_details_screen.dart';
import '../../Auth/payment_method/view/payment_method_screen.dart';
import '../../Subscription/view/subscription_screen.dart';
import '../../Profile/controller/profile_controller.dart';

class CreateGroupController extends GetxController {
  final groupNameController = TextEditingController();
  final descriptionController = TextEditingController();

  final amountController = TextEditingController(text: "500");
  final frequencyController = TextEditingController(text: "monthly");
  final groupSizeController = TextEditingController(text: "10");
  final totalCyclesController = TextEditingController(text: "2");
  final startDateController = TextEditingController(text: DateTime.now().toIso8601String().split('T')[0]);
  
  final frequencies = ['weekly', 'monthly', 'yearly'];
  var selectedFrequency = 'monthly'.obs;

  var currentStep = 1.obs;
  var isLoading = false.obs;
  var imagePath = "".obs;
  final ImagePicker _picker = ImagePicker();

  void goToNextStep() {
    if (currentStep.value < 3) {
      currentStep.value++;
    }
  }

  void goBack() {
    if (currentStep.value > 1) {
      currentStep.value--;
    } else {
      Get.back();
    }
  }

  Future<void> pickImage() async {
    try {
      final XFile? pickedFile = await _picker.pickImage(source: ImageSource.gallery);
      if (pickedFile != null) {
        imagePath.value = pickedFile.path;
      }
    } catch (e) {
      CustomToast.showError("Error", "Failed to pick image");
    }
  }

  Future<void> createGroup() async {
    if (groupNameController.text.isEmpty) {
      CustomToast.showWarning("Required", "Please enter group name");
      return;
    }

    try {
      isLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);

      if (token == null) {
        print("Create Group Error: Auth token is NULL");
        CustomToast.showError("Error", "Authentication token not found");
        return;
      }
      print("Auth Token found: ${token.substring(0, 10)}...");

      var request = http.MultipartRequest('POST', Uri.parse(ApiUrl.groupsUrl));
      request.headers['Authorization'] = 'Bearer $token';

      request.fields['name'] = groupNameController.text;
      request.fields['description'] = descriptionController.text;
      request.fields['contributionAmount'] = amountController.text;
      request.fields['contributionFrequency'] = selectedFrequency.value.toLowerCase();
      request.fields['totalMembers'] = groupSizeController.text;
      request.fields['totalCycles'] = totalCyclesController.text;
      // request.fields['startDate'] = startDateController.text;

      print("Creating Group with fields: ${request.fields}");

      if (imagePath.value.isNotEmpty) {
        print("Adding image file: ${imagePath.value}");
        request.files.add(await http.MultipartFile.fromPath(
          'groupPhoto', 
          imagePath.value,
        ));
      }

      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);

      print("Create Group Response Status: ${response.statusCode}");
      print("Create Group Response Body: ${response.body}");

      if (response.statusCode == 200 || response.statusCode == 201) {
        var data = jsonDecode(response.body);
        var groupData = data['data'];
        
        CustomToast.showSuccess("Success", "Group created successfully!");
        
        final GroupController groupController = Get.find<GroupController>();
        final newGroup = GroupModel(
          id: groupData?['_id'] ?? groupData?['id'] ?? DateTime.now().toString(),
          name: groupData?['name'] ?? groupNameController.text,
          description: groupData?['description'] ?? descriptionController.text,
          status: groupData?['status'] ?? 'Active',
          membersCount: groupData?['membersCount'] ?? 1,
          totalMembers: groupData?['totalMembers'] ?? (int.tryParse(groupSizeController.text) ?? 10),
          amount: (groupData?['contributionAmount'] ?? (double.tryParse(amountController.text) ?? 500.0)).toDouble(),
          position: 1,
          nextDate: groupData?['startDate'] ?? 'N/A', // startDateController.text,
          progress: 0.1,
        );
        groupController.groups.add(newGroup);
        
        Get.off(() => ActiveGroupDetailsScreen(group: newGroup));
      } else if (response.statusCode == 403) {
        var data = jsonDecode(response.body);
        String message = data['message'] ?? "";
        String lowercaseMessage = message.toLowerCase();
        
        if (lowercaseMessage.contains("membership upgrade required") || 
            lowercaseMessage.contains("limited to") || 
            lowercaseMessage.contains("upgrade to vip") ||
            lowercaseMessage.contains("membership limit")) {
          _showUpgradePopup(message);
        } else {
          _showStripeVerificationPopup(message.isNotEmpty ? message : "You must connect and verify your Stripe account before creating a group.");
        }
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError("Error", data['message'] ?? "Failed to create group");
      }
    } catch (e) {
      print("Create Group Exception: $e");
      CustomToast.showError("Error", "Failed to create group");
    } finally {
      isLoading.value = false;
    }
  }

  void _showStripeVerificationPopup(String message) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: const Text(
          "Verification Required",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF0F172A),
          ),
        ),
        content: Text(
          message,
          style: const TextStyle(
            color: Color(0xFF4A5565),
            fontSize: 16,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text(
              "Cancel",
              style: TextStyle(
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Get.back(); // close dialog
              Get.to(() => PaymentMethodScreen());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A227F),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text("OK"),
          ),
        ],
      ),
    );
  }

  void _showUpgradePopup(String message) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: Row(
          children: [
            const Icon(Icons.stars, color: Color(0xFFF59E0B)),
            const SizedBox(width: 12),
            const Text(
              "Upgrade Required",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        content: Text(
          message,
          style: const TextStyle(
            color: Color(0xFF475565),
            fontSize: 15,
            height: 1.5,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text(
              "Not Now",
              style: TextStyle(
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Get.back();
              Get.to(() => const SubscriptionScreen());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A227F),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: const Text("Upgrade Now"),
          ),
        ],
      ),
    );
  }

  @override
  void onClose() {
    groupNameController.dispose();
    descriptionController.dispose();
    amountController.dispose();
    frequencyController.dispose();
    groupSizeController.dispose();
    super.onClose();
  }
}
