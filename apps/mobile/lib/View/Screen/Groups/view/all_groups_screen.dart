import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../controller/group_controller.dart';
import '../model/group_model.dart';
import 'active_group_details_screen.dart';

class AllGroupsScreen extends StatelessWidget {
  const AllGroupsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final GroupController controller = Get.find<GroupController>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildHeader(controller),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator());
              }
              if (controller.filteredGroups.isEmpty) {
                return _buildEmptyState();
              }
              return RefreshIndicator(
                onRefresh: controller.fetchMyGroups,
                color: const Color(0xFF1A227F),
                child: ListView.builder(
                  padding: EdgeInsets.fromLTRB(20.w, 20.h, 20.w, 100.h),
                  itemCount: controller.filteredGroups.length,
                  itemBuilder: (context, index) {
                    final group = controller.filteredGroups[index];
                    return GestureDetector(
                      onTap: () =>
                          Get.to(() => ActiveGroupDetailsScreen(group: group)),
                      child: _buildGroupCard(group),
                    );
                  },
                ),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(GroupController controller) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(12.w, 44.h, 24.w, 24.h),
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Get.back(),
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                padding: EdgeInsets.zero,
              ),
              SizedBox(width: 6.w),
              Text(
                'my_groups'.tr,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Spacer(),
              Obx(
                () => Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: 12.w,
                    vertical: 6.h,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20.r),
                  ),
                  child: Text(
                    '${controller.filteredGroups.length} ' +
                        'my_groups'.tr.split(' ').last,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          // Filter chips
          _buildFilterRow(controller),
        ],
      ),
    );
  }

  Widget _buildFilterRow(GroupController controller) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Obx(
        () => Row(
          children: controller.filters.map((filter) {
            final isSelected = controller.selectedFilter.value == filter;
            return GestureDetector(
              onTap: () => controller.setFilter(filter),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: EdgeInsets.only(right: 10.w),
                padding: EdgeInsets.symmetric(horizontal: 18.w, vertical: 8.h),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white
                      : Colors.white.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(20.r),
                ),
                child: Text(
                  filter,
                  style: TextStyle(
                    color: isSelected ? const Color(0xFF1A227F) : Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 13.sp,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildGroupCard(GroupModel group) {
    return Container(
      margin: EdgeInsets.only(bottom: 16.h),
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
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
                    fontSize: 17.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              SizedBox(width: 8.w),
              Builder(
                builder: (context) {
                  String statusLabel = group.status.toLowerCase() == 'upcoming'
                      ? 'Pending'
                      : group.status.capitalizeFirst ?? group.status;
                  Color bgColor = const Color(0xFFFEF9C3);
                  Color textColor = const Color(0xFF854D0E);

                  if (group.status.toLowerCase() == 'upcoming' ||
                      group.status.toLowerCase() == 'pending') {
                    if (group.rawStartDate != null) {
                      try {
                        final startDate = DateTime.parse(group.rawStartDate!);
                        if (startDate.isBefore(DateTime.now())) {
                          statusLabel = 'Delayed';
                          bgColor = const Color(0xFFFEE2E2);
                          textColor = const Color(0xFF991B1B);
                        }
                      } catch (_) {}
                    }
                  } else if (group.status.toLowerCase() == 'active') {
                    bgColor = const Color(0xFFDCFCE7);
                    textColor = const Color(0xFF166534);
                  }

                  return Container(
                    padding:
                        EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: bgColor,
                      borderRadius: BorderRadius.circular(20.r),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        color: textColor,
                        fontSize: 11.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
          SizedBox(height: 4.h),
          Text(
            group.description,
            style: TextStyle(fontSize: 12.sp, color: const Color(0xFF64748B)),
          ),
          SizedBox(height: 14.h),
          Row(
            children: [
              _buildInfoChip(
                Icons.groups_outlined,
                '${group.membersCount}/${group.totalMembers} members',
              ),
              SizedBox(width: 16.w),
              _buildInfoChip(
                Icons.calendar_today_outlined,
                'Pos. ${group.position}',
              ),
            ],
          ),
          SizedBox(height: 14.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  '\$${group.amount.toInt()}/${group.contributionFrequency ?? 'monthly'}',
                  style: TextStyle(
                    fontSize: 14.sp,
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
                    fontSize: 12.sp,
                    color: const Color(0xFF64748B),
                  ),
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.end,
                ),
              ),
            ],
          ),
          SizedBox(height: 10.h),
          ClipRRect(
            borderRadius: BorderRadius.circular(4.r),
            child: LinearProgressIndicator(
              value: group.progress,
              backgroundColor: const Color(0xFFE2E8F0),
              valueColor: const AlwaysStoppedAnimation<Color>(
                Color(0xFF1A227F),
              ),
              minHeight: 6,
            ),
          ),
          SizedBox(height: 6.h),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '${(group.progress * 100).toInt()}% complete',
              style: TextStyle(
                fontSize: 11.sp,
                color: const Color(0xFF1A227F),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label) {
    return Row(
      children: [
        Icon(icon, size: 14, color: const Color(0xFF94A3B8)),
        SizedBox(width: 5.w),
        Text(
          label,
          style: TextStyle(fontSize: 12.sp, color: const Color(0xFF64748B)),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.group_off_outlined,
            size: 64.sp,
            color: const Color(0xFFCBD5E1),
          ),
          SizedBox(height: 16.h),
          Text(
            "You haven't joined any groups yet",
            style: TextStyle(color: const Color(0xFF64748B), fontSize: 16.sp),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
