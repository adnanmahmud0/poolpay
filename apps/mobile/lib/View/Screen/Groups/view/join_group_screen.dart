import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../model/group_model.dart';
import '../controller/group_controller.dart';
import 'active_group_details_screen.dart';
import '../../../../config/app_config_service.dart';

class JoinGroupScreen extends StatelessWidget {
  JoinGroupScreen({Key? key}) : super(key: key);

  final GroupController controller = Get.put(GroupController());
  final TextEditingController searchController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(20.r),
              child: Column(
                children: [
                  _buildJoinCard(),
                  Obx(() {
                    if (controller.isLoading.value) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.only(top: 20),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }
                    if (controller.searchedGroup.value != null) {
                      return _buildSearchResult(
                        controller.searchedGroup.value!,
                      );
                    }
                    return const SizedBox.shrink();
                  }),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(12.w, 40.h, 24.w, 32.h),
      decoration: BoxDecoration(
        gradient: const RadialGradient(
          center: Alignment(0.5, -0.6),
          radius: 1.2,
          colors: [Color(0xFF6773FF), Color(0xFF1A227F)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32.r),
          bottomRight: Radius.circular(32.r),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Get.back(),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          SizedBox(width: 8.w),
          Text(
            'join_group'.tr,
            style: TextStyle(
              color: Colors.white,
              fontSize: 24.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJoinCard() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'enter_invite_code'.tr,
            style: TextStyle(
              color: const Color(0xFF0F172A),
              fontSize: 20.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 12.h),
          Text(
            'invite_code_subtitle'.tr,
            style: TextStyle(
              color: const Color(0xFF64748B),
              fontSize: 14.sp,
              height: 1.5,
            ),
          ),
          SizedBox(height: 24.h),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: Container(
                  height: 52.h,
                  padding: EdgeInsets.symmetric(horizontal: 16.w),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12.r),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      Text(
                        '# ',
                        style: TextStyle(
                          color: const Color(0xFF94A3B8),
                          fontSize: 18.sp,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Expanded(
                        child: TextField(
                          controller: searchController,
                          decoration: InputDecoration(
                            border: InputBorder.none,
                            hintText: 'enter_code_hint'.tr,
                            hintStyle: TextStyle(
                              color: const Color(0xFF94A3B8),
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w500,
                              letterSpacing: 1.2,
                            ),
                          ),
                          textCapitalization: TextCapitalization.characters,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                flex: 1,
                child: GestureDetector(
                  onTap: () {
                    if (searchController.text.isNotEmpty) {
                      controller.fetchGroupByInviteCode(searchController.text);
                    }
                  },
                  child: Container(
                    height: 52.h,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1A227F),
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.search, color: Colors.white, size: 20.sp),
                        SizedBox(width: 8.w),
                        Text(
                          'search'.tr,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16.sp,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          // Demo codes — visible only in Test / Sandbox mode
          if (AppConfigService.isTestMode) ...[
            SizedBox(height: 32.h),
            Container(
              padding: EdgeInsets.all(20.r),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'demo_codes'.tr,
                    style: TextStyle(
                      color: const Color(0xFF64748B),
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 12.h),
                  _buildDemoCode('Family Savings Circle', 'FAM2026XYZ'),
                  SizedBox(height: 8.h),
                  _buildDemoCode('Tech Startup Fund', 'TECH2026ABC'),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSearchResult(GroupModel group) {
    return Container(
      margin: EdgeInsets.only(top: 20.h),
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(color: const Color(0xFF60A5FA), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF60A5FA).withOpacity(0.1),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.check_circle_outline,
                color: const Color(0xFF10B981),
                size: 24.sp,
              ),
              SizedBox(width: 12.w),
              Text(
                group.name,
                style: TextStyle(
                  color: const Color(0xFF0F172A),
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          Padding(
            padding: EdgeInsets.only(left: 36.w),
            child: Text(
              group.description,
              style: TextStyle(color: const Color(0xFF64748B), fontSize: 14.sp),
            ),
          ),
          SizedBox(height: 20.h),
          Padding(
            padding: EdgeInsets.only(left: 36.w),
            child: Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 20.w,
              runSpacing: 8.h,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.groups_outlined,
                      size: 16.sp,
                      color: const Color(0xFF94A3B8),
                    ),
                    SizedBox(width: 6.w),
                    Text(
                      '${group.membersCount}/${group.totalMembers} members',
                      style: TextStyle(
                        color: const Color(0xFF64748B),
                        fontSize: 13.sp,
                      ),
                    ),
                  ],
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.attach_money,
                      size: 16.sp,
                      color: const Color(0xFF94A3B8),
                    ),
                    SizedBox(width: 4.w),
                    Text(
                      '\$${group.amount}/${group.contributionFrequency}',
                      style: TextStyle(
                        color: const Color(0xFF64748B),
                        fontSize: 13.sp,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          SizedBox(height: 16.h),
          const Divider(color: Color(0xFFF1F5F9)),
          SizedBox(height: 12.h),
          Padding(
            padding: EdgeInsets.only(left: 36.w),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 20.r,
                  backgroundImage:
                      group.adminImage != null && group.adminImage!.isNotEmpty
                      ? NetworkImage(group.adminImage!)
                      : null,
                  child: group.adminImage == null || group.adminImage!.isEmpty
                      ? Icon(
                          Icons.person,
                          size: 20.sp,
                          color: const Color(0xFF94A3B8),
                        )
                      : null,
                ),
                SizedBox(width: 12.w),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Admin',
                      style: TextStyle(
                        color: const Color(0xFF94A3B8),
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 4.h),
                    Text(
                      group.adminName ?? 'N/A',
                      style: TextStyle(
                        color: const Color(0xFF0F172A),
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          SizedBox(height: 24.h),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                if (group.inviteCode != null) {
                  controller.joinGroup(group.inviteCode!);
                } else {
                  // Fallback to search controller if inviteCode is missing in model
                  controller.joinGroup(searchController.text);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: EdgeInsets.symmetric(vertical: 14.h),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12.r),
                ),
                elevation: 0,
              ),
              child: Text(
                'Join This Group',
                style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDemoCode(String groupName, String code) {
    return GestureDetector(
      onTap: () {
        searchController.text = code;
        controller.fetchGroupByInviteCode(code);
      },
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                groupName,
                style: TextStyle(
                  color: const Color(0xFF0F172A),
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            SizedBox(width: 8.w),
            Text(
              code,
              style: TextStyle(
                color: const Color(0xFF1A227F),
                fontSize: 11.sp,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
