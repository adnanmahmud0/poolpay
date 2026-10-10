import '../../../../../Utils/AppIcons/app_icons.dart';

class PaymentMethodModel {
  final String id;
  final String type; // 'card', 'bank', 'wallet', 'redirect', 'bnpl', 'realtime'
  final String? stripeType;
  final String last4;
  final String? brand; // 'visa', 'mastercard', 'Cash App Pay', etc.
  final String? bankName;
  final int? expiryMonth;
  final int? expiryYear;
  final String? status; // 'active', 'pending_verification'
  final bool isDefault;
  final bool autoPayEnabled;

  PaymentMethodModel({
    required this.id,
    required this.type,
    this.stripeType,
    required this.last4,
    this.brand,
    this.bankName,
    this.expiryMonth,
    this.expiryYear,
    this.status,
    this.isDefault = false,
    this.autoPayEnabled = true,
  });

  factory PaymentMethodModel.fromJson(Map<String, dynamic> json) {
    return PaymentMethodModel(
      id: json['_id'] ?? json['id'] ?? '',
      type: json['type'] ?? 'card',
      stripeType: json['stripeType'],
      last4: json['last4'] ?? '****',
      brand: json['brand'],
      bankName: json['bankName'],
      expiryMonth: json['expiryMonth'],
      expiryYear: json['expiryYear'],
      status: json['status'],
      isDefault: json['isDefault'] ?? false,
      autoPayEnabled: json['autoPayEnabled'] ?? true,
    );
  }

  // Computed display properties
  String get name {
    if (brand != null && brand!.isNotEmpty && brand != 'Unknown') {
      return brand!;
    }
    if (bankName != null && bankName!.isNotEmpty) {
      return bankName!;
    }
    if (type == 'bank') return 'Bank Account';
    if (type == 'wallet') return 'Digital Wallet';
    if (type == 'bnpl') return 'Buy Now Pay Later';
    if (type == 'redirect') return 'Online Banking';
    if (type == 'realtime') return 'Real-time Payment';
    return 'Card';
  }

  String get lastDigits {
    if (last4.isNotEmpty && last4 != '****') {
      return '•••• •••• •••• $last4';
    }
    return '';
  }

  String get iconPath =>
      type == 'bank' ? AppIcons.bankIcons : AppIcons.debitCreditCardIcon;

  String get expiryFormatted {
    if (expiryMonth != null && expiryYear != null) {
      final yStr = expiryYear.toString();
      final yearShort = yStr.length >= 2 ? yStr.substring(yStr.length - 2) : yStr;
      return '${expiryMonth.toString().padLeft(2, '0')}/$yearShort';
    }
    return '';
  }

  PaymentMethodModel copyWith({
    String? id,
    String? type,
    String? stripeType,
    String? last4,
    String? brand,
    String? bankName,
    int? expiryMonth,
    int? expiryYear,
    String? status,
    bool? isDefault,
    bool? autoPayEnabled,
  }) {
    return PaymentMethodModel(
      id: id ?? this.id,
      type: type ?? this.type,
      stripeType: stripeType ?? this.stripeType,
      last4: last4 ?? this.last4,
      brand: brand ?? this.brand,
      bankName: bankName ?? this.bankName,
      expiryMonth: expiryMonth ?? this.expiryMonth,
      expiryYear: expiryYear ?? this.expiryYear,
      status: status ?? this.status,
      isDefault: isDefault ?? this.isDefault,
      autoPayEnabled: autoPayEnabled ?? this.autoPayEnabled,
    );
  }
}
