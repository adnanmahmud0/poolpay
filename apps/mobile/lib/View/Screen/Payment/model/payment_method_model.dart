class PaymentMethodModel {
  final String id;
  final String name;
  final String lastDigits;
  final String iconPath;
  final bool isDefault;

  PaymentMethodModel({
    required this.id,
    required this.name,
    required this.lastDigits,
    required this.iconPath,
    this.isDefault = false,
  });
}
