import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:share_plus/share_plus.dart';

class InviteDialog extends StatelessWidget {
  final String groupName;
  final String inviteCode;

  const InviteDialog({
    Key? key,
    required this.groupName,
    required this.inviteCode,
  }) : super(key: key);

  static void show(BuildContext context, {required String groupName, required String inviteCode}) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.45),
      builder: (_) => InviteDialog(groupName: groupName, inviteCode: inviteCode),
    );
  }

  void _copyCode() {
    Clipboard.setData(ClipboardData(text: inviteCode));
    Get.snackbar(
      '',
      '',
      titleText: Row(
        children: [
          Icon(Icons.check_circle, color: const Color(0xFF166534), size: 18.sp),
          SizedBox(width: 8.w),
          Expanded(
            child: Text(
              'Invite code copied to clipboard!',
              style: TextStyle(
                color: const Color(0xFF166634),
                fontSize: 14.sp,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
      messageText: const SizedBox.shrink(),
      backgroundColor: const Color(0xFFF0FDF4),
      snackPosition: SnackPosition.TOP,
      margin: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
      borderRadius: 12.r,
      duration: const Duration(seconds: 2),
      isDismissible: true,
      padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 12.h),
      borderColor: const Color(0xFFBBF7D0),
      borderWidth: 1,
    );
  }

  void _shareCode() {
    Share.share('Join my savings group "$groupName" using the invite code: $inviteCode');
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: EdgeInsets.symmetric(horizontal: 20.w),
      backgroundColor: Colors.transparent,
      child: Container(
        width: 361.w,
        padding: EdgeInsets.all(24.r),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20.r),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildTopRow(context),
            SizedBox(height: 6.h),
            Text(
              'Share this code with people you want to invite to your group.',
              style: TextStyle(
                fontSize: 13.sp,
                color: const Color(0xFF94A3B8),
                height: 1.5,
              ),
            ),
            SizedBox(height: 20.h),
            _buildCodeCard(),
            SizedBox(height: 20.h),
            _buildButtons(context),
          ],
        ),
      ),
    );
  }

  Widget _buildTopRow(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Invite Members',
          style: TextStyle(
            fontSize: 20.sp,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF0F172A),
          ),
        ),
        GestureDetector(
          onTap: () => Navigator.pop(context),
          child: Container(
            padding: EdgeInsets.all(6.r),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.close, size: 18.sp, color: const Color(0xFF64748B)),
          ),
        ),
      ],
    );
  }

  Widget _buildCodeCard() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(vertical: 20.h, horizontal: 16.w),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFFEEF2FF),
            const Color(0xFFE0E7FF),
          ],
        ),
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFF818CF8).withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Text(
            'Your Invite Code',
            style: TextStyle(
              fontSize: 12.sp,
              color: const Color(0xFF6366F1),
              fontWeight: FontWeight.w600,
              letterSpacing: 1,
            ),
          ),
          SizedBox(height: 10.h),
          Text(
            inviteCode,
            style: TextStyle(
              fontSize: 30.sp,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1A227F),
              letterSpacing: 3,
            ),
          ),
          SizedBox(height: 14.h),
          GestureDetector(
            onTap: _copyCode,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 9.h),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24.r),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withOpacity(0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.copy_rounded, size: 15.sp, color: const Color(0xFF6366F1)),
                  SizedBox(width: 6.w),
                  Text(
                    'Copy Code',
                    style: TextStyle(
                      fontSize: 13.sp,
                      color: const Color(0xFF6366F1),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildButtons(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _shareCode,
            icon: Icon(Icons.share_rounded, size: 18.sp),
            label: Text(
              'Share',
              style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A227F),
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(vertical: 13.h),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
              elevation: 0,
            ),
          ),
        ),
        SizedBox(width: 12.w),
        Expanded(
          child: ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFF1F5F9),
              foregroundColor: const Color(0xFF475569),
              padding: EdgeInsets.symmetric(vertical: 13.h),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12.r),
              ),
              elevation: 0,
            ),
            child: Text(
              'Close',
              style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }
}
