import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../helper/shared_prefe/shared_prefe.dart';
import '../model/group_member_model.dart';
import '../model/group_model.dart';
import '../../../../../service/api_url.dart';
import '../../../../../Utils/ToastMessage/custom_toast.dart';
import '../view/active_group_details_screen.dart';

class GroupController extends GetxController {
  var groups = <GroupModel>[].obs;

  var selectedFilter = "All".obs;
  var currentUserId = "".obs;

  @override
  void onInit() {
    super.onInit();
    _loadCurrentUserId();
    fetchMyGroups();
  }

  Future<void> _loadCurrentUserId() async {
    currentUserId.value = await PrefsHelper.getString(PrefsHelper.userId) ?? "";
  }

  Future<void> fetchMyGroups() async {
    try {
      isLoading.value = true;
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString('accessToken');

      if (token == null) {
        return;
      }

      var response = await http.get(
        Uri.parse(ApiUrl.myGroupsUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          var groupsList = data['data'] as List;
          groups.value = groupsList.map((g) => GroupModel.fromJson(g)).toList();
        }
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to fetch groups",
        );
      }
    } catch (e) {
      CustomToast.showError(
        "Error",
        "Something went wrong while fetching groups",
      );
    } finally {
      isLoading.value = false;
    }
  }

  var isLoading = false.obs;
  var activeGroupDetails = Rxn<GroupModel>();

  Future<void> fetchGroupDetails(String id) async {
    try {
      isLoading.value = true;
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString('accessToken');

      if (token == null) {
        return;
      }

      var response = await http.get(
        Uri.parse('${ApiUrl.groupsUrl}/$id'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          activeGroupDetails.value = GroupModel.fromJson(data['data']);
        }
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to fetch group details",
        );
      }
    } catch (e) {
      CustomToast.showError(
        "Error",
        "Something went wrong while fetching group details",
      );
    } finally {
      isLoading.value = false;
    }
  }

  var groupMembers = <GroupMemberModel>[].obs;
  var isMembersLoading = false.obs;

  Future<void> fetchGroupMembers(String groupId) async {
    try {
      isMembersLoading.value = true;
      groupMembers.clear();
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString('accessToken');

      if (token == null) {
        return;
      }

      var response = await http.get(
        Uri.parse(ApiUrl.groupMembersUrl(groupId)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          var membersList = data['data'] as List;
          groupMembers.value = membersList
              .map((m) => GroupMemberModel.fromJson(m))
              .toList();
        }
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to fetch members",
        );
      }
    } catch (e) {
      CustomToast.showError(
        "Error",
        "Something went wrong while fetching members",
      );
    } finally {
      isMembersLoading.value = false;
    }
  }

  var searchedGroup = Rxn<GroupModel>();

  final List<String> filters = [
    "All",
    "Active",
    "Pending",
    "Completed",
  ];

  void setFilter(String filter) {
    selectedFilter.value = filter;
  }

  List<GroupModel> get filteredGroups {
    if (selectedFilter.value == 'All') return groups;
    return groups
        .where(
          (g) {
            String status = g.status.toLowerCase();
            if (status == 'upcoming') status = 'pending';
            return status == selectedFilter.value.toLowerCase();
          },
        )
        .toList();
  }

  Future<void> fetchGroupByInviteCode(String inviteCode) async {
    try {
      isLoading.value = true;
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString('accessToken');

      if (token == null) {
        CustomToast.showError("Error", "Authentication token not found");
        return;
      }

      var response = await http.get(
        Uri.parse(ApiUrl.getInviteGroupUrl(inviteCode)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          searchedGroup.value = GroupModel.fromJson(data['data']);
        } else {
          CustomToast.showError(
            "Error",
            data['message'] ?? "Failed to find group",
          );
          searchedGroup.value = null;
        }
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to fetch group details",
        );
        searchedGroup.value = null;
      }
    } catch (e) {
      CustomToast.showError(
        "Error",
        "Something went wrong while fetching group",
      );
      searchedGroup.value = null;
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> joinGroup(String inviteCode) async {
    try {
      isLoading.value = true;
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString('accessToken');

      if (token == null) {
        CustomToast.showError("Error", "Authentication token not found");
        return;
      }

      var response = await http.post(
        Uri.parse(ApiUrl.joinGroupUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({"inviteCode": inviteCode}),
      );

      print("Join Group API Status: ${response.statusCode}");
      print("Join Group API Body: ${response.body}");

      if (response.statusCode == 200 || response.statusCode == 201) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          CustomToast.showSuccess(
            "Success",
            data['message'] ?? "Joined group successfully",
          );
          // Refresh groups list so home screen updates in real-time
          fetchMyGroups();
          // Optionally navigate
          if (searchedGroup.value != null) {
            Get.to(() => ActiveGroupDetailsScreen(group: searchedGroup.value!));
          }
        } else {
          CustomToast.showError(
            "Error",
            data['message'] ?? "Failed to join group",
          );
        }
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to join group",
        );
      }
    } catch (e) {
      print("Join Group API Error: $e");
      CustomToast.showError(
        "Error",
        "Something went wrong while joining group",
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> deleteGroup(String id) async {
    try {
      isLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);

      if (token == null) {
        CustomToast.showError("Error", "Authentication token not found");
        return;
      }

      var response = await http.delete(
        Uri.parse('${ApiUrl.groupsUrl}/$id'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print("Delete Group API Status: ${response.statusCode}");
      print("Delete Group API Body: ${response.body}");

      if (response.statusCode == 200 || response.statusCode == 204) {
        CustomToast.showSuccess("Success", "Group deleted successfully");
        // Refresh home list
        fetchMyGroups();
        Get.offAllNamed('/home');
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to delete group",
        );
      }
    } catch (e) {
      print("Delete Group API Error: $e");
      CustomToast.showError(
        "Error",
        "Something went wrong while deleting group",
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> removeMember(String groupId, String memberId, String note) async {
    try {
      isLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);

      if (token == null) {
        CustomToast.showError("Error", "Authentication token not found");
        return;
      }

      var response = await http.patch(
        Uri.parse(ApiUrl.removeMemberUrl(memberId)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({"removalNote": note}),
      );

      print("Remove Member API Status: ${response.statusCode}");
      print("Remove Member API Body: ${response.body}");

      if (response.statusCode == 200 || response.statusCode == 204) {
        groupMembers.removeWhere((m) => m.id == memberId);
        // Refresh group details to update currentMembers count locally and globally
        fetchGroupDetails(groupId);
        fetchMyGroups();
        CustomToast.showSuccess("Success", "Member removed successfully");
        Get.back(); // Close popup
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError(
          "Error",
          data['message'] ?? "Failed to remove member",
        );
      }
    } catch (e) {
      print("Remove Member API Error: $e");
      CustomToast.showError(
        "Error",
        "Something went wrong while removing member",
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> sendPenaltyNotice(String memberId) async {
    try {
      isLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);

      if (token == null) {
        CustomToast.showError("Error", "Authentication token not found");
        return;
      }

      var response = await http.patch(
        Uri.parse(ApiUrl.penaltyNoticeUrl(memberId)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({"noticeStatus": "NOTICE"}),
      );

      print("Penalty Notice API Status: ${response.statusCode}");
      print("Penalty Notice API Body: ${response.body}");

      if (response.statusCode == 200) {
        var data = jsonDecode(response.body);
        if (data['success'] == true) {
          CustomToast.showSuccess("Success", data['message'] ?? "Notice sent successfully");
          // Optionally refresh groups
        } else {
          CustomToast.showError("Error", data['message'] ?? "Failed to send notice");
        }
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError("Error", data['message'] ?? "Failed to send notice");
      }
    } catch (e) {
      print("Penalty Notice API Error: $e");
      CustomToast.showError("Error", "Something went wrong while sending notice");
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> startGroup(String groupId) async {
    try {
      isLoading.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);

      if (token == null) {
        CustomToast.showError("Error", "Authentication token not found");
        return;
      }

      var response = await http.post(
        Uri.parse(ApiUrl.startGroupUrl(groupId)),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      print("Start Group API Status: ${response.statusCode}");
      print("Start Group API Body: ${response.body}");

      if (response.statusCode == 200 || response.statusCode == 201) {
        var data = jsonDecode(response.body);
        CustomToast.showSuccess(
          "Success",
          data['message'] ?? "Group started successfully",
        );
        // Refresh group details and global list
        fetchGroupDetails(groupId);
        fetchMyGroups();
      } else {
        var data = jsonDecode(response.body);
        CustomToast.showError("Error", data['message'] ?? "Failed to start group");
      }
    } catch (e) {
      print("Start Group API Error: $e");
      CustomToast.showError("Error", "Something went wrong while starting group");
    } finally {
      isLoading.value = false;
    }
  }
}
