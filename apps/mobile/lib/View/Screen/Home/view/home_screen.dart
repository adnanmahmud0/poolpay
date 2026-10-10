import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:get/get.dart';
import '../../../../Utils/AppIcons/app_icons.dart';
import '../../../Widgegt/custom_bottom_nav_bar.dart';
import '../controller/home_controller.dart';
import '../../../../config/app_config_service.dart';
import '../../Notification/view/notification_screen.dart';
import '../../Groups/view/group_screen.dart';
import '../../Groups/controller/group_controller.dart';
import '../../Groups/view/create_group_screen.dart';
import '../../Groups/view/active_group_details_screen.dart';
import '../../Groups/view/join_group_screen.dart';
import '../../Groups/view/all_groups_screen.dart';
import '../../Payment/view/payment_screen.dart';
import '../../Profile/view/profile_screen.dart';

class HomeScreen extends StatelessWidget {
  HomeScreen({Key? key}) : super(key: key);

  final HomeController controller = Get.put(HomeController());
  final GroupController groupController = Get.put(GroupController());

  final List<Widget> _pages = [
    const _HomeView(),
    const GroupScreen(),
    PaymentScreen(),
    const NotificationScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      extendBody: true,
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // SANDBOX Banner — shown only in test mode
          if (AppConfigService.isTestMode)
            Container(
              color: const Color(0xFFFFC107),
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: const Text(
                '⚠️  SANDBOX — Test Mode Active',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: Colors.black87,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          Obx(
            () => CustomBottomNavBar(
              currentIndex: controller.selectedIndex.value,
              onTap: (index) => controller.changeTabIndex(index),
            ),
          ),
        ],
      ),
      body: Obx(() => _pages[controller.selectedIndex.value]),
    );
  }
}

