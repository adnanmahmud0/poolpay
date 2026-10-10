import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'config/app_credentials.dart';
import 'config/app_config_service.dart';
import 'service/api/dio_client.dart';
import 'service/notification_service.dart';
import 'View/Screen/Splash/view/splash_screen.dart';
import 'View/Screen/Language/controller/language_controller.dart';
import 'Utils/Translations/app_translations.dart';
import 'service/deep_link_service.dart';

import 'service/app_lifecycle_manager.dart';
import 'service/session_inactivity_watcher.dart';
import 'service/api/token_service.dart';
import 'helper/shared_prefe/shared_prefe.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint("Firebase initialization failed: $e");
  }

  // Fetch active environment (test/production) from the server and configure Stripe.
  // Falls back to sandbox test key if the server is unreachable.
  await AppConfigService.initialize();
  await AppConfigService.applyStripeSettings();

  // Initialize API, Notifications, Deep Links and Language
  Get.put(DioClient(), permanent: true);
  final notificationService = Get.put(NotificationService(), permanent: true);
  await notificationService.init();

  await Get.putAsync(() => DeepLinkService().init(), permanent: true);

  final languageController = Get.put(LanguageController());
  await languageController.loadLanguage();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ScreenUtilInit(
      designSize: const Size(377, 940),
      minTextAdapt: true,
      splitScreenMode: true,
      builder: (_, child) {
        final languageController = Get.find<LanguageController>();
        return AppLifecycleManager(
          onAppClosed: () async {
            await TokenService.clearTokens();
            await PrefsHelper.remove(PrefsHelper.token);
            SessionInactivityWatcher.stop();
          },
          child: GetMaterialApp(
            title: 'POOLPAY',
            debugShowCheckedModeBanner: false,
            translations: AppTranslations(),
            locale: languageController.currentLocale.value,
            fallbackLocale: const Locale('en', 'US'),
            theme: ThemeData(
              scaffoldBackgroundColor: Colors.white,
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFF1A227F),
              ),
              useMaterial3: true,
            ),
            builder: (context, widget) {
              return SessionInactivityWatcher(
                child: widget ?? const SizedBox.shrink(),
              );
            },
            home: const SplashScreen(),
          ),
        );
      },
    );
  }
}
