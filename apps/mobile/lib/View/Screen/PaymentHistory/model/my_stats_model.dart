class MyStatsModel {
  final double totalPayout;
  final bool isDetailed;
  final List<TurnHistory> turnHistory;

  MyStatsModel({
    required this.totalPayout,
    required this.isDetailed,
    required this.turnHistory,
  });

  factory MyStatsModel.fromJson(Map<String, dynamic> json) {
    return MyStatsModel(
      totalPayout: (json['totalPayout'] ?? 0).toDouble(),
      isDetailed: json['isDetailed'] ?? false,
      turnHistory: (json['turnHistory'] as List? ?? [])
          .map((e) => TurnHistory.fromJson(e))
          .toList(),
    );
  }
}

class TurnHistory {
  final String id;
  final String groupName;
  final double amount;
  final double platformFee;
  final double creatorFee;
  final String status;
  final String date;

  TurnHistory({
    required this.id,
    required this.groupName,
    required this.amount,
    required this.platformFee,
    required this.creatorFee,
    required this.status,
    required this.date,
  });

  factory TurnHistory.fromJson(Map<String, dynamic> json) {
    String name = 'Unknown Group';
    if (json['groupName'] != null) {
      name = json['groupName'];
    } else if (json['groupId'] != null && json['groupId'] is Map) {
      name = json['groupId']['name'] ?? 'Unknown Group';
    }

    // Determine the most relevant date
    String rawDate = '';
    if (json['status'] == 'paid' && json['paidDate'] != null) {
      rawDate = json['paidDate'];
    } else {
      rawDate = json['dueDate'] ?? json['date'] ?? json['createdAt'] ?? '';
    }

    // Format date if it's a valid ISO string
    String formattedDate = rawDate;
    try {
      if (rawDate.isNotEmpty) {
        final dateTime = DateTime.parse(rawDate);
        final months = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        formattedDate = "${dateTime.day} ${months[dateTime.month - 1]}, ${dateTime.year}";
      }
    } catch (_) {}

    return TurnHistory(
      id: json['_id'] ?? json['id'] ?? '',
      groupName: name,
      amount: (json['amount'] ?? 0).toDouble(),
      platformFee: (json['platformFee'] ?? 0).toDouble(),
      creatorFee: (json['creatorFee'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      date: formattedDate,
    );
  }
}
