class ChatMessageModel {
  final String id;
  final String groupId;
  final String senderId;
  final String senderName;
  final String senderProfileImage;
  final String message;
  final String messageType;
  final String createdAt;

  ChatMessageModel({
    required this.id,
    required this.groupId,
    required this.senderId,
    required this.senderName,
    required this.senderProfileImage,
    required this.message,
    required this.messageType,
    required this.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    String sId = '';
    String sName = 'Unknown';
    String sImage = '';

    if (json['senderId'] is Map) {
      sId = json['senderId']['_id'] ?? '';
      String fName = json['senderId']['firstName'] ?? '';
      String lName = json['senderId']['lastName'] ?? '';
      sName = fName.isNotEmpty ? '$fName $lName' : 'Unknown';
      sImage = json['senderId']['profileImage'] ?? '';
    } else if (json['senderId'] is String) {
      sId = json['senderId'];
    }

    return ChatMessageModel(
      id: json['_id'] ?? '',
      groupId: json['groupId'] ?? '',
      senderId: sId,
      senderName: sName,
      senderProfileImage: sImage,
      message: json['message'] ?? '',
      messageType: json['messageType'] ?? 'text',
      createdAt: json['createdAt'] ?? DateTime.now().toIso8601String(),
    );
  }
}
