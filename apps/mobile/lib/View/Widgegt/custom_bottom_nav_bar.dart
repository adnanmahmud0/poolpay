import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../Utils/AppIcons/app_icons.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class CustomBottomNavBar extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const CustomBottomNavBar({
    Key? key,
    required this.currentIndex,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    double bottomPadding = MediaQuery.of(context).padding.bottom;
    return Container(
      padding: EdgeInsets.only(
        left: 16.w,
        right: 16.w,
        top: 16.h,
        bottom: bottomPadding > 0 ? bottomPadding + 8.h : 16.h,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFF1A227F),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(32.r),
          topRight: Radius.circular(32.r),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavBarItem(0, AppIcons.homeNavBar, 'Home'),
          _buildNavBarItem(1, AppIcons.groupNavBar, 'Groups'),
          _buildNavBarItem(2, AppIcons.paymentNavBar, 'Payment'),
          _buildNavBarItem(3, AppIcons.notificationNavBar, 'Alerts'),
          _buildNavBarItem(4, AppIcons.profileNavBar, 'Profile'),
        ],
      ),
    );
  }

  Widget _buildNavBarItem(int index, String iconPath, String label) {
    bool isSelected = currentIndex == index;

    if (isSelected) {
      return Container(
        padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 8.h),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30.r),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SvgPicture.asset(
              iconPath,
              height: 20.h,
              width: 20.w,
              colorFilter: const ColorFilter.mode(
                Color(0xFF1A227F),
                BlendMode.srcIn,
              ),
            ),
            SizedBox(width: 6.w),
            Text(
              label,
              style: TextStyle(
                color: const Color(0xFF1A227F),
                fontWeight: FontWeight.w700,
                fontSize: 14.sp,
              ),
            ),
          ],
        ),
      );
    } else {
      return GestureDetector(
        onTap: () => onTap(index),
        behavior: HitTestBehavior.opaque,
        child: Padding(
          padding: EdgeInsets.all(8.r),
          child: SvgPicture.asset(
            iconPath,
            height: 24.h,
            width: 24.w,
            colorFilter: const ColorFilter.mode(
              Colors.white,
              BlendMode.srcIn,
            ),
          ),
        ),
      );
    }
  }
}
