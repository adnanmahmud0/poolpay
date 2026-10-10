import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import 'package:pinput/pinput.dart';
import '../../../../../Utils/AppIcons/app_icons.dart';
import '../controller/otp_controller.dart';

class OtpScreen extends StatelessWidget {
  OtpScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final OtpController controller = Get.put(OtpController());
    final defaultPinTheme = PinTheme(
      width: 48,
      height: 48,
      textStyle: const TextStyle(
        fontSize: 20,
        color: Color(0xFF0F172A),
        fontWeight: FontWeight.w700,
      ),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
    );

    final focusedPinTheme = defaultPinTheme.copyDecorationWith(
      color: Colors.white,
      border: Border.all(color: const Color(0xFF1A227F), width: 1.5),
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              // Back Button
              Align(
                alignment: Alignment.centerLeft,
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: Color(0xFF0F172A)),
                  onPressed: () => Get.back(),
                ),
              ),

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
              const SizedBox(height: 32),

              // Title
              Text(
                'otp_title'.tr,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 12),

              // Subtitle
              Obx(() => Text(
                'Enter the 6-digit code sent to ${controller.channel.value}',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF64748B),
                  fontWeight: FontWeight.w400,
                ),
              )),
              const SizedBox(height: 4),
              Obx(() => Text(
                controller.email.value,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 16,
                  color: Color(0xFF0F172A),
                  fontWeight: FontWeight.w600,
                ),
              )),
              const SizedBox(height: 48),

              // OTP Input
              Center(
                child: Pinput(
                  length: 6,
                  controller: controller.otpController,
                  defaultPinTheme: defaultPinTheme,
                  focusedPinTheme: focusedPinTheme,
                  showCursor: true,
                  onCompleted: (pin) => controller.confirmOtp(),
                ),
              ),
              const SizedBox(height: 48),

              // Confirm OTP Button
              SizedBox(
                width: double.infinity,
                child: Obx(() => ElevatedButton(
                  onPressed: controller.isLoading.value ? null : () => controller.confirmOtp(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A227F),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                  child: controller.isLoading.value
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          'confirm_otp'.tr,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                )),
              ),
              const SizedBox(height: 12),
              Obx(() {
                if (controller.lockoutTime.value > 0) {
                  int minutes = controller.lockoutTime.value ~/ 60;
                  int seconds = controller.lockoutTime.value % 60;
                  return Text(
                    "Account locked. Try again in $minutes:${seconds.toString().padLeft(2, '0')}",
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red, fontWeight: FontWeight.w600),
                  );
                }
                return const SizedBox.shrink();
              }),
              const SizedBox(height: 24),
              // Resend OTP Link
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Didn't receive the code? ",
                    style: const TextStyle(
                      color: Color(0xFF4A5565),
                      fontSize: 14,
                    ),
                  ),
                  Obx(() => controller.isResendEnabled.value
                      ? GestureDetector(
                          onTap: () => controller.resendOtp(),
                          child: Text(
                            "Resend",
                            style: const TextStyle(
                              color: Color(0xFF1A227F),
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        )
                      : Text(
                          "Resend in ${controller.resendCooldown.value ~/ 60}:${(controller.resendCooldown.value % 60).toString().padLeft(2, '0')}",
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 14,
                          ),
                        )),
                ],
              ),
              const SizedBox(height: 24),

              // Back to Email Link
              GestureDetector(
                onTap: () => Get.back(),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.arrow_back, size: 18, color: Color(0xFF4A5565)),
                    const SizedBox(width: 8),
                    Text(
                      'back_email'.tr,
                      style: const TextStyle(
                        color: Color(0xFF4A5565),
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
