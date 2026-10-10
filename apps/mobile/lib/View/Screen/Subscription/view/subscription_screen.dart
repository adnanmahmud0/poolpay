import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import '../controller/subscription_controller.dart';

class SubscriptionScreen extends StatelessWidget {
  const SubscriptionScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final SubscriptionController controller = Get.put(SubscriptionController());

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          _buildAppBar(controller),
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(24.w),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Choose Your Plan",
                    style: TextStyle(
                      fontSize: 24.sp,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    "Upgrade to unlock premium features and increase your group creation limits.",
                    style: TextStyle(
                      fontSize: 14.sp,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  SizedBox(height: 32.h),
                  _buildCurrentStatusCard(controller),
                  SizedBox(height: 24.h),
                  _buildTierCard(
                    tier: "GUEST",
                    fallbackPrice: "Free",
                    color: const Color(0xFF94A3B8),
                    features: [
                      "Basic access to join groups",
                      "Invite only registration",
                    ],
                    restrictions: [
                      "Cannot create groups",
                      "No creator commissions",
                    ],
                    controller: controller,
                  ),
                  Obx(() {
                    if (controller.isQueryingProducts.value &&
                        controller.displayProducts.isEmpty) {
                      return Padding(
                        padding: EdgeInsets.symmetric(vertical: 32.h),
                        child: Center(
                          child: Column(
                            children: [
                              SizedBox(
                                width: 28.w,
                                height: 28.w,
                                child: const CircularProgressIndicator(
                                  color: Color(0xFF1A227F),
                                  strokeWidth: 2.5,
                                ),
                              ),
                              SizedBox(height: 12.h),
                              Text(
                                "Loading store packages...",
                                style: TextStyle(
                                  fontSize: 13.sp,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }

                    final storeProducts = controller.displayProducts;
                    if (storeProducts.isNotEmpty) {
                      return Column(
                        children: storeProducts.map((product) {
                          final idLower = product.id.toLowerCase();
                          final titleLower = product.title.toLowerCase();
                          final isVip = idLower.contains("vip") ||
                              titleLower.contains("vip");
                          final tierName = isVip ? "VIP" : "REGULAR";
                          final color = isVip
                              ? const Color(0xFF1A227F)
                              : const Color(0xFF6366F1);
                          final isPopular = !isVip;
                          final features = isVip
                              ? [
                                  "Unlimited active groups",
                                  "Full premium access",
                                  "1% creator commission",
                                  "Exclusive premium badges",
                                ]
                              : [
                                  "Create up to 1 active group",
                                  "Stripe onboarding eligible",
                                  "1% creator commission",
                                ];

                          return Padding(
                            padding: EdgeInsets.only(top: 24.h),
                            child: _buildStoreProductCard(
                              product: product,
                              tierName: tierName,
                              color: color,
                              isPopular: isPopular,
                              features: features,
                              controller: controller,
                            ),
                          );
                        }).toList(),
                      );
                    }

                    // Fallback when Google Play store products are still loading or unavailable
                    return Column(
                      children: [
                        SizedBox(height: 24.h),
                        _buildTierCard(
                          tier: "REGULAR",
                          fallbackPrice: "\$5.00",
                          period: "/ Year",
                          color: const Color(0xFF6366F1),
                          isPopular: true,
                          features: [
                            "Create up to 1 active group",
                            "Stripe onboarding eligible",
                            "1% creator commission",
                          ],
                          controller: controller,
                        ),
                        SizedBox(height: 24.h),
                        _buildTierCard(
                          tier: "VIP",
                          fallbackPrice: "\$10.00",
                          period: "/ Year",
                          color: const Color(0xFF1A227F),
                          features: [
                            "Unlimited active groups",
                            "Full premium access",
                            "1% creator commission",
                            "Exclusive premium badges",
                          ],
                          controller: controller,
                        ),
                      ],
                    );
                  }),
                  SizedBox(height: 40.h),
                  _buildAutoRenewalNote(),
                  SizedBox(height: 40.h),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAppBar(SubscriptionController controller) {
    return SliverAppBar(
      expandedHeight: 120.h,
      floating: false,
      pinned: true,
      backgroundColor: const Color(0xFF1A227F),
      flexibleSpace: FlexibleSpaceBar(
        title: Text(
          "Membership",
          style: TextStyle(
            color: Colors.white,
            fontSize: 20.sp,
            fontWeight: FontWeight.bold,
          ),
        ),
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF6773FF), Color(0xFF1A227F)],
            ),
          ),
        ),
      ),
      leading: IconButton(
        onPressed: () => Get.back(),
        icon: const Icon(Icons.arrow_back, color: Colors.white),
      ),
      actions: [
        Obx(() => controller.isRestoring.value
            ? Padding(
                padding: EdgeInsets.symmetric(horizontal: 16.w),
                child: Center(
                  child: SizedBox(
                    width: 18.w,
                    height: 18.w,
                    child: const CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  ),
                ),
              )
            : TextButton.icon(
                onPressed: () => controller.restorePurchases(),
                icon: Icon(Icons.restore, color: Colors.white, size: 18.sp),
                label: Text(
                  "Restore",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 14.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              )),
      ],
    );
  }

  Widget _buildTierCard({
    required String tier,
    required String fallbackPrice,
    String? period,
    required Color color,
    required List<String> features,
    List<String>? restrictions,
    bool isPopular = false,
    required SubscriptionController controller,
  }) {
    return Obx(() {
      final isGuest = tier.toUpperCase() == "GUEST";
      bool isCurrent =
          controller.profileController.membershipTier.value.toUpperCase() == tier.toUpperCase();
      ProductDetails? iapProduct = isGuest ? null : controller.getProduct(tier);
      String price = isGuest ? "Free" : (iapProduct?.price ?? fallbackPrice);

      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24.r),
          border: Border.all(
            color: isPopular ? color : const Color(0xFFE2E8F0),
            width: isPopular ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isPopular)
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(vertical: 8.h),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(22.r),
                    topRight: Radius.circular(22.r),
                  ),
                ),
                child: Text(
                  "MOST POPULAR",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12.sp,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
            Padding(
              padding: EdgeInsets.all(24.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        tier,
                        style: TextStyle(
                          fontSize: 20.sp,
                          fontWeight: FontWeight.bold,
                          color: color,
                        ),
                      ),
                      if (isCurrent)
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 4.h),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(20.r),
                          ),
                          child: Text(
                            "Current Plan",
                            style: TextStyle(
                              color: const Color(0xFF64748B),
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        price,
                        style: TextStyle(
                          fontSize: 32.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      if (period != null)
                        Padding(
                          padding: EdgeInsets.only(bottom: 6.h, left: 4.w),
                          child: Text(
                            period,
                            style: TextStyle(
                              fontSize: 16.sp,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                    ],
                  ),
                  SizedBox(height: 24.h),
                  const Divider(),
                  SizedBox(height: 24.h),
                  ...features.map((f) => _buildFeatureItem(f, true)),
                  if (restrictions != null)
                    ...restrictions.map((r) => _buildFeatureItem(r, false)),
                  if (tier != "GUEST") ...[
                    SizedBox(height: 32.h),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: isCurrent || controller.isLoading.value
                            ? null
                            : () => controller.upgradeTo(tier),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isPopular ? color : const Color(0xFF1A227F),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                          elevation: 0,
                          disabledBackgroundColor: const Color(0xFFE2E8F0),
                        ),
                        child: controller.isLoading.value &&
                                controller.upgradingTier.value == tier.toLowerCase()
                            ? SizedBox(
                                height: 20.h,
                                width: 20.h,
                                child: const CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                isCurrent ? "Current Plan" : "Upgrade Now",
                                style: TextStyle(
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                    if (isCurrent) ...[
                      SizedBox(height: 12.h),
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton(
                          onPressed: controller.isCancelling.value
                              ? null
                              : () => _showCancelConfirmation(controller),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: Color(0xFFEF4444)),
                            padding: EdgeInsets.symmetric(vertical: 16.h),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                          ),
                          child: controller.isCancelling.value
                              ? SizedBox(
                                  height: 20.h,
                                  width: 20.h,
                                  child: const CircularProgressIndicator(
                                    color: Color(0xFFEF4444),
                                    strokeWidth: 2,
                                  ),
                                )
                              : Text(
                                  "Cancel Plan",
                                  style: TextStyle(
                                    fontSize: 16.sp,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFFEF4444),
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ],
                ],
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildStoreProductCard({
    required ProductDetails product,
    required String tierName,
    required Color color,
    required List<String> features,
    bool isPopular = false,
    required SubscriptionController controller,
  }) {
    return Obx(() {
      bool isCurrent = controller.profileController.membershipTier.value
              .toUpperCase() ==
          tierName.toUpperCase();
      String price = product.price;

      return Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24.r),
          border: Border.all(
            color: isPopular ? color : const Color(0xFFE2E8F0),
            width: isPopular ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isPopular)
              Container(
                width: double.infinity,
                padding: EdgeInsets.symmetric(vertical: 8.h),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(22.r),
                    topRight: Radius.circular(22.r),
                  ),
                ),
                child: Text(
                  "MOST POPULAR",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12.sp,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
            Padding(
              padding: EdgeInsets.all(24.r),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        tierName,
                        style: TextStyle(
                          fontSize: 20.sp,
                          fontWeight: FontWeight.bold,
                          color: color,
                        ),
                      ),
                      if (isCurrent)
                        Container(
                          padding: EdgeInsets.symmetric(
                              horizontal: 12.w, vertical: 4.h),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(20.r),
                          ),
                          child: Text(
                            "Current Plan",
                            style: TextStyle(
                              color: const Color(0xFF64748B),
                              fontSize: 12.sp,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        price,
                        style: TextStyle(
                          fontSize: 32.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      Padding(
                        padding: EdgeInsets.only(bottom: 6.h, left: 4.w),
                        child: Text(
                          "/ Year",
                          style: TextStyle(
                            fontSize: 16.sp,
                            color: const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 24.h),
                  const Divider(),
                  SizedBox(height: 24.h),
                  ...features.map((f) => _buildFeatureItem(f, true)),
                  SizedBox(height: 32.h),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: isCurrent || controller.isLoading.value
                          ? null
                          : () => controller.buyProduct(product),
                      style: ElevatedButton.styleFrom(
                        backgroundColor:
                            isPopular ? color : const Color(0xFF1A227F),
                        foregroundColor: Colors.white,
                        padding: EdgeInsets.symmetric(vertical: 16.h),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12.r),
                        ),
                        elevation: 0,
                        disabledBackgroundColor: const Color(0xFFE2E8F0),
                      ),
                      child: controller.isLoading.value &&
                              controller.upgradingTier.value ==
                                  tierName.toLowerCase()
                          ? SizedBox(
                              height: 20.h,
                              width: 20.h,
                              child: const CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              isCurrent ? "Current Plan" : "Upgrade Now",
                              style: TextStyle(
                                fontSize: 16.sp,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                  if (isCurrent) ...[
                    SizedBox(height: 12.h),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: controller.isCancelling.value
                            ? null
                            : () => _showCancelConfirmation(controller),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFEF4444)),
                          padding: EdgeInsets.symmetric(vertical: 16.h),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r),
                          ),
                        ),
                        child: controller.isCancelling.value
                            ? SizedBox(
                                height: 20.h,
                                width: 20.h,
                                child: const CircularProgressIndicator(
                                  color: Color(0xFFEF4444),
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(
                                "Cancel Plan",
                                style: TextStyle(
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFFEF4444),
                                ),
                              ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      );
    });
  }

  Widget _buildCurrentStatusCard(SubscriptionController controller) {
    return Obx(() {
      final profile = controller.profileController;
      String providerText = profile.membershipProvider.value.isNotEmpty
          ? profile.membershipProvider.value.replaceAll('_', ' ')
          : '';

      return Container(
        padding: EdgeInsets.all(20.r),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [const Color(0xFF1A227F).withOpacity(0.05), Colors.white],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20.r),
          border: Border.all(color: const Color(0xFF1A227F).withOpacity(0.1)),
        ),
        child: Row(
          children: [
            Container(
              padding: EdgeInsets.all(12.r),
              decoration: BoxDecoration(
                color: const Color(0xFF1A227F).withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.workspace_premium, color: const Color(0xFF1A227F), size: 24.sp),
            ),
            SizedBox(width: 16.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        "Current Plan: ${profile.membershipTier.value}",
                        style: TextStyle(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      if (providerText.isNotEmpty) ...[
                        SizedBox(width: 8.w),
                        Container(
                          padding: EdgeInsets.symmetric(horizontal: 6.w, vertical: 2.h),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEEF2FF),
                            borderRadius: BorderRadius.circular(4.r),
                          ),
                          child: Text(
                            providerText,
                            style: TextStyle(
                              fontSize: 10.sp,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF6366F1),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  SizedBox(height: 4.h),
                  Row(
                    children: [
                      Icon(
                        profile.autoRenewEnabled.value ? Icons.autorenew : Icons.block,
                        size: 14.sp,
                        color: profile.autoRenewEnabled.value
                            ? const Color(0xFF10B981)
                            : const Color(0xFF94A3B8),
                      ),
                      SizedBox(width: 4.w),
                      Text(
                        profile.autoRenewEnabled.value
                            ? "Auto-renewal enabled"
                            : "Auto-renewal disabled",
                        style: TextStyle(
                          fontSize: 12.sp,
                          color: profile.autoRenewEnabled.value
                              ? const Color(0xFF10B981)
                              : const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    });
  }

  void _showCancelConfirmation(SubscriptionController controller) {
    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20.r)),
        child: Padding(
          padding: EdgeInsets.all(24.r),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: EdgeInsets.all(16.r),
                decoration: const BoxDecoration(
                  color: Color(0xFFFEF2F2),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.warning_amber_rounded,
                    color: const Color(0xFFEF4444), size: 32.sp),
              ),
              SizedBox(height: 16.h),
              Text(
                "Cancel Subscription?",
                style: TextStyle(
                  fontSize: 20.sp,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF0F172A),
                ),
              ),
              SizedBox(height: 12.h),
              Text(
                "Are you sure you want to cancel your current plan? You will lose access to premium features at the end of your billing cycle.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14.sp,
                  color: const Color(0xFF64748B),
                ),
              ),
              SizedBox(height: 24.h),
              Row(
                children: [
                  Expanded(
                    child: TextButton(
                      onPressed: () => Get.back(),
                      child: const Text("Keep Plan",
                          style: TextStyle(color: Color(0xFF64748B))),
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Get.back();
                        controller.cancelSubscription();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFEF4444),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12.r)),
                      ),
                      child: const Text("Yes, Cancel"),
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

  Widget _buildFeatureItem(String text, bool isEnabled) {
    return Padding(
      padding: EdgeInsets.only(bottom: 12.h),
      child: Row(
        children: [
          Icon(
            isEnabled ? Icons.check_circle : Icons.cancel,
            color: isEnabled ? const Color(0xFF10B981) : const Color(0xFF94A3B8),
            size: 20.sp,
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 14.sp,
                color: isEnabled ? const Color(0xFF334155) : const Color(0xFF94A3B8),
                decoration: isEnabled ? null : TextDecoration.lineThrough,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAutoRenewalNote() {
    return Container(
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: const Color(0xFFEEF2FF),
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.info_outline, color: const Color(0xFF6366F1), size: 20.sp),
              SizedBox(width: 8.w),
              Text(
                "Subscription Policy",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1A227F),
                  fontSize: 14.sp,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),
          Text(
            "Subscriptions are billed yearly and auto-renew via Google Play Store or Apple App Store. Upgrades take effect immediately upon store verification.",
            style: TextStyle(
              fontSize: 12.sp,
              color: const Color(0xFF475569),
              height: 1.5,
            ),
          ),
          SizedBox(height: 12.h),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              GestureDetector(
                onTap: () => _showLegalDialog("Terms of Use (EULA)", _getTermsText()),
                child: Text(
                  "Terms of Use (EULA)",
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: const Color(0xFF6366F1),
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 10.w),
                child: Text(
                  "•",
                  style: TextStyle(fontSize: 12.sp, color: const Color(0xFF94A3B8)),
                ),
              ),
              GestureDetector(
                onTap: () => _showLegalDialog("Privacy Policy", _getPrivacyPolicyText()),
                child: Text(
                  "Privacy Policy",
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: const Color(0xFF6366F1),
                    decoration: TextDecoration.underline,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showLegalDialog(String title, String content) {
    Get.dialog(
      Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.r)),
        child: Container(
          padding: EdgeInsets.all(20.r),
          constraints: BoxConstraints(maxHeight: 500.h, maxWidth: 400.w),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: TextStyle(fontSize: 18.sp, fontWeight: FontWeight.bold, color: const Color(0xFF1A227F)),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Get.back(),
                  ),
                ],
              ),
              const Divider(),
              Expanded(
                child: SingleChildScrollView(
                  child: Text(
                    content,
                    style: TextStyle(fontSize: 13.sp, color: const Color(0xFF334155), height: 1.6),
                  ),
                ),
              ),
              SizedBox(height: 12.h),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Get.back(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1A227F),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.r)),
                  ),
                  child: const Text("Close"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getTermsText() {
    return """POOLPAY TERMS AND CONDITIONS (EULA)
Welcome to PoolPay! By using PoolPay, you agree to this Legal Bundle, which includes our Terms & Conditions and Privacy Policy.

1. Acceptance of Terms: By registering or using PoolPay, you agree to comply with these Terms & Conditions.
2. Subscriptions: Memberships are billed yearly on Apple App Store or Google Play Store. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period.
3. Cancellations & Refunds: You can manage or cancel your subscription at any time via your App Store or Google Play account settings.
4. Support: support@poolpay.space""";
  }

  String _getPrivacyPolicyText() {
    return """POOLPAY PRIVACY POLICY
PoolPay values your privacy. We collect essential information to provide financial pooling and group management services safely.

1. Information We Collect: Account details, email, phone number, and transaction records.
2. Store Purchases: In-app purchases are processed securely via Apple StoreKit and Google Play Billing. PoolPay does not store credit card numbers.
3. Contact: For privacy questions, reach us at support@poolpay.space.""";
  }
}
