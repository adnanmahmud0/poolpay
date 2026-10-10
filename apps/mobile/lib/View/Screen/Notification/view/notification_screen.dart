import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import '../../../../Utils/AppIcons/app_icons.dart';
import '../controller/notification_controller.dart';
import '../model/notification_model.dart';

import 'package:flutter_screenutil/flutter_screenutil.dart';

class NotificationScreen extends StatelessWidget {
  const NotificationScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final NotificationController controller = Get.put(NotificationController());

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildHeader(controller),
          Expanded(
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(child: CircularProgressIndicator(color: Color(0xFF1A227F)));
              }

              if (controller.notifications.isEmpty) {
                return Center(
                  child: Text(
                    'No notifications yet.',
                    style: TextStyle(
                      color: const Color(0xFF64748B),
                      fontSize: 16.sp,
                    ),
                  ),
                );
              }

              return ListView.builder(
                controller: controller.scrollController,
                padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
                itemCount: controller.notifications.length + (controller.isFetchingMore.value ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == controller.notifications.length) {
                    return Padding(
                      padding: EdgeInsets.symmetric(vertical: 16.h),
                      child: const Center(
                        child: CircularProgressIndicator(color: Color(0xFF1A227F)),
                      ),
                    );
                  }
                  return _buildNotificationCard(controller.notifications[index]);
                },
              );
            }),
          ),
          SizedBox(height: 100.h), // Space for bottom nav bar
        ],
      ),
    );
  }

  Widget _buildHeader(NotificationController controller) {
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
            'Notifications',
            style: TextStyle(
              color: Colors.white,
              fontSize: 32.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 4.h),
          Obx(
            () => Text(
              '${controller.unreadCount.value} unread',
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 16.sp,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(NotificationModel notification) {
    return Container(
      margin: EdgeInsets.only(bottom: 16.h),
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20.r),
        border: Border.all(
          color: notification.isUnread ? const Color(0xFF6773FF).withOpacity(0.3) : const Color(0xFFF1F5F9),
          width: 1.w,
        ),
        boxShadow: [
          if (notification.isUnread)
            BoxShadow(
              color: const Color(0xFF6773FF).withOpacity(0.05),
              blurRadius: 10.r,
              offset: Offset(0, 4.h),
            ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildIcon(notification),
              SizedBox(width: 16.w),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.title,
                      style: TextStyle(
                        fontSize: 18.sp,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      notification.description,
                      style: TextStyle(
                        fontSize: 14.sp,
                        color: const Color(0xFF64748B),
                        height: 1.5,
                      ),
                    ),
                    SizedBox(height: 12.h),
                    Text(
                      notification.date,
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: const Color(0xFF94A3B8),
                      ),
                    ),
                  ],
                ),
              ),
              if (notification.isUnread)
                Container(
                  width: 8.w,
                  height: 8.h,
                  decoration: const BoxDecoration(
                    color: Color(0xFF1A227F),
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
          // SizedBox(height: 16.h),
          // const Divider(height: 1, color: Color(0xFFF1F5F9)),
          // SizedBox(height: 12.h),
          // InkWell(
          //   onTap: () {},
          //   child: Row(
          //     children: [
          //       Text(
          //         'View Group',
          //         style: TextStyle(
          //           color: const Color(0xFF1A227F),
          //           fontWeight: FontWeight.w600,
          //           fontSize: 14.sp,
          //         ),
          //       ),
          //       SizedBox(width: 4.w),
          //       Icon(
          //         Icons.arrow_forward,
          //         size: 16.sp,
          //         color: const Color(0xFF1A227F),
          //       ),
          //     ],
          //   ),
          // ),
        ],
      ),
    );
  }

  Widget _buildIcon(NotificationModel notification) {
    Color bgColor;
    Color iconColor;
    String? iconPath;
    IconData? materialIcon;
    String? emojiIcon;

    switch (notification.type) {
      case NotificationType.payment_due:
        if (notification.description.toLowerCase().contains('bonus')) {
          bgColor = const Color(0xFFFEF3C7);
          iconColor = const Color(0xFFD97706);
          emojiIcon = "💰";
        } else {
          bgColor = const Color(0xFFDCFCE7);
          iconColor = const Color(0xFF22C55E);
          iconPath = "assets/icons/doller.svg";
        }
        break;
      case NotificationType.group_completed:
        bgColor = const Color(0xFFDBEAFE);
        iconColor = const Color(0xFF2563EB);
        materialIcon = Icons.check_circle_outline;
        break;
      case NotificationType.reminder:
        bgColor = const Color(0xFFEEF2FF);
        iconColor = const Color(0xFF6366F1);
        materialIcon = Icons.calendar_today_outlined;
        break;
      case NotificationType.invitation:
        bgColor = const Color(0xFFF5F3FF);
        iconColor = const Color(0xFF8B5CF6);
        iconPath = AppIcons.groupsIcons;
        break;
    }

    return Container(
      width: 48.w,
      height: 48.h,
      decoration: BoxDecoration(
        color: bgColor,
        shape: BoxShape.circle,
      ),
      padding: EdgeInsets.all(10.r),
      child: Center(
        child: emojiIcon != null
            ? Text(emojiIcon, style: TextStyle(fontSize: 24.sp))
            : materialIcon != null
                ? Icon(materialIcon, color: iconColor, size: 24.sp)
                : SvgPicture.asset(
                    iconPath!,
                    colorFilter: ColorFilter.mode(iconColor, BlendMode.srcIn),
                  ),
      ),
    );
  }
}
