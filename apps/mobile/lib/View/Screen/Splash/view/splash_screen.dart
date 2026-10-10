import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../../helper/shared_prefe/shared_prefe.dart';
import '../../../../service/api/token_service.dart';
import '../../../../service/session_inactivity_watcher.dart';
import '../../Auth/login/view/login_screen.dart';
import '../../Language/controller/language_controller.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final LanguageController _languageController = Get.put(LanguageController());

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    // Show splash for at least 2 seconds
    await Future.delayed(const Duration(seconds: 2));

    // As required: Auto-logout on app close -> reopening app requires logging in again
    try {
      await TokenService.clearTokens();
      await PrefsHelper.remove(PrefsHelper.token);
      SessionInactivityWatcher.stop();
    } catch (e) {
      debugPrint("Error clearing session on cold-start: $e");
    }

    Get.offAll(() => LoginScreen());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Image.asset(
          'assets/images/Apps-Logo.png',
          width: 300,
          height: 300,
        ),
      ),
    );
  }
}
