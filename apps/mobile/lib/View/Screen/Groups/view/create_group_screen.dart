import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import '../controller/create_group_controller.dart';
import '../controller/group_controller.dart';
import '../model/group_model.dart';
import 'group_details_screen.dart';

class CreateGroupScreen extends StatelessWidget {
  const CreateGroupScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final CreateGroupController controller = Get.put(CreateGroupController());
    final GroupController groupController = Get.find<GroupController>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildHeader(controller),
          SizedBox(height: 24.h),
          _buildStepper(controller),
          SizedBox(height: 24.h),
          Expanded(
            child: Obx(() {
              return SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: 24.w),
                child: controller.currentStep.value == 1
                    ? _buildBasicInfoForm(controller)
                    : controller.currentStep.value == 2
                    ? _buildContributionSettingsForm(controller)
                    : _buildReviewDetailsForm(controller, groupController),
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(CreateGroupController controller) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(12.w, 50.h, 24.w, 24.h),
      decoration: BoxDecoration(
        gradient: const RadialGradient(
          center: Alignment(0.5, -0.6),
          radius: 1.2,
          colors: [Color(0xFF6773FF), Color(0xFF1A227F)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32.r),
          bottomRight: Radius.circular(32.r),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => controller.goBack(),
            icon: const Icon(Icons.arrow_back, color: Colors.white),
          ),
          SizedBox(width: 8.w),
          Text(
            'create_group'.tr,
            style: TextStyle(
              color: Colors.white,
              fontSize: 24.sp,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepper(CreateGroupController controller) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: 40.w),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Row(
            children: [
              Expanded(child: _buildStepLine(1, controller)),
              Expanded(child: _buildStepLine(2, controller)),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildStepCircle(1, controller),
              _buildStepCircle(2, controller),
              _buildStepCircle(3, controller),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStepCircle(int step, CreateGroupController controller) {
    return Obx(() {
      bool isCompleted = controller.currentStep.value > step;
      bool isActive = controller.currentStep.value == step;
      return Container(
        width: 32.w,
        height: 32.h,
        decoration: BoxDecoration(
          color: isActive || isCompleted
              ? const Color(0xFF1A227F)
              : const Color(0xFFE2E8F0),
          shape: BoxShape.circle,
        ),
        child: Center(
          child: Text(
            '$step',
            style: TextStyle(
              color: isActive || isCompleted
                  ? Colors.white
                  : const Color(0xFF94A3B8),
              fontWeight: FontWeight.bold,
              fontSize: 14.sp,
            ),
          ),
        ),
      );
    });
  }

  Widget _buildStepLine(int step, CreateGroupController controller) {
    return Obx(() {
      bool isCompleted = controller.currentStep.value > step;
      return Container(
        height: 2.h,
        color: isCompleted ? const Color(0xFF1A227F) : const Color(0xFFE2E8F0),
      );
    });
  }

  Widget _buildBasicInfoForm(CreateGroupController controller) {
    return Container(
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'basic_info'.tr,
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF0F172A),
            ),
          ),
          Center(
            child: GestureDetector(
              onTap: () => controller.pickImage(),
              child: Obx(() {
                return Container(
                  width: 100.w,
                  height: 100.w,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    shape: BoxShape.circle,
                    image: controller.imagePath.value.isNotEmpty
                        ? DecorationImage(
                            image: FileImage(File(controller.imagePath.value)),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: controller.imagePath.value.isEmpty
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.camera_alt_outlined,
                              color: const Color(0xFF94A3B8),
                              size: 32.sp,
                            ),
                            SizedBox(height: 4.h),
                            Text(
                              'Add Photo',
                              style: TextStyle(
                                color: const Color(0xFF94A3B8),
                                fontSize: 12.sp,
                              ),
                            ),
                          ],
                        )
                      : null,
                );
              }),
            ),
          ),
          SizedBox(height: 24.h),
          _buildTextField(
            label: 'group_name'.tr,
            hint: 'group_name_hint'.tr,
            icon: Icons.groups_outlined,
            controller: controller.groupNameController,
          ),
          SizedBox(height: 24.h),
          _buildTextField(
            label: 'description'.tr,
            hint: 'description_hint'.tr,
            icon: Icons.description_outlined,
            controller: controller.descriptionController,
            maxLines: 4,
          ),
          SizedBox(height: 32.h),
          _buildPrimaryButton(
            text: 'continue'.tr,
            onPressed: () => controller.goToNextStep(),
          ),
        ],
      ),
    );
  }

  Widget _buildContributionSettingsForm(CreateGroupController controller) {
    return Container(
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'contribution_settings'.tr,
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF0F172A),
            ),
          ),
          SizedBox(height: 24.h),
          _buildTextField(
            label: 'Contribution Amount (\$)',
            hint: '500',
            icon: Icons.attach_money,
            controller: controller.amountController,
            keyboardType: TextInputType.number,
          ),
          SizedBox(height: 24.h),
          _buildDropdown(
            label: 'Contribution Frequency',
            value: controller.selectedFrequency.value,
            items: controller.frequencies,
            icon: Icons.calendar_today_outlined,
            onChanged: (val) {
              if (val != null) {
                controller.selectedFrequency.value = val;
                controller.frequencyController.text = val;
              }
            },
          ),
          SizedBox(height: 24.h),
          _buildTextField(
            label: 'Group Size (Total Members)',
            hint: '10',
            icon: Icons.numbers,
            controller: controller.groupSizeController,
            keyboardType: TextInputType.number,
          ),
          SizedBox(height: 24.h),
          _buildTextField(
            label: 'Total Cycles',
            hint: '2',
            icon: Icons.repeat,
            controller: controller.totalCyclesController,
            keyboardType: TextInputType.number,
          ),
          /*SizedBox(height: 24.h),
          _buildTextField(
            label: 'Start Date',
            hint: '2024-12-01',
            icon: Icons.calendar_month,
            controller: controller.startDateController,
          ),*/
          SizedBox(height: 12.h),
          Obx(() {
            double amount = double.tryParse(controller.amountController.text) ?? 0;
            int members = int.tryParse(controller.groupSizeController.text) ?? 1;
            return Text(
              'Each member will contribute \$${amount.toStringAsFixed(0)} ${controller.selectedFrequency.value}. Total pot: \$${(amount * members).toStringAsFixed(0)}',
              style: TextStyle(fontSize: 14.sp, color: const Color(0xFF94A3B8)),
            );
          }),
          SizedBox(height: 32.h),
          Row(
            children: [
              Expanded(
                child: _buildSecondaryButton(
                  text: 'Back',
                  onPressed: () => controller.goBack(),
                ),
              ),
              SizedBox(width: 16.w),
              Expanded(
                child: _buildPrimaryButton(
                  text: 'Continue',
                  onPressed: () => controller.goToNextStep(),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReviewDetailsForm(
    CreateGroupController controller,
    GroupController groupController,
  ) {
    return Container(
      padding: EdgeInsets.all(24.r),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Review Details',
            style: TextStyle(
              fontSize: 20.sp,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF0F172A),
            ),
          ),
          SizedBox(height: 24.h),
          _buildReviewItem('Group Name', controller.groupNameController.text),
          _buildReviewItem(
            'Description',
            controller.descriptionController.text,
          ),
          _buildReviewItem(
            'Contribution',
            '\$${controller.amountController.text} / ${controller.selectedFrequency.value}',
          ),
          _buildReviewItem(
            'Group Size',
            '${controller.groupSizeController.text} Members',
          ),
          _buildReviewItem(
            'Total Cycles',
            '${controller.totalCyclesController.text} Cycles',
          ),
          /*_buildReviewItem(
            'Start Date',
            controller.startDateController.text,
          ),*/
          _buildReviewItem(
            'Total Pot',
            '\$${(double.tryParse(controller.amountController.text) ?? 0) * (int.tryParse(controller.groupSizeController.text) ?? 1)}',
          ),
          SizedBox(height: 24.h),
          Container(
            padding: EdgeInsets.all(16.r),
            decoration: BoxDecoration(
              color: const Color(0xFFEEF2FF),
              borderRadius: BorderRadius.circular(12.r),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(
                  Icons.lightbulb_outline,
                  color: const Color(0xFF6366F1),
                  size: 20.sp,
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Text(
                    'As the group admin, you\'ll be able to manage members and invite others using a unique invite code.',
                    style: TextStyle(
                      color: const Color(0xFF475569),
                      fontSize: 13.sp,
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 32.h),
          Row(
            children: [
              Expanded(
                child: _buildSecondaryButton(
                  text: 'Back',
                  onPressed: () => controller.goBack(),
                ),
              ),
              SizedBox(width: 16.w),
              Expanded(
                child: Obx(
                  () => _buildPrimaryButton(
                    text: controller.isLoading.value ? 'Creating...' : 'Create Group',
                    onPressed: controller.isLoading.value
                        ? () {}
                        : () => controller.createGroup(),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReviewItem(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 20.h),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14.sp,
                color: const Color(0xFF64748B),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(
                fontSize: 14.sp,
                color: const Color(0xFF0F172A),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<String> items,
    required IconData icon,
    required Function(String?) onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14.sp,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF475569),
          ),
        ),
        SizedBox(height: 8.h),
        Container(
          padding: EdgeInsets.symmetric(horizontal: 12.w),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButtonFormField<String>(
              value: value,
              decoration: InputDecoration(
                prefixIcon: Icon(icon, color: const Color(0xFF94A3B8)),
                border: InputBorder.none,
              ),
              items: items.map((String freq) {
                return DropdownMenuItem<String>(
                  value: freq,
                  child: Text(
                    freq.capitalizeFirst!,
                    style: TextStyle(fontSize: 14.sp),
                  ),
                );
              }).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    required IconData icon,
    required TextEditingController controller,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14.sp,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF475569),
          ),
        ),
        SizedBox(height: 8.h),
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12.r),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: TextField(
            controller: controller,
            maxLines: maxLines,
            keyboardType: keyboardType,
            decoration: InputDecoration(
              prefixIcon: Icon(icon, color: const Color(0xFF94A3B8)),
              hintText: hint,
              hintStyle: TextStyle(
                color: const Color(0xFF94A3B8),
                fontSize: 14.sp,
              ),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(
                horizontal: 16.w,
                vertical: 12.h,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPrimaryButton({
    required String text,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1A227F),
          foregroundColor: Colors.white,
          padding: EdgeInsets.symmetric(vertical: 16.h),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),
          elevation: 0,
        ),
        child: Text(
          text,
          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildSecondaryButton({
    required String text,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFE2E8F0),
          foregroundColor: const Color(0xFF475569),
          padding: EdgeInsets.symmetric(vertical: 16.h),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.r),
          ),
          elevation: 0,
        ),
        child: Text(
          text,
          style: TextStyle(fontSize: 16.sp, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
