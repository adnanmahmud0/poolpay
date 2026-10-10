import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../../../../Utils/AppIcons/app_icons.dart';
import '../../../../Widgegt/custom_textfield.dart';
import '../controller/complete_profile_controller.dart';

class CompleteProfileScreen extends StatelessWidget {
  CompleteProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final CompleteProfileController controller = Get.put(
      CompleteProfileController(),
    );
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Custom Header Row
              Stack(
                alignment: Alignment.center,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: IconButton(
                      icon: const Icon(
                        Icons.arrow_back,
                        color: Color(0xFF0F172A),
                      ),
                      onPressed: () => Get.back(),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
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
                        child: Image.asset('assets/images/Apps-Logo.png'),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Title
              Text(
                'complete_profile_title'.tr,
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
                'complete_profile_subtitle'.tr,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF4A5565),
                  fontWeight: FontWeight.w400,
                ),
              ),
              const SizedBox(height: 32),

              // Profile Image Upload Component
              Center(
                child: GestureDetector(
                  onTap: () => controller.pickImage(),
                  child: Column(
                    children: [
                      Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          Obx(
                            () => Container(
                              height: 80,
                              width: 80,
                              decoration: BoxDecoration(
                                color: const Color(
                                  0xFFF1F5F9,
                                ), // Background color when no image
                                shape: BoxShape.circle,
                                image: controller.imagePath.value.isNotEmpty
                                    ? DecorationImage(
                                        image: FileImage(
                                          File(controller.imagePath.value),
                                        ),
                                        fit: BoxFit.cover,
                                      )
                                    : null,
                              ),
                              child: controller.isImageUploading.value
                                  ? const Center(
                                      child: CircularProgressIndicator(
                                        color: Color(0xFF1A227F),
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : controller.imagePath.value.isEmpty
                                  ? Center(
                                      child: SvgPicture.asset(
                                        AppIcons.profileIcons,
                                        height: 40,
                                        width: 40,
                                        colorFilter: const ColorFilter.mode(
                                          Color(0xFF94A3B8),
                                          BlendMode.srcIn,
                                        ),
                                      ),
                                    )
                                  : null,
                            ),
                          ),
                          // Upload Icon Button
                          Container(
                            height: 25,
                            width: 25,
                            decoration: const BoxDecoration(),
                            child: Center(
                              child: SvgPicture.asset(AppIcons.dwIcons),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'upload_picture'.tr,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF94A3B8), // Muted grey color
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 32),

              // Form fields
              CustomTextField(
                label: 'dob'.tr,
                hintText: '',
                controller: controller.dobController,
                readOnly: true,
                onTap: () => controller.pickDate(context),
                prefixIcon: const Icon(
                  Icons.calendar_today_outlined,
                  size: 20,
                  color: Color(0xFF94A3B8),
                ),
              ),
              CustomTextField(
                label: 'occupation'.tr,
                hintText: 'occupation_hint'.tr,
                controller: controller.occupationController,
                prefixIcon: SvgPicture.asset(
                  AppIcons.profileIcons, // Fallback using profile icon
                  colorFilter: const ColorFilter.mode(
                    Color(0xFF94A3B8),
                    BlendMode.srcIn,
                  ),
                  height: 20,
                  width: 20,
                ),
              ),
              CustomTextField(
                label: 'address'.tr,
                hintText: 'address_hint'.tr,
                controller: controller.addressController,
                prefixIcon: SvgPicture.asset(
                  AppIcons.locationIcons, // Location icon from AppIcons
                  colorFilter: const ColorFilter.mode(
                    Color(0xFF94A3B8),
                    BlendMode.srcIn,
                  ),
                  height: 20,
                  width: 20,
                ),
              ),
              CustomTextField(
                label: 'city'.tr,
                hintText: 'city'.tr,
                controller: controller.cityController,
              ),
              CustomTextField(
                label: 'state'.tr,
                hintText: 'state'.tr,
                controller: controller.stateController,
              ),
              CustomTextField(
                label: 'zip_code'.tr,
                hintText: 'zip_code'.tr,
                controller: controller.zipController,
              ),

              const SizedBox(height: 24),

              // Continue Button
              Obx(
                () => ElevatedButton(
                  onPressed: controller.isLoading.value
                      ? null
                      : () => controller.submitProfile(),
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
                          'continue'.tr,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),

              const SizedBox(height: 16),

              // Skip for now Action
              Obx(
                () => controller.isLoading.value
                    ? const SizedBox.shrink()
                    : Center(
                        child: TextButton(
                          onPressed: () => controller.skipForNow(),
                          child: const Text(
                            'Skip for now',
                            style: TextStyle(
                              color: Color(0xFF4A5565),
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                            ),
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
}
