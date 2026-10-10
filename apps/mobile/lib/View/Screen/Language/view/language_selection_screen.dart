import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../Auth/login/view/login_screen.dart';
import '../controller/language_controller.dart';
import '../../../../Utils/Translations/app_translations.dart';

import '../../Auth/sign_up/view/sign_up_screen.dart';

class LanguageSelectionScreen extends StatelessWidget {
  final bool isFirstTime;
  final bool isSignUpFlow;
  LanguageSelectionScreen({
    Key? key,
    this.isFirstTime = true,
    this.isSignUpFlow = false,
  }) : super(key: key);

  final List<Map<String, String>> languages = [
    {'name': 'English', 'code': 'en'},
    {'name': 'Español', 'code': 'es'},
    {'name': 'Français', 'code': 'fr'},
    {'name': 'Kreyòl Ayisyen', 'code': 'ht'},
  ];

  @override
  Widget build(BuildContext context) {
    final LanguageController _languageController = Get.put(LanguageController());
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 30),
              // App Logo
              Center(
                child: Image.asset(
                  'assets/images/Apps-Logo.png',
                  height: 200, // Adjust height as needed
                ),
              ),
              const SizedBox(height: 30),
              // Title
              Text(
                'select_language'
                    .tr, // This will translate based on current locale
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A227F),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 40),
              // Language List
              Expanded(
                child: ListView.separated(
                  itemCount: languages.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final language = languages[index];
                    return Obx(() {
                      final isSelected =
                          _languageController
                              .currentLocale
                              .value
                              .languageCode ==
                          language['code'];
                      return InkWell(
                        onTap: () async {
                          await _languageController.changeLanguage(
                            language['code']!,
                          );
                          if (isSignUpFlow) {
                            Get.off(() => SignUpScreen());
                          } else if (isFirstTime) {
                            Get.offAll(() => LoginScreen());
                          } else {
                            Get.back();
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            vertical: 16,
                            horizontal: 20,
                          ),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF1A227F)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF1A227F)
                                  : const Color(0xFFE2E8F0),
                              width: 1.5,
                            ),
                            boxShadow: isSelected
                                ? [
                                    BoxShadow(
                                      color: const Color(
                                        0xFF1A227F,
                                      ).withOpacity(0.3),
                                      blurRadius: 8,
                                      offset: const Offset(0, 4),
                                    ),
                                  ]
                                : [],
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                language['name']!,
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: isSelected
                                      ? Colors.white
                                      : const Color(0xFF0F172A),
                                ),
                              ),
                              if (isSelected)
                                const Icon(
                                  Icons.check_circle,
                                  color: Colors.white,
                                  size: 20,
                                ),
                            ],
                          ),
                        ),
                      );
                    });
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
