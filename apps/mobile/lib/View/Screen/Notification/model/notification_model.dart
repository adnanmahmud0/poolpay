class NotificationModel {
  final String id;
  final String title;
  final String description;
  final String date;
  final NotificationType type;
  final bool isUnread;

  NotificationModel({
    required this.id,
    required this.title,
    required this.description,
    required this.date,
    required this.type,
    this.isUnread = false,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['_id'] ?? '',
      title: json['title'] ?? 'Notification',
      description: json['message'] ?? '',
      date: _formatDate(json['createdAt']),
      type: _parseType(json['type']),
      isUnread: !(json['isRead'] ?? true),
    );
  }

  static String _formatDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return 'N/A';
    try {
      final date = DateTime.parse(isoDate).toLocal();
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${date.day} ${months[date.month - 1]}, ${date.year}';
    } catch (e) {
      return isoDate;
    }
  }

  static NotificationType _parseType(String? typeStr) {
    if (typeStr == null) return NotificationType.reminder;
    switch (typeStr.toUpperCase()) {
      case 'PAYMENT_DUE':
      case 'PAYMENT':
        return NotificationType.payment_due;
      case 'GROUP_COMPLETED':
        return NotificationType.group_completed;
      case 'GROUP_STARTED':
      case 'REMINDER':
        return NotificationType.reminder;
      case 'INVITATION':
        return NotificationType.invitation;
      default:
        return NotificationType.reminder;
    }
  }
}

enum NotificationType {
  payment_due,
  group_completed,
  reminder,
  invitation,
}
