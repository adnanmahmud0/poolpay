import 'dart:async';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../helper/shared_prefe/shared_prefe.dart';
import '../service/api/token_service.dart';
import '../Utils/ToastMessage/custom_toast.dart';
import '../View/Screen/Auth/login/view/login_screen.dart';

/// Watches for user inactivity (pointer/touch events) and triggers automatic logout
/// based on the timeout configured from the backend Admin Panel (default 20 minutes).
class SessionInactivityWatcher extends StatefulWidget {
  final Widget child;

  const SessionInactivityWatcher({
    Key? key,
    required this.child,
  }) : super(key: key);

  /// Default timeout in minutes (synced with admin settings)
  static int timeoutMinutes = 20;
  static Timer? _inactivityTimer;
  static bool isWatcherActive = false;

  /// Start or restart inactivity tracking with specified timeout
  static void start({int? minutes}) {
    if (minutes != null && minutes > 0) {
      timeoutMinutes = minutes;
    }
    isWatcherActive = true;
    resetTimer();
    debugPrint("⏱️ [SessionInactivityWatcher] Started tracking ($timeoutMinutes min timeout)");
  }

  /// Reset the inactivity countdown upon user interaction
  static void resetTimer() {
    if (!isWatcherActive) return;

    _inactivityTimer?.cancel();
    _inactivityTimer = Timer(Duration(minutes: timeoutMinutes), _handleTimeout);
  }

  /// Stop tracking (e.g. when logged out)
  static void stop() {
    isWatcherActive = false;
    _inactivityTimer?.cancel();
    _inactivityTimer = null;
    debugPrint("⏱️ [SessionInactivityWatcher] Stopped tracking");
  }

  /// Handle session expiration
  static Future<void> _handleTimeout() async {
    debugPrint("⚠️ [SessionInactivityWatcher] Timeout reached ($timeoutMinutes min). Auto-logging out.");
    stop();

    try {
      await TokenService.clearTokens();
      await PrefsHelper.remove(PrefsHelper.token);
      await PrefsHelper.remove(PrefsHelper.userId);
      await PrefsHelper.remove(PrefsHelper.userData);
    } catch (e) {
      debugPrint("Error clearing tokens during timeout logout: $e");
    }

    if (Get.context != null) {
      FocusScope.of(Get.context!).unfocus();
    }

    Get.offAll(() => LoginScreen());

    CustomToast.showWarning(
      "Session Expired",
      "You have been automatically logged out due to $timeoutMinutes minutes of inactivity.",
    );
  }

  @override
  State<SessionInactivityWatcher> createState() =>
      _SessionInactivityWatcherState();
}

class _SessionInactivityWatcherState extends State<SessionInactivityWatcher> {
  void _onUserInteraction([_]) {
    SessionInactivityWatcher.resetTimer();
  }

  @override
  Widget build(BuildContext context) {
    return Listener(
      behavior: HitTestBehavior.translucent,
      onPointerDown: _onUserInteraction,
      onPointerMove: _onUserInteraction,
      onPointerUp: _onUserInteraction,
      child: widget.child,
    );
  }
}
