import 'package:flutter/material.dart';
import 'package:get/get.dart';

// ─── Data model for a payment method entry ─────────────────────────────────

class _PaymentMethodInfo {
  final String emoji;
  final String name;
  final String region;
  final String fee;
  final String processingTime;
  final String category;
  final Color categoryColor;

  const _PaymentMethodInfo({
    required this.emoji,
    required this.name,
    required this.region,
    required this.fee,
    required this.processingTime,
    required this.category,
    required this.categoryColor,
  });
}

// ─── All enabled payment methods ──────────────────────────────────────────────

const _methods = [
  // ── Cards ─────────────────────────────────────────────────────────────────
  _PaymentMethodInfo(
    emoji: '💳',
    name: 'Credit / Debit Card',
    region: 'All regions',
    fee: '2.9% + \$0.30',
    processingTime: 'Instant',
    category: 'Cards',
    categoryColor: Color(0xFF1A227F),
  ),
  _PaymentMethodInfo(
    emoji: '🇫🇷',
    name: 'Cartes Bancaires',
    region: 'France',
    fee: '1.5% + €0.25',
    processingTime: 'Instant',
    category: 'Cards',
    categoryColor: Color(0xFF1A227F),
  ),

  // ── Wallets ───────────────────────────────────────────────────────────────
  _PaymentMethodInfo(
    emoji: '🛒',
    name: 'Amazon Pay',
    region: 'All regions',
    fee: '2.9% + \$0.30',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFFFF9900),
  ),
  _PaymentMethodInfo(
    emoji: '🍎',
    name: 'Apple Pay',
    region: 'All regions',
    fee: '2.9% + \$0.30',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFF000000),
  ),
  _PaymentMethodInfo(
    emoji: '💵',
    name: 'Cash App Pay',
    region: 'United States',
    fee: '2.5% + \$0.10',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFF00C244),
  ),
  _PaymentMethodInfo(
    emoji: '🔵',
    name: 'Google Pay',
    region: 'All regions',
    fee: '2.9% + \$0.30',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFF4285F4),
  ),
  _PaymentMethodInfo(
    emoji: '🇰🇷',
    name: 'Kakao Pay',
    region: 'South Korea',
    fee: '2.9% + \$0.30',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFFFFE000),
  ),
  _PaymentMethodInfo(
    emoji: '🔗',
    name: 'Link by Stripe',
    region: 'All regions',
    fee: '2.9% + \$0.30',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFF00D4FF),
  ),
  _PaymentMethodInfo(
    emoji: '🇵🇹',
    name: 'MB WAY',
    region: 'Portugal',
    fee: '1.2%',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFFE30613),
  ),
  _PaymentMethodInfo(
    emoji: '🇰🇷',
    name: 'Naver Pay',
    region: 'South Korea',
    fee: '2.9% + \$0.30',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFF03C75A),
  ),
  _PaymentMethodInfo(
    emoji: '🇰🇷',
    name: 'PAYCO',
    region: 'South Korea',
    fee: '2.9% + \$0.30',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFFFF4646),
  ),
  _PaymentMethodInfo(
    emoji: '📱',
    name: 'Samsung Pay',
    region: 'South Korea',
    fee: '2.9% + \$0.30',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFF1428A0),
  ),
  _PaymentMethodInfo(
    emoji: '⚡',
    name: 'Stripe Balance',
    region: 'All regions',
    fee: '0% (no fee)',
    processingTime: 'Instant',
    category: 'Wallet',
    categoryColor: Color(0xFF6773FF),
  ),

  // ── Bank Redirects ────────────────────────────────────────────────────────
  _PaymentMethodInfo(
    emoji: '🇧🇪',
    name: 'Bancontact',
    region: 'Belgium',
    fee: '1.5%',
    processingTime: 'Instant',
    category: 'Bank Redirect',
    categoryColor: Color(0xFF0066CC),
  ),
  _PaymentMethodInfo(
    emoji: '🇵🇱',
    name: 'BLIK',
    region: 'Poland',
    fee: '1.5%',
    processingTime: 'Instant',
    category: 'Bank Redirect',
    categoryColor: Color(0xFFE2000F),
  ),
  _PaymentMethodInfo(
    emoji: '🇦🇹',
    name: 'EPS',
    region: 'Austria',
    fee: '1.8%',
    processingTime: 'Instant',
    category: 'Bank Redirect',
    categoryColor: Color(0xFFED1C24),
  ),

  // ── Buy Now Pay Later ─────────────────────────────────────────────────────
  _PaymentMethodInfo(
    emoji: '🛍️',
    name: 'Affirm',
    region: 'US, Canada',
    fee: '5.99% + \$0.30',
    processingTime: 'Instant approval',
    category: 'BNPL',
    categoryColor: Color(0xFF0046F0),
  ),
  _PaymentMethodInfo(
    emoji: '🛒',
    name: 'Klarna',
    region: 'All regions',
    fee: '5.99% + \$0.30',
    processingTime: 'Instant approval',
    category: 'BNPL',
    categoryColor: Color(0xFFFFB3C7),
  ),

  // ── Bank Debit ────────────────────────────────────────────────────────────
  _PaymentMethodInfo(
    emoji: '🏦',
    name: 'ACH Direct Debit',
    region: 'United States',
    fee: '0.8%, max \$5.00',
    processingTime: '3–5 business days',
    category: 'Bank Debit',
    categoryColor: Color(0xFF22C55E),
  ),

  // ── Bank Transfers ────────────────────────────────────────────────────────
  _PaymentMethodInfo(
    emoji: '🏛️',
    name: 'Bank Transfers',
    region: 'Europe, UK, JP, MX, US',
    fee: '0.8%, max \$5.00',
    processingTime: '1–5 business days',
    category: 'Bank Transfer',
    categoryColor: Color(0xFF0EA5E9),
  ),

  // ── Real-time Payments ────────────────────────────────────────────────────
  _PaymentMethodInfo(
    emoji: '🇧🇷',
    name: 'Pix',
    region: 'Brazil',
    fee: '~1%',
    processingTime: 'Instant (minutes)',
    category: 'Real-time',
    categoryColor: Color(0xFF32BCAD),
  ),
];

