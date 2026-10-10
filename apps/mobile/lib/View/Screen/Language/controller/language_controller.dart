import 'dart:ui';
import 'package:get/get.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageController extends GetxController {
  static const String _storageKey = 'app_language';
  var currentLocale = const Locale('en', 'US').obs;

  @override
  void onInit() {
    super.onInit();
    loadLanguage();
  }

  Future<bool> loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final String? languageCode = prefs.getString(_storageKey);

    if (languageCode != null) {
      currentLocale.value = Locale(languageCode);
      Get.updateLocale(currentLocale.value);
      return true;
    } else {
      // First time user, no language saved.
      // Default to English but don't save it yet.
      currentLocale.value = const Locale('en', 'US');
      return false;
    }
  }

  Future<void> changeLanguage(String languageCode) async {
    final locale = Locale(languageCode);
    currentLocale.value = locale;
    Get.updateLocale(locale);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, languageCode);
  }
}
