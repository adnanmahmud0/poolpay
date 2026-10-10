import 'package:flutter/material.dart';

/// Monitors app lifecycle state and triggers a callback when the app is closed/detached
/// so that tokens and in-memory sessions are cleared cleanly upon exit.
class AppLifecycleManager extends StatefulWidget {
  final Widget child;
  final Future<void> Function() onAppClosed;

  const AppLifecycleManager({
    Key? key,
    required this.child,
    required this.onAppClosed,
  }) : super(key: key);

  @override
  State<AppLifecycleManager> createState() => _AppLifecycleManagerState();
}

class _AppLifecycleManagerState extends State<AppLifecycleManager>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    // Trigger cleanup when the app is being closed / killed
    if (state == AppLifecycleState.detached) {
      debugPrint("📱 [AppLifecycleManager] App detached/closed. Executing onAppClosed callback.");
      widget.onAppClosed();
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
