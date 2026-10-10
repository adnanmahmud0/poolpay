import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../Utils/AppIcons/app_icons.dart';
import '../controller/group_controller.dart';
import '../model/group_model.dart';
import '../model/group_member_model.dart';
import 'group_chat_screen.dart';
import '../../../Widgegt/invite_dialog.dart';

class ActiveGroupDetailsScreen extends StatefulWidget {
  final GroupModel group;

  const ActiveGroupDetailsScreen({Key? key, required this.group}) : super(key: key);

  @override
  State<ActiveGroupDetailsScreen> createState() => _ActiveGroupDetailsScreenState();
}

class _ActiveGroupDetailsScreenState extends State<ActiveGroupDetailsScreen> {
  late final GroupController controller;

  @override
  void initState() {
    super.initState();
    controller = Get.find<GroupController>();
    // Fetch fresh group details using the passed group ID
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.fetchGroupDetails(widget.group.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator(color: Color(0xFF1A227F)));
        }
        
        final currentGroup = controller.activeGroupDetails.value ?? widget.group;
        
        return Column(
          children: [
            _buildHeader(context, currentGroup),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(20.r),
                child: Column(
                  children: [
                    _buildStatusCard(currentGroup),
                    SizedBox(height: 20.h),
                    _buildStatCards(currentGroup),
                    SizedBox(height: 20.h),
                    _buildTurnQueue(currentGroup),
                    SizedBox(height: 20.h),
                    if (controller.currentUserId.value == currentGroup.creatorId && currentGroup.status.toLowerCase() == 'upcoming')
                      _buildAdminControls(context, currentGroup),
                    SizedBox(height: 20.h),
                    _buildFeeInfo(),
                    SizedBox(height: 40.h),
                  ],
                ),
              ),
            ),
          ],
        );
      }),
    );
  }

  Widget _buildHeader(BuildContext context, GroupModel currentGroup) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(12.w, 50.h, 24.w, 32.h),
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
        children: [
          Row(
            children: [
              IconButton(
                onPressed: () => Get.back(),
                icon: const Icon(Icons.arrow_back, color: Colors.white),
              ),
              if (currentGroup.adminImage != null && currentGroup.adminImage!.isNotEmpty)
                Padding(
                  padding: EdgeInsets.only(right: 12.w),
                  child: CircleAvatar(
                    radius: 20.r,
                    backgroundImage: NetworkImage(currentGroup.adminImage!),
                    backgroundColor: Colors.white.withOpacity(0.2),
                  ),
                ),
              Expanded(
                child: Text(
                  '${currentGroup.name}',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22.sp,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (Get.find<GroupController>().currentUserId.value == currentGroup.creatorId)
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert, color: Colors.white),
                  onSelected: (value) {
                    if (value == 'delete') {
                      _showDeleteDialog(context, currentGroup);
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete_outline, color: Colors.red, size: 20),
                          SizedBox(width: 8),
                          Text('Delete Group', style: TextStyle(color: Colors.red)),
                        ],
                      ),
                    ),
                  ],
                ),
            ],
          ),
          SizedBox(height: 20.h),
          Row(
            children: [
              Expanded(
                child: _buildHeaderBtn(
                  AppIcons.inviteIcons,
                  'Invite',
                  onTap: () => _showInviteDialog(context, currentGroup),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _buildHeaderBtn(
                  AppIcons.chatIcons,
                  'Chat',
                  onTap: () => Get.to(() => GroupChatScreen(group: currentGroup)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderBtn(String iconPath, String label, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 14.h),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.2),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SvgPicture.asset(
              iconPath,
              colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
              height: 20.h,
            ),
            SizedBox(width: 8.w),
            Text(
              label,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 16.sp,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(GroupModel currentGroup) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Builder(
            builder: (context) {
              String statusLabel = currentGroup.status.toLowerCase() == 'upcoming'
                  ? 'Pending'
                  : currentGroup.status.capitalizeFirst ?? currentGroup.status;
              Color bgColor = const Color(0xFFFEF9C3);
              Color textColor = const Color(0xFF854D0E);

              if (currentGroup.status.toLowerCase() == 'upcoming' ||
                  currentGroup.status.toLowerCase() == 'pending') {
                if (currentGroup.rawStartDate != null) {
                  try {
                    final startDate = DateTime.parse(currentGroup.rawStartDate!);
                    if (startDate.isBefore(DateTime.now())) {
                      statusLabel = 'Delayed: Awaiting Members';
                      bgColor = const Color(0xFFFEE2E2);
                      textColor = const Color(0xFF991B1B);
                    }
                  } catch (_) {}
                }
              } else if (currentGroup.status.toLowerCase() == 'active') {
                bgColor = const Color(0xFFDCFCE7);
                textColor = const Color(0xFF166534);
              }

              return Container(
                padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 6.h),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(20.r),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(
                    color: textColor,
                    fontSize: 12.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              );
            },
          ),
          SizedBox(height: 12.h),
          Text(
            currentGroup.description,
            style: TextStyle(
              color: const Color(0xFF64748B),
              fontSize: 14.sp,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCards(GroupModel currentGroup) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Contribution',
            '\$${currentGroup.amount.toInt()}',
            'per ${currentGroup.contributionFrequency ?? "monthly"}',
            iconPath: AppIcons.dollerIcon,
          ),
        ),
        SizedBox(width: 16.w),
        Expanded(
          child: GestureDetector(
            onTap: () => _showMembersList(context, currentGroup),
            child: _buildStatCard(
              'Members',
              '${currentGroup.membersCount}/${currentGroup.totalMembers}',
              null,
              iconPath: AppIcons.groupsIcons,
              progress: currentGroup.progress,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(String title, String value, String? subtitle, {String? iconPath, double? progress}) {
    return Container(
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (iconPath != null)
                SvgPicture.asset(
                  iconPath,
                  height: 18.h,
                  width: 18.w,
                  colorFilter: const ColorFilter.mode(Color(0xFF94A3B8), BlendMode.srcIn),
                ),
              SizedBox(width: 8.w),
              Text(
                title,
                style: TextStyle(
                  color: const Color(0xFF64748B),
                  fontSize: 14.sp,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          Text(
            value,
            style: TextStyle(
              color: const Color(0xFF0F172A),
              fontSize: 24.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          if (subtitle != null) ...[
            SizedBox(height: 4.h),
            Text(
              subtitle,
              style: TextStyle(
                color: const Color(0xFF94A3B8),
                fontSize: 12.sp,
              ),
            ),
          ],
          if (progress != null) ...[
            SizedBox(height: 12.h),
            ClipRRect(
              borderRadius: BorderRadius.circular(4.r),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: const Color(0xFFE2E8F0),
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF1A227F)),
                minHeight: 6.h,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTurnQueue(GroupModel currentGroup) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Turn Queue',
                style: TextStyle(
                  color: const Color(0xFF0F172A),
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'Round 1',
                style: TextStyle(
                  color: const Color(0xFF94A3B8),
                  fontSize: 14.sp,
                ),
              ),
            ],
          ),
          SizedBox(height: 20.h),
          if (currentGroup.members.isEmpty)
            Text(
              'No members in queue yet.',
              style: TextStyle(color: const Color(0xFF64748B), fontSize: 14.sp),
            )
          else
            ...currentGroup.members.map((member) => _buildMemberItem(currentGroup, member)).toList(),
        ],
      ),
    );
  }

  Widget _buildMemberItem(GroupModel currentGroup, GroupMemberModel member, {bool isYou = false}) {
    bool isFirst = member.position == 1;
    bool isCompleted = member.paymentStatus == 'paid';
    return Container(
      padding: EdgeInsets.symmetric(vertical: 12.h),
      child: Container(
        padding: EdgeInsets.all(16.r),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16.r),
        ),
        child: Row(
          children: [
            Container(
              width: 40.w,
              height: 40.h,
              decoration: const BoxDecoration(
                color: Color(0xFF818CF8),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Text(
                  member.position.toString(),
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16.sp),
                ),
              ),
            ),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          member.fullName,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: const Color(0xFF0F172A),
                            fontSize: 14.sp,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (isFirst) ...[
                        SizedBox(width: 4.w),
                        SvgPicture.asset(AppIcons.mukutIcon, height: 16.h),
                      ],
                    ],
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    'Contributed: \$${member.totalPaidAmount.toInt()} / ${currentGroup.totalMembers} Months',
                    style: TextStyle(
                      color: const Color(0xFF94A3B8),
                      fontSize: 12.sp,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              isCompleted ? Icons.check_circle_outline : Icons.access_time,
              color: isCompleted ? const Color(0xFF22C55E) : const Color(0xFF6366F1),
              size: 24.sp,
            ),
          ],
        ),
      ),
    );
  }

  void _showInviteDialog(BuildContext context, GroupModel currentGroup) {
    InviteDialog.show(context, groupName: currentGroup.name, inviteCode: currentGroup.inviteCode ?? 'No Code Available');
  }

  void _showMembersList(BuildContext context, GroupModel group) {
    controller.fetchGroupMembers(group.id);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
          ),
          child: Column(
            children: [
              Container(
                margin: EdgeInsets.only(top: 12.h, bottom: 20.h),
                height: 4.h,
                width: 40.w,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2.r),
                ),
              ),
              Text(
                'Group Members',
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF0F172A),
                ),
              ),
              SizedBox(height: 16.h),
              Expanded(
                child: Obx(() {
                  if (controller.isMembersLoading.value) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (controller.groupMembers.isEmpty) {
                    return const Center(child: Text("No members found."));
                  }
                  return ListView.builder(
                    padding: EdgeInsets.symmetric(horizontal: 20.w),
                    itemCount: controller.groupMembers.length,
                    itemBuilder: (context, index) {
                      final member = controller.groupMembers[index];
                      return Container(
                        margin: EdgeInsets.only(bottom: 12.h),
                        padding: EdgeInsets.all(12.r),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16.r),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                        ),
                        child: Row(
                          children: [
                            CircleAvatar(
                              radius: 24.r,
                              backgroundImage: member.profileImage.isNotEmpty ? NetworkImage(member.profileImage) : null,
                              backgroundColor: const Color(0xFFCBD5E1),
                              child: member.profileImage.isEmpty ? const Icon(Icons.person, color: Colors.white) : null,
                            ),
                            SizedBox(width: 12.w),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    member.fullName,
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14.sp,
                                      color: const Color(0xFF0F172A),
                                    ),
                                  ),
                                  SizedBox(height: 4.h),
                                  Text(
                                    'Joined: Month ${member.joinMonth} • Pos: ${member.position}',
                                    style: TextStyle(
                                      fontSize: 12.sp,
                                      color: const Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 4.h),
                              decoration: BoxDecoration(
                                color: member.status == 'active' ? const Color(0xFFDCFCE7) : const Color(0xFFFEF9C3),
                                borderRadius: BorderRadius.circular(20.r),
                              ),
                              child: Text(
                                member.status.capitalizeFirst ?? member.status,
                                style: TextStyle(
                                  color: member.status == 'active' ? const Color(0xFF166534) : const Color(0xFF854D0E),
                                  fontSize: 11.sp,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (controller.currentUserId.value == group.creatorId && controller.currentUserId.value != member.id)
                              PopupMenuButton<String>(
                                icon: Icon(Icons.more_vert, color: const Color(0xFF64748B), size: 20.sp),
                                padding: EdgeInsets.zero,
                                onSelected: (value) {
                                  if (value == 'delete') {
                                    _showRemoveMemberDialog(context, group.id, member);
                                  }
                                },
                                itemBuilder: (BuildContext context) => [
                                  PopupMenuItem<String>(
                                    value: 'notice',
                                    child: Row(
                                      children: [
                                        Icon(Icons.notification_important_outlined, color: const Color(0xFF1A227F), size: 20.sp),
                                        SizedBox(width: 8.w),
                                        const Text('Mark as Notice', style: TextStyle(color: Color(0xFF1A227F))),
                                      ],
                                    ),
                                  ),
                                  PopupMenuItem<String>(
                                    value: 'delete',
                                    child: Row(
                                      children: [
                                        const Icon(Icons.delete_outline, color: Colors.red, size: 20),
                                        SizedBox(width: 8.w),
                                        const Text('Remove Member', style: TextStyle(color: Colors.red)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                          ],
                        ),
                      );
                    },
                  );
                }),
              ),
            ],
          ),
        );
      },
    );
  }

  void _showRemoveMemberDialog(BuildContext context, String groupId, GroupMemberModel member) {
    final TextEditingController noteController = TextEditingController();
    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
        child: Padding(
          padding: EdgeInsets.all(24.r),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Remove Member',
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF0F172A),
                ),
              ),
              SizedBox(height: 8.h),
              Text(
                'Are you sure you want to remove ${member.fullName} from the group?',
                style: TextStyle(
                  fontSize: 14.sp,
                  color: const Color(0xFF64748B),
                ),
              ),
              SizedBox(height: 20.h),
              TextField(
                controller: noteController,
                decoration: InputDecoration(
                  hintText: 'Add a note (optional)',
                  hintStyle: TextStyle(fontSize: 14.sp, color: const Color(0xFF94A3B8)),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                    borderSide: const BorderSide(color: Color(0xFF1A227F)),
                  ),
                ),
                maxLines: 3,
              ),
              SizedBox(height: 24.h),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Get.back(),
                      style: OutlinedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 12.h),
                        side: const BorderSide(color: Color(0xFFE2E8F0)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
                      ),
                      child: const Text(
                        'Cancel',
                        style: TextStyle(color: Color(0xFF64748B)),
                      ),
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => controller.removeMember(groupId, member.id, noteController.text),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE50914),
                        padding: EdgeInsets.symmetric(vertical: 12.h),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
                      ),
                      child: const Text(
                        'Remove',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAdminControls(BuildContext context, GroupModel currentGroup) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Admin Controls',
            style: TextStyle(
              color: const Color(0xFF0F172A),
              fontSize: 18.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 20.h),
          _buildAdminBtn(
            'Start Group',
            currentGroup.membersCount == currentGroup.totalMembers ? const Color(0xFFE0F2FE) : const Color(0xFFF1F5F9),
            currentGroup.membersCount == currentGroup.totalMembers ? const Color(0xFF0369A1) : const Color(0xFF94A3B8),
            icon: Icons.play_arrow_rounded,
            onTap: currentGroup.membersCount == currentGroup.totalMembers
                ? () {
                    Get.find<GroupController>().startGroup(currentGroup.id);
                  }
                : () {
                    // Show a snackbar or toast
                    Get.snackbar("Wait!", "You need all members to join before starting.", snackPosition: SnackPosition.BOTTOM);
                  },
          ),
          // Optionally other admin buttons can be placed here if needed in the future
        ],
      ),
    );
  }

  Widget _buildAdminBtn(String label, Color bgColor, Color textColor, {IconData? icon, String? iconPath, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(vertical: 16.h),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (iconPath != null) ...[
              SvgPicture.asset(
                iconPath,
                colorFilter: ColorFilter.mode(textColor, BlendMode.srcIn),
                height: 20.h,
              ),
              SizedBox(width: 8.w),
            ] else if (icon != null) ...[
              Icon(icon, color: textColor, size: 20.sp),
              SizedBox(width: 8.w),
            ],
            Text(
              label,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
                fontSize: 16.sp,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, GroupModel group) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24.r),
          ),
          child: Container(
            padding: EdgeInsets.all(24.r),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Delete Group?',
                  style: TextStyle(
                    fontSize: 22.sp,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                SizedBox(height: 12.h),
                Text(
                  'This action cannot be undone. All group data will be permanently deleted.',
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: const Color(0xFF64748B),
                  ),
                ),
                SizedBox(height: 24.h),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          final groupController = Get.find<GroupController>();
                          groupController.deleteGroup(group.id);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEF4444),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          'Delete',
                          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                    SizedBox(width: 16.w),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE2E8F0),
                          foregroundColor: const Color(0xFF475569),
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          'Cancel',
                          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
  Widget _buildFeeInfo() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(20.r),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(24.r),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, color: const Color(0xFF1A227F), size: 20.sp),
              SizedBox(width: 8.w),
              Text(
                'Fee Information',
                style: TextStyle(
                  color: const Color(0xFF0F172A),
                  fontSize: 16.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          Text(
            'To maintain the platform and reward group creators, the following commissions are applied to each payout:',
            style: TextStyle(
              color: const Color(0xFF64748B),
              fontSize: 13.sp,
            ),
          ),
          SizedBox(height: 12.h),
          _buildFeeRow('Platform Commission', '1%'),
          SizedBox(height: 8.h),
          _buildFeeRow('Group Creator Commission', '1%'),
        ],
      ),
    );
  }

  Widget _buildFeeRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(color: const Color(0xFF475569), fontSize: 13.sp),
        ),
        Text(
          value,
          style: TextStyle(
            color: const Color(0xFF0F172A),
            fontSize: 13.sp,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
