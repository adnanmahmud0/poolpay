import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../model/group_model.dart';
import '../controller/group_chat_controller.dart';

class GroupChatScreen extends StatelessWidget {
  final GroupModel group;

  const GroupChatScreen({Key? key, required this.group}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final GroupChatController controller = Get.put(
      GroupChatController(groupId: group.id),
      tag: group.id,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: Obx(() {
                  if (controller.isLoading.value) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  
                  if (controller.messages.isEmpty) {
                    return Center(
                      child: Text(
                        "No messages yet.",
                        style: TextStyle(color: const Color(0xFF64748B), fontSize: 16.sp),
                      ),
                    );
                  }
                  
                  return Column(
                    children: [
                      Expanded(
                        child: ListView.builder(
                          padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 10.h),
                          reverse: true, // Show latest messages at the bottom
                          itemCount: controller.messages.length,
                          itemBuilder: (context, index) {
                            final message = controller.messages[index];
                            final isMe = message.senderId == controller.myUserId.value;
                            
                            if (isMe) {
                              return Padding(
                                padding: EdgeInsets.only(bottom: 20.h),
                                child: _buildOutgoingMessage(
                                  message.message,
                                  _formatTime(message.createdAt),
                                  message.senderProfileImage.isNotEmpty ? message.senderProfileImage : null,
                                ),
                              );
                            } else {
                              // Check if previous message is from same user
                              bool showName = true;
                              if (index > 0 && controller.messages[index - 1].senderId == message.senderId) {
                                showName = false;
                              }
                              
                              return Padding(
                                padding: EdgeInsets.only(bottom: 20.h),
                                child: _buildIncomingMessage(
                                  message.senderName,
                                  message.message,
                                  _formatTime(message.createdAt),
                                  message.senderProfileImage.isNotEmpty ? message.senderProfileImage : null,
                                  showName: showName,
                                ),
                              );
                            }
                          },
                        ),
                      ),
                      if (controller.isTyping.value)
                        Padding(
                          padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 8.h),
                          child: Align(
                            alignment: Alignment.centerLeft,
                            child: Text(
                              controller.typingUser.value,
                              style: TextStyle(
                                color: const Color(0xFF64748B),
                                fontSize: 12.sp,
                                fontStyle: FontStyle.italic,
                              ),
                            ),
                          ),
                        ),
                    ],
                  );
                }),
              ),
              _buildMessageInput(controller),
            ],
          ),
    );
  }

  String _formatTime(String isoTime) {
    if (isoTime.isEmpty) return '';
    try {
      final date = DateTime.parse(isoTime).toLocal();
      String hour = date.hour.toString().padLeft(2, '0');
      String minute = date.minute.toString().padLeft(2, '0');
      return '$hour:$minute';
    } catch (e) {
      return '';
    }
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(12.w, 40.h, 24.w, 24.h),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
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
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                group.name,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22.sp,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${group.membersCount} Member',
                style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 14.sp,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDateSeparator(String label) {
    return Center(
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 6.h),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(20.r),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: const Color(0xFF64748B),
            fontSize: 12.sp,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildIncomingMessage(
    String name,
    String message,
    String time,
    String? avatarUrl, {
    bool showName = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showName) ...[
          Padding(
            padding: EdgeInsets.only(left: 52.w, bottom: 4.h),
            child: Text(
              name,
              style: TextStyle(
                color: const Color(0xFF0F172A),
                fontSize: 14.sp,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            CircleAvatar(
              radius: 18.r,
              backgroundColor: const Color(0xFFE2E8F0),
              backgroundImage: avatarUrl != null
                  ? NetworkImage(avatarUrl)
                  : null,
              child: avatarUrl == null
                  ? Icon(Icons.person, size: 20.r, color: Colors.white)
                  : null,
            ),
            SizedBox(width: 8.w),
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 16.w,
                      vertical: 12.h,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.only(
                        topRight: Radius.circular(16.r),
                        bottomLeft: Radius.circular(16.r),
                        bottomRight: Radius.circular(16.r),
                      ),
                    ),
                    child: Text(
                      message,
                      style: TextStyle(
                        color: const Color(0xFF1E293B),
                        fontSize: 14.sp,
                      ),
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Align(
                    alignment: Alignment.centerRight,
                    child: Text(
                      time,
                      style: TextStyle(
                        color: const Color(0xFF94A3B8),
                        fontSize: 10.sp,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(width: 40.w), // Space for outgoing
          ],
        ),
      ],
    );
  }

  Widget _buildOutgoingMessage(String message, String time, String? avatarUrl) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        SizedBox(width: 40.w), // Space for incoming
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A227F),
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(16.r),
                    bottomLeft: Radius.circular(16.r),
                    topRight: Radius.circular(16.r),
                  ),
                ),
                child: Text(
                  message,
                  style: TextStyle(color: Colors.white, fontSize: 14.sp),
                ),
              ),
              SizedBox(height: 4.h),
              Text(
                time,
                style: TextStyle(
                  color: const Color(0xFF94A3B8),
                  fontSize: 10.sp,
                ),
              ),
            ],
          ),
        ),
        SizedBox(width: 8.w),
        CircleAvatar(
          radius: 18.r,
          backgroundColor: const Color(0xFFE2E8F0),
          backgroundImage: avatarUrl != null ? NetworkImage(avatarUrl) : null,
          child: avatarUrl == null
              ? Icon(Icons.person, size: 20.r, color: Colors.white)
              : null,
        ),
      ],
    );
  }

  Widget _buildMessageInput(GroupChatController controller) {
    return Container(
      padding: EdgeInsets.fromLTRB(20.w, 12.h, 20.w, 32.h),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: const Color(0xFFF1F5F9), width: 1.h),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 16.w),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24.r),
                border: Border.all(
                  color: const Color(0xFF1A227F).withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: controller.messageController,
                      onChanged: (text) {
                        if (text.isNotEmpty) {
                          controller.sendTypingEvent(true);
                        } else {
                          controller.sendTypingEvent(false);
                        }
                      },
                      decoration: InputDecoration(
                        hintText: 'Write your message',
                        hintStyle: TextStyle(
                          color: const Color(0xFF94A3B8),
                          fontSize: 14.sp,
                        ),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                  Icon(
                    Icons.sentiment_satisfied_alt_outlined,
                    color: const Color(0xFF1A227F),
                    size: 24.sp,
                  ),
                  SizedBox(width: 12.w),
                  Icon(Icons.link, color: const Color(0xFF1A227F), size: 24.sp),
                ],
              ),
            ),
          ),
          SizedBox(width: 12.w),
          GestureDetector(
            onTap: () {
              if (!controller.isSending.value) {
                controller.sendMessage();
              }
            },
            child: Obx(() => Container(
              padding: EdgeInsets.all(12.r),
              decoration: const BoxDecoration(
                color: Color(0xFF1A227F),
                shape: BoxShape.circle,
              ),
              child: controller.isSending.value
                  ? SizedBox(
                      width: 20.sp,
                      height: 20.sp,
                      child: const CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Icon(Icons.send, color: Colors.white, size: 20.sp),
            )),
          ),
        ],
      ),
    );
  }
}
