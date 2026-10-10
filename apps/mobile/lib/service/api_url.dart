import '../config/app_credentials.dart';

class ApiUrl {
  static const String baseUrl = AppCredentials.baseUrl;
  static const String registerUrl = '$baseUrl/api/v1/auth/register';
  static const String verifyEmailUrl = '$baseUrl/api/v1/auth/verify-email';
  static const String resendVerificationCodeUrl =
      '$baseUrl/api/v1/auth/resend-verification-code';
  static const String loginUrl = '$baseUrl/api/v1/auth/login';
  static const String refreshTokenUrl = '$baseUrl/api/v1/auth/refresh-token';
  static const String verify2FAUrl = '$baseUrl/api/v1/auth/verify-2fa';
  static const String forgotPasswordUrl = '$baseUrl/api/v1/auth/forgot-password';
  static const String resetPasswordUrl = '$baseUrl/api/v1/auth/reset-password';
  static const String getProfileUrl = '$baseUrl/api/v1/user/me';
  static const String uploadProfileImageUrl =
      '$baseUrl/api/v1/user/upload-profile-image';
  static const String groupsUrl = '$baseUrl/api/v1/groups';
  static const String joinGroupUrl = '$baseUrl/api/v1/group-members/join';
  static String getInviteGroupUrl(String inviteCode) =>
      '$baseUrl/api/v1/groups/invite/$inviteCode';
  static String updateProfileUrl(String userId) =>
      '$baseUrl/api/v1/user/$userId';
  static const String myGroupsUrl = '$baseUrl/api/v1/group-members/my-groups';
  static String groupMembersUrl(String groupId) =>
      '$baseUrl/api/v1/group-members/$groupId';
  static String groupMessagesUrl(String groupId) =>
      '$baseUrl/api/v1/chat/group/$groupId/messages';
  static String removeMemberUrl(String memberId) =>
      '$baseUrl/api/v1/group-members/$memberId/remove';
  static String penaltyNoticeUrl(String memberId) =>
      '$baseUrl/api/v1/group-members/$memberId/notice';
  static String startGroupUrl(String groupId) =>
      '$baseUrl/api/v1/groups/$groupId/start';
  static const String notificationsUrl = '$baseUrl/api/v1/notifications';

  // Payment Methods
  static const String paymentMethodsUrl = '$baseUrl/api/v1/payment-methods';
  static String deletePaymentMethodUrl(String id) =>
      '$baseUrl/api/v1/payment-methods/$id';
  static String setDefaultPaymentMethodUrl(String id) =>
      '$baseUrl/api/v1/payment-methods/$id/default';
  static const String createSetupIntentUrl =
      '$baseUrl/api/v1/payment-methods/create-setup-intent';
  static const String createEphemeralKeyUrl =
      '$baseUrl/api/v1/payment-methods/ephemeral-key';
  static const String syncSetupIntentUrl =
      '$baseUrl/api/v1/payment-methods/sync-setup-intent';
  static const String myPaymentsUrl = '$baseUrl/api/v1/payments/my-payments';

  // Stripe Connect
  static const String stripeConnectAccountLinkUrl =
      '$baseUrl/api/v1/stripe/connect/account-link';
  static const String stripeConnectStatusUrl =
      '$baseUrl/api/v1/stripe/connect/status';
  static const String stripeConnectLoginLinkUrl =
      '$baseUrl/api/v1/stripe/connect/login-link';
  static const String myStatsUrl = '$baseUrl/api/v1/user/my-stats';
  static const String membershipStatusUrl = '$baseUrl/api/v1/membership/status';
  static const String advertisementsUrl = '$baseUrl/api/v1/advertisements';
  static const String subscribeUrl = '$baseUrl/api/v1/membership/subscribe';
  static const String cancelSubscriptionUrl = '$baseUrl/api/v1/membership/cancel';

  // Mobile In-App Purchase (IAP) Endpoints
  static const String verifyGoogleUrl =
      '$baseUrl/api/v1/mobile-membership/verify-google';
  static const String verifyAppleUrl =
      '$baseUrl/api/v1/mobile-membership/verify-apple';
  static const String mobileMembershipSyncUrl =
      '$baseUrl/api/v1/mobile-membership/sync';
  static const String mobileMembershipStatusUrl =
      '$baseUrl/api/v1/mobile-membership/status';

  // Contact Settings
  static const String contactSettingsUrl = '$baseUrl/api/v1/settings/contact';

  // Account Deletion
  static const String deleteAccountRequestUrl =
      '$baseUrl/api/v1/user/delete-account-request';
}
