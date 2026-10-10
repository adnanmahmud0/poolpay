import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import '../../../../../Utils/AppIcons/app_icons.dart';
import '../controller/payment_method_controller.dart';
import '../model/payment_method_model.dart';
import '../../../Payment/view/payment_methods_info_screen.dart';

class PaymentMethodScreen extends StatelessWidget {
  PaymentMethodScreen({Key? key}) : super(key: key);

  final PaymentMethodController controller = Get.put(PaymentMethodController());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // ── Scrollable Body ──────────────────────────────────────────
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                    horizontal: 24.0, vertical: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Header row
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Align(
                          alignment: Alignment.centerLeft,
                          child: IconButton(
                            icon: const Icon(Icons.arrow_back,
                                color: Color(0xFF0F172A)),
                            onPressed: () => Get.back(),
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                        ),
                        Container(
                          height: 64,
                          width: 64,
                          decoration: const BoxDecoration(
                            color: Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: SvgPicture.asset(
                              AppIcons.appsIcons,
                              height: 32,
                              width: 32,
                            ),
                          ),
                        ),
                        Align(
                          alignment: Alignment.centerRight,
                          child: IconButton(
                            icon: const Icon(Icons.info_outline_rounded,
                                color: Color(0xFF1A227F)),
                            onPressed: () => Get.to(
                              () => const PaymentMethodsInfoScreen(),
                              transition: Transition.rightToLeft,
                            ),
                            tooltip: 'Supported Payment Methods',
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Title
                    Text(
                      'link_payment_title'.tr,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Subtitle
                    Text(
                      'link_payment_subtitle'.tr,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF4A5565),
                        fontWeight: FontWeight.w400,
                        height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // ── Saved Payment Methods ─────────────────────────────
                    Obx(() {
                      if (controller.isLoading.value) {
                        return const Center(
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 24),
                            child: CircularProgressIndicator(
                                color: Color(0xFF1A227F)),
                          ),
                        );
                      }

                      if (controller.savedMethods.isEmpty) {
                        return _buildEmptyState();
                      }

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Saved Payment Methods',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 12),
                          ...controller.savedMethods
                              .map((method) => _buildSavedMethodCard(context, method)),
                        ],
                      );
                    }),

                    const SizedBox(height: 24),

                    // ── Add Payment Method Button ──────────────────────────
                    Obx(() => _buildAddPaymentButton()),

                    const SizedBox(height: 16),

                    // ── Supported Payment Methods Banner ───────────────────
                    _buildSupportedMethodsBanner(),

                    const SizedBox(height: 28),

                    // ── Payout Settings ───────────────────────────────────
                    _buildPayoutSection(),

                    const SizedBox(height: 24),

