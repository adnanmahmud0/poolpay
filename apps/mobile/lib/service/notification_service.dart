import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:get/get.dart';
import 'api/dio_client.dart';
import 'api_url.dart';
import '../helper/shared_prefe/shared_prefe.dart';
import '../View/Screen/Home/controller/home_controller.dart';
import '../View/Screen/Notification/view/notification_screen.dart';
import '../View/Screen/Notification/controller/notification_controller.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (e) {
    print("Firebase already initialized or failed: $e");
  }
  print("Handling a background message: ${message.messageId}");
}

class NotificationService extends GetxService {
  late FirebaseMessaging _fcm;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  Future<void> init() async {
    if (Firebase.apps.isEmpty) {
      print('⚠️ Skipping FCM: Firebase is not initialized.');
      await _initLocalNotifications();
      return;
    }

    _fcm = FirebaseMessaging.instance;

    // 2. Request Permissions
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('User granted permission');
    } else {
      print('User declined or has not accepted permission');
    }

    // 3. Get FCM Token
    String? token = await _fcm.getToken();
    if (token != null) {
      print('Initial FCM Token: $token');
      await updateFcmToken(token);
    }

    // 4. Token Refresh Listener
    FirebaseMessaging.instance.onTokenRefresh.listen((newToken) {
      updateFcmToken(newToken);
    });

    // 5. Handle Foreground Messages
    FirebaseMessaging.onMessage.listen((message) {
      _showLocalNotification(message);
      // Automatically refresh notification list if the controller is active
      if (Get.isRegistered<NotificationController>()) {
        Get.find<NotificationController>().fetchNotifications(refresh: true);
      }
    });

    // 6. Handle Background/Terminated State Clicks
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationClick);

    // Check if the app was opened from a terminated state via a notification
    RemoteMessage? initialMessage = await _fcm.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationClick(initialMessage);
    }

    // 7. Handle Background Messages (via global handler)
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    await _initLocalNotifications();
  }

  Future<void> _initLocalNotifications() async {
    // 8. Initialize Local Notifications
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();
    const InitializationSettings initSettings = InitializationSettings(android: androidSettings, iOS: iosSettings);

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        if (response.payload != null) {
          try {
            Map<String, dynamic> data = jsonDecode(response.payload!);
            _handleNotificationClick(RemoteMessage(data: data.map((k, v) => MapEntry(k, v.toString()))));
          } catch (e) {
            print("Error parsing notification payload: $e");
          }
        }
      },
    );
  }

  void _handleNotificationClick(RemoteMessage message) {
    print("Notification clicked with data: ${message.data}");
    
    if (message.data.containsKey('route')) {
      String route = message.data['route'];
      
      // Handle navigation to notifications tab in HomeScreen
      if (route == '/notifications' || route == 'notifications') {
        if (Get.isRegistered<HomeController>()) {
          Get.find<HomeController>().changeTabIndex(3); // 3 is Notification tab index
          // Navigate back to HomeScreen if we are deep in some other screens
          Get.until((route) => Get.currentRoute == '/HomeScreen' || route.isFirst);
        } else {
          Get.to(() => const NotificationScreen());
        }
      } else {
        // Generic navigation for other routes
        // Using Get.toNamed if you have named routes, otherwise a guess or just log it
        print("Navigating to specific route: $route");
        if (route.isNotEmpty && route != '/') {
           Get.toNamed(route, arguments: message.data['notificationId']);
        }
      }
    }
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    RemoteNotification? notification = message.notification;
    AndroidNotification? android = message.notification?.android;

    if (notification != null && android != null) {
      _localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'high_importance_channel',
            'High Importance Notifications',
            channelDescription: 'This channel is used for important notifications.',
            importance: Importance.max,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
        ),
        payload: jsonEncode(message.data), // Encode data as JSON for easier parsing on click
      );
    }
  }

  Future<void> updateFcmToken(String fcmToken) async {
    try {
      final dioClient = Get.find<DioClient>();
      
      // Check if user is logged in before sending token to backend
      String? accessToken = await PrefsHelper.getString(PrefsHelper.token);
      if (accessToken == null || accessToken.isEmpty) {
        print('⚠️ Skipping FCM update: User not logged in');
        return;
      }

      // Get userId from SharedPreferences
      String? userId = await PrefsHelper.getString(PrefsHelper.userId);
      
      if (userId != null && userId.isNotEmpty) {
        final response = await dioClient.patch(
          ApiUrl.updateProfileUrl(userId),
          data: {'fcmToken': fcmToken},
        );

        if (response.statusCode == 200 || response.statusCode == 201) {
          print('✅ FCM Token updated on backend via PATCH successfully');
        }
      } else {
        print('⚠️ Skipping FCM update: User ID not found');
      }
    } catch (e) {
      print('⚠️ Failed to update FCM Token: $e');
    }
  }
}
