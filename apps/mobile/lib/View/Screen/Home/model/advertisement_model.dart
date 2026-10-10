import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../service/api_url.dart';

class AdvertisementModel {
  final String id;
  final String title;
  final String description;
  final String bannerImage;
  final String? redirectUrl;
  final String actionType; // 'none', 'link', 'email', 'phone', 'whatsapp'
  final String actionValue;
  final int priority;

  AdvertisementModel({
    required this.id,
    required this.title,
    required this.description,
    required this.bannerImage,
    this.redirectUrl,
    this.actionType = 'none',
    this.actionValue = '',
    required this.priority,
  });

  factory AdvertisementModel.fromJson(Map<String, dynamic> json) {
    final String rawActionType = (json['actionType'] ?? '').toString().toLowerCase().trim();
    final String rawRedirectUrl = json['redirectUrl'] ?? json['link'] ?? '';
    final String rawActionValue = json['actionValue'] ?? rawRedirectUrl;

    // Normalize actionType
    String resolvedActionType = 'none';
    if (['link', 'email', 'phone', 'whatsapp'].contains(rawActionType)) {
      resolvedActionType = rawActionType;
    } else if (rawRedirectUrl.isNotEmpty) {
      resolvedActionType = 'link';
    }

    // Ensure full URL for bannerImage
    String rawBannerImage = json['bannerImage'] ?? json['image'] ?? '';
    if (rawBannerImage.isNotEmpty &&
        !rawBannerImage.startsWith('http://') &&
        !rawBannerImage.startsWith('https://')) {
      final base = ApiUrl.baseUrl.replaceAll(RegExp(r'/api/v1/?$'), '');
      rawBannerImage = '$base/${rawBannerImage.replaceAll(RegExp(r'^/+'), '')}';
    }

    return AdvertisementModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      bannerImage: rawBannerImage,
      redirectUrl: rawRedirectUrl.isNotEmpty ? rawRedirectUrl : null,
      actionType: resolvedActionType,
      actionValue: rawActionValue,
      priority: json['priority'] ?? 0,
    );
  }

  /// Executes the configured action when a user taps the advertisement.
  Future<void> performAction() async {
    try {
      if (actionType == 'none' || (actionValue.isEmpty && (redirectUrl == null || redirectUrl!.isEmpty))) {
        debugPrint('[Ad] Action is "none" or empty. Doing nothing.');
        return;
      }

      switch (actionType) {
        case 'link':
          final target = actionValue.isNotEmpty ? actionValue : (redirectUrl ?? '');
          if (target.isEmpty) return;
          final formattedUrl = target.startsWith('http://') || target.startsWith('https://')
              ? target
              : 'https://$target';
          final uri = Uri.tryParse(formattedUrl);
          if (uri != null && await canLaunchUrl(uri)) {
            await launchUrl(uri, mode: LaunchMode.externalApplication);
          } else if (uri != null) {
            await launchUrl(uri);
          }
          break;

        case 'email':
          if (actionValue.isEmpty) return;
          final emailUri = Uri(
            scheme: 'mailto',
            path: actionValue.trim(),
          );
          if (await canLaunchUrl(emailUri)) {
            await launchUrl(emailUri);
          }
          break;

        case 'phone':
          if (actionValue.isEmpty) return;
          final cleanPhone = actionValue.replaceAll(RegExp(r'[^0-9+]'), '');
          final telUri = Uri(scheme: 'tel', path: cleanPhone);
          if (await canLaunchUrl(telUri)) {
            await launchUrl(telUri);
          }
          break;

        case 'whatsapp':
          if (actionValue.isEmpty) return;
          // Strip non-digit characters except possibly leading +
          final cleanNumber = actionValue.replaceAll(RegExp(r'[^0-9]'), '');
          final whatsappUrl = 'https://wa.me/$cleanNumber';
          final waUri = Uri.parse(whatsappUrl);
          if (await canLaunchUrl(waUri)) {
            await launchUrl(waUri, mode: LaunchMode.externalApplication);
          }
          break;

        default:
          debugPrint('[Ad] Unknown actionType: $actionType');
      }
    } catch (e) {
      debugPrint('[Ad] Error performing action ($actionType): $e');
    }
  }

  /// Human-friendly CTA button label based on action
  String get actionLabel {
    switch (actionType) {
      case 'link':
        return 'Visit Site ↗';
      case 'email':
        return 'Email Us ✉';
      case 'phone':
        return 'Call Us 📞';
      case 'whatsapp':
        return 'WhatsApp 💬';
      default:
        return '';
    }
  }
}
