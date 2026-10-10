import 'group_member_model.dart';

class GroupModel {
  final String id;
  final String name;
  final String description;
  final String status;
  final int membersCount;
  final int totalMembers;
  final double amount;
  final int position;
  final String nextDate;
  final double progress;
  final String? adminName;
  final String? adminImage;
  final String? contributionFrequency;
  final String? rawStartDate;

  GroupModel({
    required this.id,
    required this.name,
    this.description = "Monthly savings for family members",
    required this.status,
    required this.membersCount,
    this.totalMembers = 10,
    required this.amount,
    this.position = 8,
    this.nextDate = "4/1/2026",
    this.progress = 0.8,
    this.adminName,
    this.adminImage,
    this.contributionFrequency,
    this.rawStartDate,
    this.inviteCode,
    this.creatorId,
    this.members = const [],
  });

  final String? inviteCode;
  final String? creatorId;
  final List<GroupMemberModel> members;

  factory GroupModel.fromJson(Map<String, dynamic> json) {
    var membersList = json['members'] as List? ?? [];
    List<GroupMemberModel> parsedMembers = membersList.map((m) => GroupMemberModel.fromJson(m)).toList();
    
    // Sort members by position for the turn queue
    parsedMembers.sort((a, b) => a.position.compareTo(b.position));

    return GroupModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? 'Monthly savings for family members',
      status: json['status'] ?? 'active',
      membersCount: json['currentMembers'] ?? 0,
      totalMembers: json['totalMembers'] ?? 10,
      amount: (json['contributionAmount'] ?? 0).toDouble(),
      position: 1, // Default value as it's not in the invite API response
      nextDate: _formatDate(json['startDate']),

      progress: (json['currentMembers'] ?? 0) / (json['totalMembers'] ?? 1),
      adminName: json['createdBy'] != null
          ? "${json['createdBy']['firstName'] ?? ''} ${json['createdBy']['lastName'] ?? ''}".trim()
          : 'Unknown',
      adminImage: json['createdBy'] != null
          ? json['createdBy']['profileImage']
          : null,
      contributionFrequency: json['contributionFrequency'] ?? 'monthly',
      rawStartDate: json['startDate'],
      inviteCode: json['inviteCode'],
      creatorId: json['createdBy'] != null ? json['createdBy']['_id'] : null,
      members: parsedMembers,
    );
  }

  static String _formatDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty || isoDate == 'N/A') return 'N/A';
    try {
      final date = DateTime.parse(isoDate).toLocal();
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${date.day} ${months[date.month - 1]}, ${date.year}';
    } catch (e) {
      return isoDate; // fallback to original string if parsing fails
    }
  }
}