                    // ── Security Note ─────────────────────────────────────
                    _buildSecurityNote(),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // ── Bottom Actions ────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(
                  horizontal: 24.0, vertical: 16.0),
              child: Column(
                children: [
                  Obx(
                    () => controller.savedMethods.isNotEmpty
                        ? Padding(
                            padding: const EdgeInsets.only(bottom: 12.0),
                            child: SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: () =>
                                    controller.continueToDashboard(),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF1A227F),
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 16),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                                child: const Text(
                                  'Continue to Dashboard',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => controller.skipForNow(),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE2E8F0),
                        foregroundColor: const Color(0xFF4A5565),
                        elevation: 0,
                        padding:
                            const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Skip for now',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Widgets ───────────────────────────────────────────────────────────────

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: const Center(
        child: Text(
          'No payment methods yet.\nTap below to add one.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 14,
            height: 1.6,
          ),
        ),
      ),
    );
  }

  Widget _buildSupportedMethodsBanner() {
    return GestureDetector(
      onTap: () => Get.to(
        () => const PaymentMethodsInfoScreen(),
        transition: Transition.rightToLeft,
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFBFDBFE)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFDBEAFE),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.account_balance_wallet_outlined,
                color: Color(0xFF1D4ED8),
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    '21 Supported Payment Methods',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1E3A8A),
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Cards, ACH Bank, Link, Pix, BLIK & fees info',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF3B82F6),
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              color: Color(0xFF3B82F6),
              size: 14,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddPaymentButton() {
    final isLoading = controller.isSheetLoading.value;

    return GestureDetector(
      onTap: isLoading ? null : () => controller.openStripePaymentSheet(),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isLoading
              ? const Color(0xFFF1F5F9)
              : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isLoading
                ? const Color(0xFFE2E8F0)
                : const Color(0xFF1A227F),
            width: 1.5,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFEEF2FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: SvgPicture.asset(
                AppIcons.debitCreditCardIcon,
                height: 22,
                width: 22,
                colorFilter: const ColorFilter.mode(
                  Color(0xFF1A227F),
                  BlendMode.srcIn,
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isLoading ? 'Opening Stripe...' : '+ Add Payment Method',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: isLoading
                          ? const Color(0xFF94A3B8)
                          : const Color(0xFF1A227F),
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Card, debit, or bank account via Stripe',
                    style: TextStyle(
                      fontSize: 12,
                      color: Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ),
            isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Color(0xFF94A3B8),
                    ),
                  )
                : const Icon(
                    Icons.chevron_right_rounded,
                    color: Color(0xFF1A227F),
                    size: 24,
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildSavedMethodCard(BuildContext context, PaymentMethodModel method) {
    final isBank = method.type == 'bank';
    final icon =
        isBank ? AppIcons.bankIcons : AppIcons.debitCreditCardIcon;

    return GestureDetector(
      onTap: () => controller.setDefaultMethod(method.id),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: method.isDefault
              ? const Color(0xFFF0FDF4)
              : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: method.isDefault
                ? const Color(0xFF22C55E)
                : const Color(0xFFE2E8F0),
            width: method.isDefault ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: method.isDefault
                    ? const Color(0xFFDCFCE7)
                    : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: SvgPicture.asset(
                icon,
                height: 20,
                width: 20,
                colorFilter: ColorFilter.mode(
                  method.isDefault
                      ? const Color(0xFF22C55E)
                      : const Color(0xFF94A3B8),
                  BlendMode.srcIn,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      Text(
                        method.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      if (method.isDefault)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text(
                            'Default for AutoPay',
                            style: TextStyle(
                              color: Color(0xFF16A34A),
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                    ],
                  ),
                  Text(
                    method.lastDigits,
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF4A5565),
                    ),
                  ),
                  if (method.expiryFormatted.isNotEmpty)
                    Text(
                      'Exp: ${method.expiryFormatted}',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF94A3B8),
                      ),
                    ),
                ],
              ),
            ),
            if (method.isDefault)
              const Icon(Icons.check_circle,
                  color: Color(0xFF22C55E), size: 24)
            else
              const Icon(Icons.circle_outlined,
                  color: Color(0xFFCBD5E1), size: 24),
            const SizedBox(width: 10),
            GestureDetector(
              onTap: () => _showDeleteDialog(context, method),
              child: const Padding(
                padding: EdgeInsets.all(4.0),
                child: Icon(
                  Icons.delete_outline,
                  color: Color(0xFFEF4444),
                  size: 22,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteDialog(BuildContext context, PaymentMethodModel method) {
    Get.dialog(
      AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Remove Payment Method',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        content: Text(
          'Are you sure you want to remove ${method.name} (${method.lastDigits})?',
          style: const TextStyle(fontSize: 14, color: Color(0xFF475569)),
        ),
        actions: [
          TextButton(
            onPressed: () => Get.back(),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B))),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Get.back();
              controller.deletePaymentMethod(method.id);
            },
            child: const Text('Remove', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildPayoutSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Payout Settings',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              Obx(() => Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: controller.isStripeConnected.value
                      ? const Color(0xFFECFDF5)
                      : const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: controller.isStripeConnected.value
                        ? const Color(0xFF10B981)
                        : const Color(0xFFF59E0B),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      controller.isStripeConnected.value
                          ? Icons.check_circle
                          : Icons.pending_outlined,
                      size: 14,
                      color: controller.isStripeConnected.value
                          ? const Color(0xFF10B981)
                          : const Color(0xFFF59E0B),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      controller.isStripeConnected.value
                          ? 'Payouts Active'
                          : 'Pending Setup',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: controller.isStripeConnected.value
                            ? const Color(0xFF047857)
                            : const Color(0xFFB45309),
                      ),
                    ),
                  ],
                ),
              )),
            ],
          ),
          const SizedBox(height: 8),
          Obx(() => Text(
            controller.isStripeConnected.value
                ? 'Your Stripe Connect account is linked and ready to receive group payouts automatically.'
                : 'Connect your bank account or debit card via Stripe to receive your savings turn payouts.',
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF4A5565),
              height: 1.5,
            ),
          )),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: Obx(
              () => ElevatedButton(
                onPressed: controller.isConnectLoading.value
                    ? null
                    : () {
                        if (controller.isStripeConnected.value) {
                          controller.accessPayoutDashboard();
                        } else {
                          controller.startStripeOnboarding();
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: controller.isStripeConnected.value
                      ? const Color(0xFFE2E8F0)
                      : const Color(0xFF6773FF),
                  foregroundColor: controller.isStripeConnected.value
                      ? const Color(0xFF0F172A)
                      : Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: controller.isConnectLoading.value
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(
                        controller.isStripeConnected.value
                            ? 'View Payout Dashboard'
                            : 'Connect Stripe Account',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityNote() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9).withOpacity(0.6),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('🔒', style: TextStyle(fontSize: 16)),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'security_note'.tr,
              style: TextStyle(
                fontSize: 13,
                color: const Color(0xFF4A5565).withOpacity(0.8),
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