class _HomeView extends StatelessWidget {
  const _HomeView({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final HomeController controller = Get.find<HomeController>();
    final GroupController groupController = Get.find<GroupController>();

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildHeader(controller),
          const SizedBox(height: 24),
          _buildQuickActions(),
          const SizedBox(height: 24),
          _buildAdvertisementCarousel(controller),
          const SizedBox(height: 24),
          _buildMyGroupsSection(groupController),
          const SizedBox(height: 120), // Extra space for custom nav bar
        ],
      ),
    );
  }

  Widget _buildHeader(HomeController controller) {
    return Container(
      constraints: const BoxConstraints(minHeight: 249),
      padding: const EdgeInsets.fromLTRB(24, 48, 24, 24),
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(0.5, -0.6),
          radius: 1.2,
          colors: [Color(0xFF6773FF), Color(0xFF1A227F)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'welcome_back'.tr,
                    style: const TextStyle(color: Colors.white70, fontSize: 16),
                  ),
                  Obx(
                    () => Text(
                      controller.userName.value,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  Get.to(() => AllGroupsScreen());
                },
                child: Stack(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        shape: BoxShape.circle,
                      ),
                      child: SvgPicture.asset(
                        AppIcons.groupsIcons,
                        height: 24,
                        width: 24,
                        colorFilter: const ColorFilter.mode(
                          Colors.white,
                          BlendMode.srcIn,
                        ),
                      ),
                    ),
                    // Positioned(
                    //   right: 0,
                    //   top: 0,
                    //   child: Container(
                    //     padding: const EdgeInsets.all(4),
                    //     decoration: const BoxDecoration(
                    //       color: Colors.red,
                    //       shape: BoxShape.circle,
                    //     ),
                    //     child: const Text(
                    //       '0',
                    //       style: TextStyle(
                    //         color: Colors.white,
                    //         fontSize: 10,
                    //         fontWeight: FontWeight.bold,
                    //       ),
                    //     ),
                    //   ),
                    // ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Obx(
            () => Row(
              children: [
                Expanded(
                  child: _buildHeaderStatCard(
                    label: 'total_saved'.tr,
                    value: '\$${controller.totalSaved.value}',
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildHeaderStatCard(
                    label: 'active_groups'.tr,
                    value: '${controller.activeGroups.value}',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderStatCard({required String label, required String value}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'quick_actions'.tr,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => Get.to(() => const CreateGroupScreen()),
                  child: _buildActionCard(
                    label: 'create_group'.tr,
                    iconPath: AppIcons.plasIcons,
                    color: const Color(0xFF1A227F),
                    bgColor: const Color(0xFFEEF2FF),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: GestureDetector(
                  onTap: () => Get.to(() => JoinGroupScreen()),
                  child: _buildActionCard(
                    label: 'join_group'.tr,
                    iconPath: AppIcons.groupsIcons,
                    color: const Color(0xFF00A63E),
                    bgColor: const Color(0xFFF0FDF4),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildActionCard({
    required String label,
    required String iconPath,
    required Color color,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            child: SvgPicture.asset(
              iconPath,
              colorFilter: const ColorFilter.mode(
                Colors.white,
                BlendMode.srcIn,
              ),
              height: 28,
              width: 28,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            label,
            style: const TextStyle(
              color: Color(0xFF4A5565),
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdvertisementCarousel(HomeController controller) {
    return Obx(() {
      if (controller.advertisements.isEmpty) {
        return const SizedBox.shrink();
      }

      return Container(
        height: 190,
        margin: const EdgeInsets.symmetric(horizontal: 24),
        child: Stack(
          children: [
            PageView.builder(
              itemCount: controller.advertisements.length,
              onPageChanged: (index) {
                controller.currentAdIndex.value = index;
              },
              itemBuilder: (context, index) {
                final ad = controller.advertisements[index];
                return GestureDetector(
                  onTap: () => ad.performAction(),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(20),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          // High-Speed Progressive Banner Image (Zero-Delay Memory Caching)
                          Image.network(
                            ad.bannerImage,
                            fit: BoxFit.cover,
                            cacheWidth: 800,
                            frameBuilder: (context, child, frame, wasSynchronouslyLoaded) {
                              if (wasSynchronouslyLoaded || frame != null) {
                                return child;
                              }
                              return Container(
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [Color(0xFF2E3A9E), Color(0xFF1A2278)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                ),
                              );
                            },
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [Color(0xFF6773FF), Color(0xFF1A227F)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                ),
                                child: const Center(
                                  child: Icon(Icons.campaign_rounded, color: Colors.white54, size: 48),
                                ),
                              );
                            },
                          ),

                          // Gradient Overlay for Readability
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: [
                                  Colors.black.withOpacity(0.85),
                                  Colors.black.withOpacity(0.2),
                                  Colors.transparent,
                                ],
                                stops: const [0.0, 0.6, 1.0],
                              ),
                            ),
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.end,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            ad.title,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: Colors.white,
                                              fontSize: 16,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                          if (ad.description.isNotEmpty) ...[
                                            const SizedBox(height: 3),
                                            Text(
                                              ad.description,
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                              style: TextStyle(
                                                color: Colors.white.withOpacity(0.85),
                                                fontSize: 12,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    if (ad.actionType != 'none' && ad.actionLabel.isNotEmpty) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          borderRadius: BorderRadius.circular(20),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withOpacity(0.2),
                                              blurRadius: 4,
                                              offset: const Offset(0, 2),
                                            ),
                                          ],
                                        ),
                                        child: Text(
                                          ad.actionLabel,
                                          style: TextStyle(
                                            color: ad.actionType == 'whatsapp'
                                                ? const Color(0xFF16A34A)
                                                : const Color(0xFF1A227F),
                                            fontSize: 11,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),

            // Pagination Dots Indicator (when more than 1 ad)
            if (controller.advertisements.length > 1)
              Positioned(
                top: 12,
                right: 14,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(
                      controller.advertisements.length,
                      (index) => Container(
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: controller.currentAdIndex.value == index
                              ? Colors.white
                              : Colors.white.withOpacity(0.4),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      );
    });
  }

  Widget _buildMyGroupsSection(GroupController groupController) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'my_groups'.tr,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0F172A),
                ),
              ),
              TextButton(
                onPressed: () => Get.to(() => const AllGroupsScreen()),
                child: Text(
                  'see_all'.tr + ' →',
                  style: const TextStyle(
                    color: Color(0xFF1A227F),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          Obx(() {
            if (groupController.groups.isEmpty) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  vertical: 40,
                  horizontal: 20,
                ),
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: Column(
                  children: [
                    SvgPicture.asset(
                      AppIcons.groupsIcons,
                      height: 48,
                      width: 48,
                      colorFilter: ColorFilter.mode(
                        const Color(0xFF94A3B8).withOpacity(0.5),
                        BlendMode.srcIn,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'no_groups_joined'.tr,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: () => Get.to(() => const CreateGroupScreen()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A227F),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 12,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text('create_first_group'.tr),
                    ),
                  ],
                ),
              );
            } else {
              return Column(
                children: groupController.groups.take(2).map((group) {
                  return GestureDetector(
                    onTap: () =>
                        Get.to(() => ActiveGroupDetailsScreen(group: group)),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
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
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                group.name,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              Builder(
                                builder: (context) {
                                  String statusLabel =
                                      group.status.toLowerCase() == 'upcoming'
                                      ? 'Pending'
                                      : group.status.capitalizeFirst ??
                                            group.status;
                                  Color bgColor = const Color(0xFFFEF9C3);
                                  Color textColor = const Color(0xFF854D0E);

                                  if (group.status.toLowerCase() ==
                                          'upcoming' ||
                                      group.status.toLowerCase() == 'pending') {
                                    if (group.rawStartDate != null) {
                                      try {
                                        final startDate = DateTime.parse(
                                          group.rawStartDate!,
                                        );
                                        if (startDate.isBefore(
                                          DateTime.now(),
                                        )) {
                                          statusLabel = 'Delayed';
                                          bgColor = const Color(0xFFFEE2E2);
                                          textColor = const Color(0xFF991B1B);
                                        }
                                      } catch (_) {}
                                    }
                                  } else if (group.status.toLowerCase() ==
                                      'active') {
                                    bgColor = const Color(0xFFDCFCE7);
                                    textColor = const Color(0xFF166534);
                                  }

                                  return Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: bgColor,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      statusLabel,
                                      style: TextStyle(
                                        color: textColor,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            group.description,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 20,
                            runSpacing: 8,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.groups_outlined,
                                    size: 16,
                                    color: Color(0xFF64748B),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    '${group.membersCount}/${group.totalMembers} ' +
                                        'members'.tr,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.calendar_today_outlined,
                                    size: 16,
                                    color: Color(0xFF64748B),
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'position'.tr + ' ${group.position}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Flexible(
                                child: Text(
                                  '\$${group.amount.toInt()}/' + 'monthly'.tr,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Flexible(
                                child: Text(
                                  'Next: ${group.nextDate}',
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.end,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFF64748B),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: group.progress,
                              backgroundColor: const Color(0xFFE2E8F0),
                              valueColor: const AlwaysStoppedAnimation<Color>(
                                Color(0xFF1A227F),
                              ),
                              minHeight: 6,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              );
            }
          }),
        ],
      ),
    );
  }
}