// ─── Screen ───────────────────────────────────────────────────────────────────

class PaymentMethodsInfoScreen extends StatelessWidget {
  const PaymentMethodsInfoScreen({Key? key}) : super(key: key);

  // Group methods by category
  Map<String, List<_PaymentMethodInfo>> get _grouped {
    final Map<String, List<_PaymentMethodInfo>> map = {};
    for (final m in _methods) {
      map.putIfAbsent(m.category, () => []).add(m);
    }
    return map;
  }

  @override
  Widget build(BuildContext context) {
    final grouped = _grouped;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        slivers: [
          // ── App Bar ────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            backgroundColor: const Color(0xFF1A227F),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Get.back(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              titlePadding:
                  const EdgeInsets.only(left: 24, bottom: 16, right: 24),
              title: const Text(
                'Payment Methods',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                ),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF6773FF), Color(0xFF1A227F)],
                  ),
                ),
                child: Align(
                  alignment: Alignment.topRight,
                  child: Padding(
                    padding: const EdgeInsets.only(top: 48, right: 24),
                    child: Text(
                      '${_methods.length} methods enabled',
                      style: const TextStyle(
                        color: Colors.white60,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),

          // ── Info Banner ────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBFDBFE)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text('ℹ️', style: TextStyle(fontSize: 16)),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'All fees shown are charged by Stripe and deducted from your pool payouts. Processing time is how long it takes for funds to clear after payment.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF1E40AF),
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Category Sections ──────────────────────────────────────────
          ...grouped.entries.map((entry) {
            return SliverToBoxAdapter(
              child: _buildCategory(
                category: entry.key,
                methods: entry.value,
                color: entry.value.first.categoryColor,
              ),
            );
          }).toList(),

          // ── Bottom Note ────────────────────────────────────────────────
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 40),
              child: Text(
                '* Fees and processing times may vary by region and Stripe account tier. All amounts are approximate.',
                style: TextStyle(
                  fontSize: 11,
                  color: Color(0xFF94A3B8),
                  height: 1.6,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategory({
    required String category,
    required List<_PaymentMethodInfo> methods,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Category header
          Row(
            children: [
              Container(
                width: 4,
                height: 18,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                category.toUpperCase(),
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  color: color,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '(${methods.length})',
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF94A3B8),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Method cards
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: List.generate(methods.length, (i) {
                final method = methods[i];
                final isLast = i == methods.length - 1;
                return _buildMethodRow(method, isLast, color);
              }),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _buildMethodRow(
      _PaymentMethodInfo method, bool isLast, Color categoryColor) {
    // Determine speed badge
    final isInstant = method.processingTime.toLowerCase().contains('instant');
    final isFast = method.processingTime.toLowerCase().contains('minute');
    final badgeColor = isInstant || isFast
        ? const Color(0xFF22C55E)
        : const Color(0xFFF59E0B);
    final badgeText = isInstant || isFast ? '⚡ Instant' : '🕐 ${method.processingTime}';

    // Determine if fee is low
    final isLowFee = method.fee.contains('0.8%') ||
        method.fee.contains('0%') ||
        method.fee.contains('1%') ||
        method.fee.contains('1.2%') ||
        method.fee.contains('1.5%');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(
                bottom: BorderSide(color: Color(0xFFF1F5F9))),
      ),
      child: Row(
        children: [
          // Emoji icon
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: categoryColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Center(
              child: Text(
                method.emoji,
                style: const TextStyle(fontSize: 18),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Name & region
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        method.name,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF0F172A),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isLowFee) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFDCFCE7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'LOW FEE',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF15803D),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  method.region,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF94A3B8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Fee + time
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                method.fee,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: isLowFee
                      ? const Color(0xFF15803D)
                      : const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badgeText,
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: badgeColor,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
