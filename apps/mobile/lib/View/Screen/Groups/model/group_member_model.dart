class GroupMemberModel {
  final String id;
  final String firstName;
  final String lastName;
  final String profileImage;
  final int position;
  final String status;
  final int joinMonth;
  final String paymentStatus;
  final double totalPaidAmount;
  String get fullName => '$firstName $lastName';

  GroupMemberModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.profileImage,
    required this.position,
    required this.status,
    required this.joinMonth,
    this.paymentStatus = 'pending',
    this.totalPaidAmount = 0.0,
  });

  factory GroupMemberModel.fromJson(Map<String, dynamic> json) {
    final user = json['userId'] ?? {};
    return GroupMemberModel(
      id: user['_id'] ?? '',
      firstName: user['firstName'] ?? '',
      lastName: user['lastName'] ?? '',
      profileImage: user['profileImage'] ?? '',
      position: json['position'] ?? 0,
      status: json['status'] ?? 'active',
      joinMonth: json['joinMonth'] ?? 1,
      paymentStatus: json['paymentStatus'] ?? 'pending',
      totalPaidAmount: (json['totalPaidAmount'] ?? 0).toDouble(),
    );
  }
}
