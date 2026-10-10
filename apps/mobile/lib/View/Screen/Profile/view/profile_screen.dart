import 'package:derival81/Utils/AppIcons/app_icons.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../controller/profile_controller.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../Language/view/language_selection_screen.dart';
import '../../Language/controller/language_controller.dart';
import '../../Payment/view/payment_screen.dart';
import '../../Subscription/view/subscription_screen.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ProfileController controller = Get.put(ProfileController());

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Obx(
        () => controller.isLoading.value
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: () async {
                  await controller.getProfile();
                  await controller.fetchMembershipStatus();
                  await controller.fetchPaymentMethodsCount();
                  await controller.fetchStripeStatus();
                },
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: Column(
                  children: [
                    _buildProfileHeader(controller),
                    Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 24),
                      child: Column(
                        children: [
                          _buildPersonalInfoCard(controller),
                          const SizedBox(height: 24),
                          _buildSecuritySettingsCard(controller),
                          const SizedBox(height: 24),
                          _buildSupportCard(controller),
                          const SizedBox(height: 32),
                          _buildLogoutButton(controller),
                          const SizedBox(height: 24),
                          Obx(
                            () => Text(
                              'Version ${controller.appVersion.value}',
                              style: const TextStyle(
                                color: Color(0xFF64748B),
                                fontSize: 14,
                              ),
                            ),
                          ),
                          const SizedBox(height: 120), // Bottom navbar padding
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
      ),
    );
  }

  Widget _buildProfileHeader(ProfileController controller) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(top: 60, bottom: 32),
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(0.5, -0.6),
          radius: 1.2,
          colors: [Color(0xFF6773FF), Color(0xFF1A227F)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: Obx(
              () => CircleAvatar(
                radius: 46,
                backgroundImage: controller.profileImage.value.isNotEmpty
                    ? NetworkImage(controller.profileImage.value)
                    : const NetworkImage(
                        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
                      ),
                backgroundColor: Colors.grey,
              ),
            ),
          ),
          const SizedBox(height: 16),
          Obx(
            () => Text(
              controller.userName.value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Obx(
            () => Text(
              controller.userEmail.value,
              style: const TextStyle(color: Colors.white70, fontSize: 16),
            ),
          ),
          const SizedBox(height: 12),
          Obx(
            () => Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: controller.membershipTier.value == 'VIP'
                    ? const Color(0xFFFFD700)
                    : (controller.membershipTier.value == 'REGULAR'
                        ? const Color(0xFFE2E8F0)
                        : Colors.white24),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                controller.membershipTier.value,
                style: TextStyle(
                  color: controller.membershipTier.value == 'VIP'
                      ? const Color(0xFF1A227F)
                      : (controller.membershipTier.value == 'REGULAR'
                          ? const Color(0xFF1A227F)
                          : Colors.white),
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPersonalInfoCard(ProfileController controller) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildInfoTile(
            iconPath: AppIcons.messgIcons,
            title: 'email'.tr,
            subtitle: Obx(
              () => Text(
                controller.userEmail.value,
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
              ),
            ),
            trailingIconPath: '', // No chevron for static info
            trailingColor: Colors.transparent,
            onTap: () {},
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          _buildInfoTile(
            iconPath: AppIcons.phoneIcons,
            title: 'phone'.tr,
            subtitle: Obx(
              () => Text(
                controller.userPhone.value,
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
              ),
            ),
            trailingIconPath: '',
            trailingColor: Colors.transparent,
            onTap: () {},
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          _buildInfoTile(
            iconPath: AppIcons.mukutIcon,
            title: 'Membership',
            subtitle: Obx(
              () => Text(
                'Plan: ${controller.membershipTier.value}',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
              ),
            ),
            trailingIconPath: AppIcons.dwIcons,
            trailingColor: const Color(0xFF94A3B8),
            isSubtitleSmaller: true,
            onTap: () => Get.to(() => const SubscriptionScreen()),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          _buildInfoTile(
            iconPath: AppIcons.debitCreditCardIcon,
            title: 'payment_methods'.tr,
            subtitle: Obx(
              () => Text(
                '${controller.linkedPaymentMethodsCount.value} ${'linked'.tr}',
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
              ),
            ),
            trailingIconPath: AppIcons.dwIcons,
            trailingColor: const Color(0xFF94A3B8),
            isSubtitleSmaller: true,
            onTap: () async {
              await Get.to(() => PaymentScreen());
              controller.fetchPaymentMethodsCount();
            },
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          _buildInfoTile(
            iconPath: AppIcons.debitCreditCardIcon,
            title: 'Payout Settings',
            subtitle: Obx(
              () => Row(
                children: [
                  Text(
                    controller.isStripeConnected.value
                        ? 'Stripe Connected'
                        : 'Not Connected',
                    style: TextStyle(
                      color: controller.isStripeConnected.value
                          ? const Color(0xFF10B981)
                          : const Color(0xFF64748B),
                      fontSize: 14,
                      fontWeight: controller.isStripeConnected.value
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                  ),
                  if (controller.isStripeConnected.value) ...[
                    const SizedBox(width: 4),
                    const Icon(Icons.verified,
                        color: Color(0xFF10B981), size: 16),
                  ],
                ],
              ),
            ),
            trailingIconPath: AppIcons.dwIcons,
            trailingColor: const Color(0xFF94A3B8),
            isSubtitleSmaller: true,
            onTap: () {
              if (controller.isStripeEligible) {
                if (controller.isStripeConnected.value) {
                  controller.accessPayoutDashboard();
                } else {
                  controller.startStripeOnboarding();
                }
              } else {
                Get.snackbar(
                  'Upgrade Required',
                  'GUEST users cannot complete Stripe onboarding. Please upgrade to REGULAR or VIP.',
                  snackPosition: SnackPosition.BOTTOM,
                  backgroundColor: Colors.orange,
                  colorText: Colors.white,
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSecuritySettingsCard(ProfileController controller) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              'security_settings'.tr,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Obx(
            () => _buildInfoTile(
              iconPath: AppIcons.twoFactorIcons,
              title: 'two_factor'.tr,
              subtitle: Text(
                controller.twoFactorEnabled.value
                    ? 'enabled'.tr
                    : 'disabled'.tr,
                style: TextStyle(
                  color: controller.twoFactorEnabled.value
                      ? const Color(0xFF10B981) // Green for enabled
                      : const Color(0xFF64748B), // Gray for disabled
                  fontSize: 14,
                  fontWeight: controller.twoFactorEnabled.value
                      ? FontWeight.w600
                      : FontWeight.w400,
                ),
              ),
              trailingIconPath: AppIcons.dwIcons,
              trailingColor: controller.twoFactorEnabled.value
                  ? const Color(0xFF10B981)
                  : const Color(0xFF94A3B8),
              iconColor: controller.twoFactorEnabled.value
                  ? const Color(0xFF10B981)
                  : const Color(0xFF64748B),
              isSubtitleSmaller: true,
              onTap: () => controller.toggleTwoFactor(),
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          _buildInfoTile(
            iconPath: AppIcons
                .appsIcons, // Using apps icon as placeholder for language
            title: 'language'.tr,
            subtitle: Obx(() {
              final languageCode = Get.find<LanguageController>()
                  .currentLocale
                  .value
                  .languageCode;
              String languageName = 'English';
              if (languageCode == 'es') languageName = 'Español';
              if (languageCode == 'fr') languageName = 'Français';
              if (languageCode == 'ht') languageName = 'Kreyòl Ayisyen';
              return Text(
                languageName,
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
              );
            }),
            trailingIconPath: AppIcons.dwIcons,
            trailingColor: const Color(0xFF94A3B8),
            isSubtitleSmaller: true,
            onTap: () {
              Get.to(() => LanguageSelectionScreen(isFirstTime: false));
            },
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          _buildInfoTile(
            iconPath: AppIcons.deleteGroupIcons,
            title: _tr('delete_account', 'Delete Account'),
            subtitle: Text(
              _tr(
                'delete_account_subtitle',
                'Request permanent closure & data erasure',
              ),
              style: const TextStyle(
                color: Color(0xFFEF4444),
                fontSize: 13,
                fontWeight: FontWeight.w400,
              ),
            ),
            trailingIconPath: AppIcons.dwIcons,
            trailingColor: const Color(0xFFEF4444),
            iconColor: const Color(0xFFEF4444),
            isSubtitleSmaller: true,
            onTap: () {
              _showDeleteAccountModal(controller);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSupportCard(ProfileController controller) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Text(
              'support'.tr,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
          _buildSimpleTile(
            iconPath: AppIcons.helpIcons,
            title: 'Terms & Conditions',
            onTap: () => _showTermsDialog(Get.context!, "Terms & Conditions"),
          ),
          _buildSimpleTile(
            iconPath: AppIcons.termsIcons,
            title: 'Privacy Policy',
            onTap: () => _showTermsDialog(Get.context!, "Privacy Policy"),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Obx(() => _buildSimpleTile(
            iconPath: AppIcons.messgIcons,
            title: 'Email: ${controller.supportEmail.value}',
            onTap: controller.openEmail,
          )),
          Obx(() => _buildSimpleTile(
            iconPath: AppIcons.phoneIcons,
            title: 'Contact: ${controller.supportPhone.value}',
            onTap: controller.callPhone,
          )),
          Obx(() => _buildSimpleTile(
            iconPath: AppIcons.whatsappIcons,
            title: 'WhatsApp: ${controller.supportWhatsapp.value}',
            onTap: controller.openWhatsapp,
          )),
        ],
      ),
    );
  }

  Widget _buildLogoutButton(ProfileController controller) {
    return InkWell(
      onTap: controller.logout,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            SvgPicture.asset(
              AppIcons.logoutIcons,
              height: 24,
              width: 24,
              colorFilter: const ColorFilter.mode(
                Color(0xFFEF4444),
                BlendMode.srcIn,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'logout'.tr,
              style: const TextStyle(
                color: Color(0xFFEF4444),
                fontWeight: FontWeight.w600,
                fontSize: 16,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile({
    required String iconPath,
    required String title,
    required Widget subtitle,
    required String trailingIconPath,
    required Color trailingColor,
    required VoidCallback onTap,
    bool isSubtitleSmaller = false,
    Color? iconColor,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          children: [
            SvgPicture.asset(
              iconPath,
              colorFilter: ColorFilter.mode(
                iconColor ?? const Color(0xFF64748B),
                BlendMode.srcIn,
              ),
              width: 24,
              height: 24,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: isSubtitleSmaller
                          ? const Color(0xFF0F172A)
                          : const Color(0xFF64748B),
                      fontSize: isSubtitleSmaller ? 16 : 14,
                      fontWeight: isSubtitleSmaller
                          ? FontWeight.w500
                          : FontWeight.normal,
                    ),
                  ),
                  const SizedBox(height: 4),
                  subtitle,
                ],
              ),
            ),
            if (trailingIconPath.isNotEmpty)
              SvgPicture.asset(
                trailingIconPath,
                colorFilter: ColorFilter.mode(trailingColor, BlendMode.srcIn),
                width: 20,
                height: 20,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSimpleTile({
    required String iconPath,
    required String title,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        child: Row(
          children: [
            SvgPicture.asset(
              iconPath,
              colorFilter: const ColorFilter.mode(
                Color(0xFF64748B),
                BlendMode.srcIn,
              ),
              width: 24,
              height: 24,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  color: Color(0xFF0F172A),
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF94A3B8), size: 20),
          ],
        ),
      ),
    );
  }
  void _showTermsDialog(BuildContext context, String title) {
    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Container(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Get.back(),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
              const Divider(),
              const SizedBox(height: 12),
              Flexible(
                child: SingleChildScrollView(
                  child: Text(
                    _getTermsText(),
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF475569),
                      height: 1.6,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Get.back(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A227F),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text("I Understand"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getTermsText() {
    return """POOLPAY TERMS AND CONDITIONS
Welcome to PoolPay! By using PoolPay, you agree to this Legal Bundle, which includes our Terms & Conditions and Privacy Policy. Please read carefully.

We provide a platform for users to pool and transfer money. We are not a bank. Users are responsible for verifying transactions before sending funds. We reserve the right to monitor, block, or reverse transactions suspected of fraud. Accounts may be suspended or terminated at any time for violations. By using this app, you agree to comply with all applicable laws and not engage in illegal activities.

1. Acceptance of Terms
By registering or using PoolPay, you agree to comply with these Terms & Conditions and all applicable laws. If you do not agree, do not use the service.

2. Eligibility
You must:
• Be at least 18 years old.
• Provide accurate and complete information during registration.
• Not use the service for any illegal activity.

3. Account Registration & Security
• You are responsible for maintaining the confidentiality of your account information, including your username, password, and 2FA codes.
• You must immediately notify PoolPay of any unauthorized use of your account.
• PoolPay reserves the right to suspend or terminate accounts showing suspicious activity.

4. How PoolPay Works
• PoolPay is a platform for pooling and transferring money.
• We are not a bank and do not hold deposits.
• Transactions are processed through authorized third-party payment processors.

5. Payments & Fees
• Transactions may incur service fees, which will be clearly displayed before confirmation.
• PoolPay may charge withdrawal or currency conversion fees.
• Users are responsible for verifying transaction details before confirming.

6. Prohibited Activities
You may not use PoolPay to:
• Commit fraud or money laundering.
• Use stolen payment methods.
• Scam, harass, or harm other users.
• Engage in any illegal activity.
Violations may result in account termination and legal action.

7. Fraud Prevention & Monitoring
• PoolPay monitors transactions for suspicious activity.
• We reserve the right to freeze, reverse, or block transactions suspected of fraud.
• Users may be required to provide additional verification.

8. Transactions & Errors
• Transactions may not be reversible.
• PoolPay is not responsible for user errors or sending funds to the wrong recipient.
• Users must double-check all transaction details before confirming.

9. Limitation of Liability
• PoolPay is not liable for any direct or indirect losses arising from:
• User errors
• Unauthorized access to accounts
• Third-party service failures
• Fraud or scams

10. Account Suspension & Termination
PoolPay may suspend, freeze, or terminate accounts for:
• Fraud or suspicious activity
• Violating these Terms
• Legal requirements

11. Third-Party Services
• PoolPay uses third-party payment processors to handle funds (Stripe).
• PoolPay is not responsible for failures or errors caused by these services.

12. Privacy & Data Protection
• We collect and use personal data as described in our Privacy Policy.
• Users consent to PoolPay’s collection, use, and storage of data to provide services.

13. Compliance with Laws
• Users must comply with all local, state, and federal laws, including:
• Anti-Money Laundering (AML)
• Know Your Customer (KYC) requirements
• PoolPay may report suspicious activity to authorities such as FinCEN.

14. Dispute Resolution
• Any disputes will be resolved through binding arbitration in [Jurisdiction].
• These Terms are governed by the laws of [your State/Country].

15. Changes to Terms
• PoolPay may update these Terms at any time.
• Updated Terms will be posted on the website and app.
• Continued use of PoolPay after updates constitutes acceptance.

16. Contact Information
If you have questions about these Terms, contact us at:
Email: support@poolpay.space""";
  }

  String _tr(String key, String fallback) {
    try {
      final res = key.tr;
      if (res.isNotEmpty && res != key) {
        return res;
      }
    } catch (_) {}
    return fallback;
  }

  void _showDeleteAccountModal(ProfileController controller) {
    final passwordController = TextEditingController();
    final reasonController = TextEditingController();
    final RxBool obscurePassword = true.obs;

    Get.bottomSheet(
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 16,
          bottom: MediaQuery.of(Get.context!).viewInsets.bottom + 24,
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Grab Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Title and Icon
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.delete_forever_rounded,
                      color: Color(0xFFEF4444),
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _tr('delete_account', 'Delete Account Request'),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          _tr(
                            'delete_account_subtitle',
                            'Review the deletion process and confirm your password',
                          ),
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Color(0xFF94A3B8)),
                    onPressed: () => Get.back(),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // How It Works Information Card
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _tr('delete_account_info', 'How Account Deletion Works'),
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildDeleteStep(
                      number: "1",
                      title: _tr('delete_step_1_title', 'Identity Verification'),
                      desc: _tr(
                        'delete_step_1_desc',
                        'Enter your account password below to verify account ownership.',
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildDeleteStep(
                      number: "2",
                      title: _tr('delete_step_2_title', 'Obligation & Pool Check'),
                      desc: _tr(
                        'delete_step_2_desc',
                        'System checks that all active pool rounds, dues, and payouts are settled.',
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildDeleteStep(
                      number: "3",
                      title: _tr('delete_step_3_title', 'Admin Compliance Review'),
                      desc: _tr(
                        'delete_step_3_desc',
                        'Our compliance team reviews and processes the request within 24-48 hours.',
                      ),
                    ),
                    const SizedBox(height: 10),
                    _buildDeleteStep(
                      number: "4",
                      title: _tr('delete_step_4_title', 'Permanent Erasure'),
                      desc: _tr(
                        'delete_step_4_desc',
                        'Once approved, your account profile, cards, and personal data are permanently deleted.',
                      ),
                      isLast: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Password Confirmation Field
              Text(
                _tr('enter_password_confirm', 'Confirm Account Password *'),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              Obx(
                () => TextField(
                  controller: passwordController,
                  obscureText: obscurePassword.value,
                  decoration: InputDecoration(
                    hintText: "••••••••",
                    hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                    prefixIcon: const Icon(
                      Icons.lock_rounded,
                      color: Color(0xFF64748B),
                      size: 20,
                    ),
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscurePassword.value
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: const Color(0xFF64748B),
                        size: 20,
                      ),
                      onPressed: () {
                        obscurePassword.toggle();
                      },
                    ),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFEF4444)),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Reason Field (Optional)
              Text(
                _tr('reason_optional', 'Reason for Leaving (Optional)'),
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 6),
              TextField(
                controller: reasonController,
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: "e.g., Closing account, switching providers...",
                  hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.all(12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFCBD5E1)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: Color(0xFF64748B)),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Action Buttons
              Row(
                children: [
                  Expanded(
                    flex: 1,
                    child: OutlinedButton(
                      onPressed: () => Get.back(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        _tr('cancel', 'Cancel'),
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: Obx(
                      () => ElevatedButton(
                        onPressed: controller.isDeleteLoading.value
                            ? null
                            : () async {
                                final pwd = passwordController.text;
                                final rsn = reasonController.text;
                                if (pwd.trim().isEmpty) {
                                  Get.snackbar(
                                    "Password Required",
                                    _tr(
                                      'enter_password_confirm',
                                      'Please enter your password to confirm',
                                    ),
                                    backgroundColor: const Color(0xFFEF4444),
                                    colorText: Colors.white,
                                    snackPosition: SnackPosition.BOTTOM,
                                    margin: const EdgeInsets.all(16),
                                  );
                                  return;
                                }

                                final success =
                                    await controller.requestAccountDeletion(
                                  password: pwd,
                                  reason: rsn,
                                );

                                if (success) {
                                  Get.back();
                                  _showDeletionSubmittedDialog();
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFEF4444),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: controller.isDeleteLoading.value
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                _tr(
                                  'submit_deletion_request',
                                  'Submit Deletion Request',
                                ),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
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

  Widget _buildDeleteStep({
    required String number,
    required String title,
    required String desc,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: isLast ? const Color(0xFFFEE2E2) : const Color(0xFFE2E8F0),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              number,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isLast ? const Color(0xFFEF4444) : const Color(0xFF475569),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: const TextStyle(
                  fontSize: 11.5,
                  color: Color(0xFF64748B),
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _showDeletionSubmittedDialog() {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.check_circle_outline, color: Color(0xFF10B981), size: 28),
            SizedBox(width: 8),
            Text(
              "Request Submitted",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: const Text(
          "Your account deletion request has been submitted to our administration team. All obligations will be reviewed before the permanent removal is finalized.",
          style: TextStyle(fontSize: 14, color: Color(0xFF475569), height: 1.4),
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Get.back(),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1A2279),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text("OK", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
