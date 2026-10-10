import 'package:dio/dio.dart';
import 'package:get/get.dart' as get_pkg;
import '../api_url.dart';
import 'token_service.dart';

class AuthInterceptor extends Interceptor {
  final Dio dio;
  bool _isRefreshing = false;
  final List<Map<String, dynamic>> _requestQueue = [];

  AuthInterceptor(this.dio);

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    try {
      final token = await TokenService.getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    } catch (e) {
      print("⚠️ AuthInterceptor: Failed to load token: $e");
    }
    return handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    final response = err.response;
    final data = response?.data;
    
    bool isJwtExpired = false;
    if (response?.statusCode == 401) {
      isJwtExpired = true;
    } else if (response?.statusCode == 500 && data is Map && data['message'] == 'jwt expired') {
      isJwtExpired = true;
    }

    if (isJwtExpired) {
      if (err.requestOptions.path.contains('auth/refresh-token')) {
        await _handleLogout();
        return handler.next(err);
      }

      if (_isRefreshing) {
        _requestQueue.add({
          'options': err.requestOptions,
          'handler': handler,
        });
        return;
      }

      _isRefreshing = true;
      final refreshToken = await TokenService.getRefreshToken();

      if (refreshToken == null) {
        await _handleLogout();
        return handler.next(err);
      }

      try {
        print("🔄 AuthInterceptor: JWT expired. Attempting to refresh token...");
        
        final refreshDio = Dio();
        final refreshResponse = await refreshDio.post(
          ApiUrl.refreshTokenUrl,
          data: {'refreshToken': refreshToken},
        );

        if (refreshResponse.statusCode == 200 || refreshResponse.statusCode == 201) {
          final responseData = refreshResponse.data;
          final newAccessToken = responseData['data']['accessToken'];
          
          print("✅ AuthInterceptor: Token refreshed successfully.");
          
          await TokenService.saveAccessToken(newAccessToken);
          
          _isRefreshing = false;

          final retryResponse = await _retryRequest(err.requestOptions, newAccessToken);
          handler.resolve(retryResponse);

          _processQueue(newAccessToken);
        } else {
          print("❌ AuthInterceptor: Refresh failed (Status: ${refreshResponse.statusCode})");
          await _handleLogout();
          handler.next(err);
        }
      } catch (e) {
        print("❌ AuthInterceptor: Refresh failed with error: $e");
        _isRefreshing = false;
        await _handleLogout();
        handler.next(err);
      }
    } else {
      return handler.next(err);
    }
  }

  Future<Response> _retryRequest(RequestOptions requestOptions, String token) async {
    final options = Options(
      method: requestOptions.method,
      headers: {
        ...requestOptions.headers,
        'Authorization': 'Bearer $token',
      },
    );

    return dio.request(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }

  void _processQueue(String token) {
    for (var request in _requestQueue) {
      final options = request['options'] as RequestOptions;
      final handler = request['handler'] as ErrorInterceptorHandler;

      _retryRequest(options, token).then((response) {
        handler.resolve(response);
      }).catchError((e) {
        handler.reject(e);
      });
    }
    _requestQueue.clear();
  }

  Future<void> _handleLogout() async {
    _isRefreshing = false;
    _requestQueue.clear();
    await TokenService.clearTokens();
    
    // Safety delay to prevent contextless navigation error
    Future.delayed(const Duration(milliseconds: 500), () {
      if (get_pkg.Get.currentRoute != '/login') {
         get_pkg.Get.offAllNamed('/login'); 
      }
    });
  }
}
