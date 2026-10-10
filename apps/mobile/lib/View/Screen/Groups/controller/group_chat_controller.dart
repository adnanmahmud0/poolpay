import 'dart:convert';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../model/chat_message_model.dart';
import '../../../../../service/api_url.dart';
import '../../../../../service/api/dio_client.dart';
import '../../../../../Utils/ToastMessage/custom_toast.dart';

class GroupChatController extends GetxController {
  final String groupId;
  final DioClient _dioClient = Get.find<DioClient>();
  
  GroupChatController({required this.groupId});

  var messages = <ChatMessageModel>[].obs;
  var isLoading = false.obs;
  var myUserId = ''.obs;
  late IO.Socket socket;
  var isTyping = false.obs;
  var typingUser = ''.obs;

  @override
  void onInit() {
    super.onInit();
    _loadUserId();
    fetchMessages();
    connectToServer();
  }

  @override
  void onClose() {
    leaveGroup(groupId);
    socket.disconnect();
    messageController.dispose();
    super.onClose();
  }

  Future<void> _loadUserId() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? userDataStr = prefs.getString('userData');
    if (userDataStr != null) {
      try {
        var userData = jsonDecode(userDataStr);
        myUserId.value = userData['_id'] ?? '';
      } catch (e) {
        // Handle error if needed
      }
    }
  }

  void connectToServer() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString('accessToken');

    socket = IO.io(ApiUrl.baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'extraHeaders': {
        'Authorization': 'Bearer $token',
      }
    });

    print('📡 Attempting to connect to Socket: ${ApiUrl.baseUrl}');
    socket.connect();

    socket.onConnect((_) {
      print('✅ Socket Connected Successfully');
      joinGroup(groupId);
    });

    socket.on('receiveMessage', (data) {
      print('📥 Message Received: $data');
      if (data != null) {
        ChatMessageModel newMessage = ChatMessageModel.fromJson(data);
        messages.insert(0, newMessage);
      }
    });

    socket.on('typing', (data) {
      print('✍️ User is typing: $data');
      if (data['senderId'] != myUserId.value) {
        isTyping.value = true;
        typingUser.value = "Someone is typing...";
      }
    });

    socket.on('stopTyping', (data) {
      print('🛑 User stopped typing: $data');
      if (data['senderId'] != myUserId.value) {
        isTyping.value = false;
      }
    });

    socket.onDisconnect((_) => print('🔌 Socket Disconnected'));
    socket.onConnectError((err) => print('❌ Socket Connection Error: $err'));
    socket.onError((err) => print('⚠️ Socket Error: $err'));
  }

  void joinGroup(String groupId) {
    print('🏠 Joining Group Room: $groupId');
    socket.emit('joinGroupRoom', groupId);
  }

  void leaveGroup(String groupId) {
    print('🚪 Leaving Group Room: $groupId');
    socket.emit('leaveGroupRoom', groupId);
  }

  void sendTypingEvent(bool typing) {
    if (typing) {
      print('📤 Emitting typing event');
      socket.emit('typing', {'groupId': groupId, 'senderId': myUserId.value});
    } else {
      print('📤 Emitting stopTyping event');
      socket.emit('stopTyping', {'groupId': groupId, 'senderId': myUserId.value});
    }
  }

  Future<void> fetchMessages() async {
    try {
      isLoading.value = true;
      
      final response = await _dioClient.get(ApiUrl.groupMessagesUrl(groupId));

      if (response.statusCode == 200) {
        if (response.data['success'] == true) {
          var messagesList = response.data['data'] as List;
          messages.value = messagesList.map((m) => ChatMessageModel.fromJson(m)).toList();
        }
      } else {
        CustomToast.showError("Error", response.data['message'] ?? "Failed to fetch messages");
      }
    } catch (e) {
      // Dio interceptor handles 401, so we only reach here for real network/server errors
      print("Error fetching messages: $e");
    } finally {
      isLoading.value = false;
    }
  }

  var isSending = false.obs;
  final messageController = TextEditingController();

  Future<void> sendMessage() async {
    final text = messageController.text.trim();
    if (text.isEmpty) return;

    // Send via Socket.io
    socket.emit('sendMessage', {
      'groupId': groupId,
      'senderId': myUserId.value,
      'message': text,
      'messageType': 'text',
    });

    messageController.clear();
    sendTypingEvent(false);
  }
}
