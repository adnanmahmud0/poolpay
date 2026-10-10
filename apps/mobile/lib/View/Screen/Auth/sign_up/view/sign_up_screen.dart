import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../Widgegt/custom_textfield.dart';
import '../controller/sign_up_controller.dart';
import '../../login/view/login_screen.dart';
import 'package:intl_phone_field/intl_phone_field.dart';

class SignUpScreen extends StatelessWidget {
  SignUpScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Initialize the Controller
    final SignUpController controller = Get.put(SignUpController());
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 16),
              // Top Logo Icon
              Center(
                child: Container(
                  height: 120,
                  width: 120,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Image.asset(
                      'assets/images/Apps-Logo.png',
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Title
              Text(
                'signup_title'.tr,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              // Subtitle
              Text(
                'signup_subtitle'.tr,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF4A5565),
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 32),

              // Form fields
              Row(
                children: [
                  Expanded(
                    child: CustomTextField(
                      label: 'first_name'.tr,
                      hintText: 'John',
                      controller: controller.firstNameController,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: CustomTextField(
                      label: 'last_name'.tr,
                      hintText: 'Doe',
                      controller: controller.lastNameController,
                    ),
                  ),
                ],
              ),
              CustomTextField(
                label: 'email_address'.tr,
                hintText: 'email@example.com',
                controller: controller.emailController,
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'phone_number'.tr,
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 8),
                  IntlPhoneField(
                    controller: controller.phoneController,
                    decoration: InputDecoration(
                      hintText: '+1 (555) 000-0000',
                      hintStyle: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 16,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(16),
                        borderSide: const BorderSide(color: Color(0xFF1A227F)),
                      ),
                    ),
                    initialCountryCode:
                        'US', // You can change default country here
                    disableLengthCheck: true,
                    onChanged: (phone) {
                      controller.fullPhoneNumber = phone.completeNumber;
                    },
                    style: const TextStyle(
                      color: Color(0xFF0F172A),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                    dropdownIconPosition: IconPosition.trailing,
                    flagsButtonPadding: const EdgeInsets.only(left: 16),
                  ),
                ],
              ),
              CustomTextField(
                label: 'password'.tr,
                hintText: 'password_hint'.tr,
                isPassword: true,
                controller: controller.passwordController,
              ),
              CustomTextField(
                label: 'confirm_password'.tr,
                hintText: 'password_hint'.tr,
                isPassword: true,
                controller: controller.confirmPasswordController,
              ),

              // SMS Consent Checkbox
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 24,
                    width: 24,
                    child: Obx(
                      () => Checkbox(
                        value: controller.agreeToSms.value,
                        activeColor: const Color(0xFF1A227F),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4),
                        ),
                        side: const BorderSide(color: Color(0xFF94A3B8)),
                        onChanged: (value) {
                          controller.toggleSmsCheckbox(value ?? false);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      "By checking, you are allowing to receive transactional/informational SMS communications regarding account verification, authentication, and security purposes from PoolPay. Message frequency may vary, Message and data rates may apply, reply HELP for help or STOP to opt-out.",
                      style: TextStyle(
                        color: Color(0xFF4A5565),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Forfeit on Removal Checkbox
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 24,
                    width: 24,
                    child: Obx(
                      () => Checkbox(
                        value: controller.agreeToForfeitOnRemoval.value,
                        activeColor: const Color(0xFF1A227F),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4),
                        ),
                        side: const BorderSide(color: Color(0xFF94A3B8)),
                        onChanged: (value) {
                          controller.toggleForfeitCheckbox(value ?? false);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      "I agree that if I start a payment circle and quit after making partial payments, my account will be removed after notification attempts, and any payments I have already made will be forfeited to the platform.",
                      style: TextStyle(
                        color: Color(0xFF4A5565),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Terms & Conditions Checkbox
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    height: 24,
                    width: 24,
                    child: Obx(
                      () => Checkbox(
                        value: controller.isChecked.value,
                        activeColor: const Color(0xFF1A227F),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4),
                        ),
                        side: const BorderSide(color: Color(0xFF94A3B8)),
                        onChanged: (value) {
                          controller.toggleCheckbox(value ?? false);
                        },
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: RichText(
                      text: TextSpan(
                        text: 'agree_terms'.tr,
                        style: const TextStyle(
                          color: Color(0xFF4A5565),
                          fontSize: 13,
                          height: 1.4,
                        ),
                        children: [
                          TextSpan(
                            text: 'terms_conditions'.tr,
                            style: const TextStyle(
                              color: Color(0xFF155DFC),
                              fontWeight: FontWeight.w600,
                            ),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () => _showTermsDialog(context, "Terms & Conditions"),
                          ),
                          TextSpan(text: ' ${'and'.tr} '),
                          TextSpan(
                            text: 'privacy_policy'.tr,
                            style: const TextStyle(
                              color: Color(0xFF155DFC),
                              fontWeight: FontWeight.w600,
                            ),
                            recognizer: TapGestureRecognizer()
                              ..onTap = () => _showTermsDialog(context, "Privacy Policy"),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Sign Up Button
              Obx(
                () => ElevatedButton(
                  onPressed: controller.isLoading.value
                      ? null
                      : () {
                          controller.signUpUser();
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A227F),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  child: controller.isLoading.value
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          'signup_link'.tr,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 24),

              // Login Text
              GestureDetector(
                onTap: () => Get.offAll(() => LoginScreen()),
                child: Center(
                  child: RichText(
                    text: TextSpan(
                      text: 'already_account'.tr,
                      style: const TextStyle(
                        color: Color(0xFF4A5565),
                        fontSize: 14,
                      ),
                      children: [
                        TextSpan(
                          text: 'login_button'.tr,
                          style: const TextStyle(
                            color: Color(0xFF1A227F),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
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
}
