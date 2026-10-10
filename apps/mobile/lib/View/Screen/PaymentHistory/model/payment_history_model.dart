class PaymentHistoryModel {
  final String id;
  final double amount;
  final String status; // 'Completed', 'Pending', 'Failed'
  final String date;
  final String title;

  PaymentHistoryModel({
    required this.id,
    required this.amount,
    required this.status,
    required this.date,
    required this.title,
  });
}
