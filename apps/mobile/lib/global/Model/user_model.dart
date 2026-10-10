class UserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String? profileImage;
  final bool isEmailVerified;
  final bool isUpdatedProfile;
  final String role;
  final String status;

  UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    this.profileImage,
    this.isEmailVerified = false,
    this.isUpdatedProfile = false,
    this.role = 'user',
    this.status = 'active',
  });

  String get fullName => '$firstName $lastName';

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'] ?? '',
      profileImage: json['profileImage'],
      isEmailVerified: json['isEmailVerified'] ?? false,
      isUpdatedProfile: json['isUpdatedProfile'] ?? false,
      role: json['role'] ?? 'user',
      status: json['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
      'profileImage': profileImage,
      'isEmailVerified': isEmailVerified,
      'isUpdatedProfile': isUpdatedProfile,
      'role': role,
      'status': status,
    };
  }
}
