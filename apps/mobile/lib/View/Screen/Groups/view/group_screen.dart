import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../../../../Utils/AppIcons/app_icons.dart';
import '../controller/group_controller.dart';
import '../model/group_model.dart';
import 'create_group_screen.dart';
import 'active_group_details_screen.dart';
import 'join_group_screen.dart';
import 'all_groups_screen.dart';

class GroupScreen extends StatelessWidget {
  const GroupScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final GroupController controller = Get.put(GroupController());

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              return RefreshIndicator(
                onRefresh: controller.fetchMyGroups,
                color: const Color(0xFF1A227F),
                child: controller.filteredGroups.isEmpty
                    ? SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
                        child: Column(
                          children: [
                            _buildFilters(controller),
                            SizedBox(height: 24.h),
                            _buildActionButtons(),
                            SizedBox(height: 40.h),
                            _buildEmptyState(),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
                    itemBuilder: (context, index) {
                          final displayGroups = controller.filteredGroups.take(2).toList();
                      if (index == 0) {
                        return Column(
                          children: [
                            _buildFilters(controller),
                            SizedBox(height: 24.h),
                          ],
                        );
                      }
                      if (index == 1) {
                        return Column(
                          children: [
                            _buildActionButtons(),
                            SizedBox(height: 24.h),
                          ],
                        );
                      }
                      if (index == 2) {
                        return Padding(
                          padding: EdgeInsets.only(bottom: 16.h),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'my_groups'.tr,
                                style: TextStyle(
                                  fontSize: 18.sp,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF0F172A),
                                ),
                              ),
                              GestureDetector(
                                onTap: () => Get.to(() => const AllGroupsScreen()),
                                child: Text(
                                  'See All →',
                                  style: TextStyle(
                                    color: const Color(0xFF1A227F),
                                    fontSize: 14.sp,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      }
                      final group = displayGroups[index - 3];
                      return GestureDetector(
                        onTap: () => Get.to(() => ActiveGroupDetailsScreen(group: group)),
                        child: _buildGroupCard(group),
                      );
                    },
                    itemCount: controller.filteredGroups.take(2).length + 3,
                  ),
              );
            }),
          ),
          SizedBox(height: 100.h), // Space for bottom nav bar
        ],
      ),
    );
  }

  Widget _buildGroupCard(GroupModel group) {
    return Container(
      margin: EdgeInsets.only(bottom: 16.h),
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (group.adminImage != null && group.adminImage!.isNotEmpty)
                Padding(
                  padding: EdgeInsets.only(right: 12.w),
                  child: CircleAvatar(
                    radius: 18.r,
                    backgroundImage: NetworkImage(group.adminImage!),
                    backgroundColor: const Color(0xFFE2E8F0),
                  ),
                ),
              Expanded(
                child: Text(
                  group.name,
                  style: TextStyle(
                    fontSize: 20.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(width: 8.w),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
                decoration: BoxDecoration(
                  color: group.status.toLowerCase() == 'upcoming'
                      ? const Color(0xFFFEF9C3)
                      : const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(20.r),
                ),
                child: Text(
                  group.status.toLowerCase() == 'upcoming'
                      ? 'Pending'
                      : group.status.capitalizeFirst ?? group.status,
                  style: TextStyle(
                    color: group.status.toLowerCase() == 'upcoming'
                        ? const Color(0xFF854D0E)
                        : const Color(0xFF166534),
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 4.h),
          Text(
            group.description,
            style: TextStyle(
              fontSize: 14.sp,
              color: const Color(0xFF64748B),
            ),
          ),
          SizedBox(height: 16.h),
          Row(
            children: [
              _buildCardDetail(Icons.groups_outlined, '${group.membersCount}/${group.totalMembers} members'),
              SizedBox(width: 24.w),
              _buildCardDetail(Icons.calendar_today_outlined, 'Position ${group.position}'),
            ],
          ),
          SizedBox(height: 16.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  '\$${group.amount.toInt()}/${group.contributionFrequency ?? 'monthly'}',
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(width: 8.w),
              Flexible(
                child: Text(
                  'Next: ${group.nextDate}',
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: const Color(0xFF64748B),
                  ),
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.end,
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          ClipRRect(
            borderRadius: BorderRadius.circular(4.r),
            child: LinearProgressIndicator(
              value: group.progress,
              backgroundColor: const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1A227F)),
              minHeight: 8.h,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCardDetail(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 18.sp, color: const Color(0xFF64748B)),
        SizedBox(width: 8.w),
        Text(
          label,
          style: TextStyle(
            fontSize: 14.sp,
            color: const Color(0xFF64748B),
          ),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(24.w, 60.h, 24.w, 24.h),
      decoration: BoxDecoration(
        gradient: const RadialGradient(
          center: Alignment(0.5, -0.6),
          radius: 1.2,
          colors: [
            Color(0xFF6773FF),
            Color(0xFF1A227F),
          ],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32.r),
          bottomRight: Radius.circular(32.r),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'my_groups'.tr,
            style: TextStyle(
              color: Colors.white,
              fontSize: 32.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 20.h),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 20.w),
            height: 56.h,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(30.r),
              border: Border.all(color: Colors.white.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                Icon(Icons.search, color: Colors.white70, size: 24.sp),
                SizedBox(width: 12.w),
                Expanded(
                  child: TextField(
                    style: TextStyle(color: Colors.white, fontSize: 16.sp),
                    decoration: InputDecoration(
                      hintText: 'Search groups...',
                      hintStyle: TextStyle(
                        color: Colors.white70,
                        fontSize: 16.sp,
                      ),
                      border: InputBorder.none,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilters(GroupController controller) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: controller.filters.map((filter) {
          return Obx(() {
            bool isSelected = controller.selectedFilter.value == filter;
            return GestureDetector(
              onTap: () => controller.setFilter(filter),
              child: Container(
                margin: EdgeInsets.only(right: 12.w),
                padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 10.h),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF1A227F) : const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(24.r),
                ),
                child: Text(
                  filter,
                  style: TextStyle(
                    color: isSelected ? Colors.white : const Color(0xFF475569),
                    fontWeight: FontWeight.w600,
                    fontSize: 14.sp,
                  ),
                ),
              ),
            );
          });
        }).toList(),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: GestureDetector(
            onTap: () => Get.to(() => const CreateGroupScreen()),
            child: _buildActionButton(
              label: 'Create New',
              icon: Icons.add,
              bgColor: const Color(0xFFEEF2FF),
              iconColor: const Color(0xFF1A227F),
              border: Border.all(color: const Color(0xFF1A227F).withOpacity(0.2)),
            ),
          ),
        ),
        SizedBox(width: 16.w),
        Expanded(
          child: GestureDetector(
            onTap: () => Get.to(() => JoinGroupScreen()),
            child: _buildActionButton(
              label: 'Join Group',
              iconPath: AppIcons.groupsIcons,
              bgColor: const Color(0xFFF0FDF4),
              iconColor: const Color(0xFF22C55E),
              border: Border.all(color: const Color(0xFF22C55E).withOpacity(0.2)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required String label,
    IconData? icon,
    String? iconPath,
    required Color bgColor,
    required Color iconColor,
    BoxBorder? border,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 16.h),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16.r),
        border: border,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (icon != null) Icon(icon, color: iconColor, size: 24.sp),
          if (iconPath != null)
            SvgPicture.asset(
              iconPath,
              colorFilter: ColorFilter.mode(iconColor, BlendMode.srcIn),
              height: 20.h,
            ),
          SizedBox(width: 8.w),
          Text(
            label,
            style: TextStyle(
              color: const Color(0xFF475569),
              fontWeight: FontWeight.w600,
              fontSize: 14.sp,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 40.h, horizontal: 20.w),
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          SvgPicture.asset(
            AppIcons.groupsIcons,
            height: 80.h,
            colorFilter: ColorFilter.mode(
              const Color(0xFF94A3B8).withOpacity(0.3),
              BlendMode.srcIn,
            ),
          ),
          SizedBox(height: 20.h),
          Text(
            "You haven't joined any groups yet",
            textAlign: TextAlign.center,
            style: TextStyle(
              color: const Color(0xFF64748B),
              fontSize: 16.sp,
            ),
          ),
          SizedBox(height: 24.h),
          ElevatedButton(
            onPressed: () => Get.to(() => const CreateGroupScreen()),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A227F),
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 32.w, vertical: 16.h),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
              elevation: 0,
            ),
            child: Text(
              'Create Your First Group',
              style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }
}
