import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../helper/shared_prefe/shared_prefe.dart';

class TokenService {
  static const _storage = FlutterSecureStorage();
  
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  static Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    // 1. Write to Secure Storage
    try {
      await _storage.write(key: _accessTokenKey, value: accessToken);
      await _storage.write(key: _refreshTokenKey, value: refreshToken);
    } catch (e) {
      print("⚠️ TokenService: SecureStorage write failed: $e");
    }
    
    // 2. Sync with PrefsHelper (SharedPreferences)
    await PrefsHelper.setString(PrefsHelper.token, accessToken);
    await PrefsHelper.setString(PrefsHelper.refreshToken, refreshToken);
  }

  static Future<void> saveAccessToken(String accessToken) async {
    try {
      await _storage.write(key: _accessTokenKey, value: accessToken);
    } catch (e) {
      print("⚠️ TokenService: SecureStorage write failed: $e");
    }
    
    await PrefsHelper.setString(PrefsHelper.token, accessToken);
  }

  static Future<String?> getAccessToken() async {
    try {
      String? token = await _storage.read(key: _accessTokenKey);
      if (token == null) {
        // Fallback to PrefsHelper
        token = await PrefsHelper.getString(PrefsHelper.token);
      }
      return token;
    } catch (e) {
      // If plugin fails, use PrefsHelper
      return await PrefsHelper.getString(PrefsHelper.token);
    }
  }

  static Future<String?> getRefreshToken() async {
    try {
      String? token = await _storage.read(key: _refreshTokenKey);
      if (token == null) {
        token = await PrefsHelper.getString(PrefsHelper.refreshToken);
      }
      return token;
    } catch (e) {
      return await PrefsHelper.getString(PrefsHelper.refreshToken);
    }
  }

  static Future<void> clearTokens() async {
    try {
      await _storage.delete(key: _accessTokenKey);
      // refreshToken is preserved as requested
    } catch (e) {}
    
    await PrefsHelper.remove(PrefsHelper.token);
  }
}
