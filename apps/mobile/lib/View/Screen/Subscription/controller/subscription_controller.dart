import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:in_app_purchase/in_app_purchase.dart';
import '../../../../helper/shared_prefe/shared_prefe.dart';
import '../../../../service/api_url.dart';
import '../../../../Utils/ToastMessage/custom_toast.dart';
import '../../Profile/controller/profile_controller.dart';
import '../../../../config/app_credentials.dart';

class SubscriptionController extends GetxController {
  final ProfileController profileController = Get.isRegistered<ProfileController>()
      ? Get.find<ProfileController>()
      : Get.put(ProfileController());

  // Native In-App Purchase setup
  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _subscription;

  static const String regularProductId = AppCredentials.regularSubscriptionId;
  static const String vipProductId = AppCredentials.vipSubscriptionId;
  static const Set<String> _kProductIds = AppCredentials.subscriptionProductIds;

  var isIapAvailable = false.obs;
  var isQueryingProducts = true.obs;
  var products = <ProductDetails>[].obs;
  var isLoading = false.obs;
  var isRestoring = false.obs;
  var selectedTier = "".obs;
  var upgradingTier = "".obs;
  var isCancelling = false.obs;

  @override
  void onInit() {
    super.onInit();
    selectedTier.value = profileController.membershipTier.value;
    _initIap();
  }

  @override
  void onClose() {
    _subscription?.cancel();
    super.onClose();
  }

  Future<void> _initIap() async {
    isQueryingProducts.value = true;
    final Stream<List<PurchaseDetails>> purchaseUpdated = _iap.purchaseStream;
    _subscription = purchaseUpdated.listen(
      (List<PurchaseDetails> purchaseDetailsList) {
        _handlePurchaseUpdates(purchaseDetailsList);
      },
      onDone: () => _subscription?.cancel(),
      onError: (error) {
        debugPrint("[IAP] Purchase stream error: $error");
      },
    );

    try {
      isIapAvailable.value = await _iap.isAvailable();
      if (isIapAvailable.value) {
        final ProductDetailsResponse response =
            await _iap.queryProductDetails(_kProductIds);
        if (response.error == null) {
          products.value = response.productDetails;
          debugPrint("[IAP] Fetched ${products.length} products from Google Play:");
          for (var p in products) {
            debugPrint("[IAP] -> id: ${p.id}, title: ${p.title}, price: ${p.price}, rawPrice: ${p.rawPrice}");
          }
        } else {
          debugPrint("[IAP] Product query error: ${response.error!.message}");
        }
      }
    } catch (e) {
      debugPrint("[IAP] Initialization error: $e");
    } finally {
      isQueryingProducts.value = false;
    }
  }

  Future<void> refreshProducts() async {
    await _initIap();
  }

  ProductDetails? getProduct(String tier) {
    final cleanTier = tier.trim().toUpperCase();
    // GUEST is a free tier and does not have an in-app purchase product
    if (cleanTier == "GUEST" || cleanTier == "FREE") {
      return null;
    }

    final isVip = cleanTier == "VIP";
    final targetProducts = displayProducts;
    return targetProducts.firstWhereOrNull((p) {
      final isPVip = p.id.toLowerCase().contains("vip") || p.title.toLowerCase().contains("vip");
      return isVip ? isPVip : !isPVip;
    });
  }

  /// Returns unique products dynamically fetched from Google Play, sorted with Regular first, VIP second.
  List<ProductDetails> get displayProducts {
    if (products.isEmpty) return [];

    final regularMatches = products.where((p) {
      final pid = p.id.toLowerCase();
      final title = p.title.toLowerCase();
      return (pid == regularProductId.toLowerCase() || pid.contains("regular") || title.contains("regular")) &&
          !pid.contains("vip") && !title.contains("vip");
    }).toList();

    final vipMatches = products.where((p) {
      final pid = p.id.toLowerCase();
      final title = p.title.toLowerCase();
      return pid == vipProductId.toLowerCase() || pid.contains("vip") || title.contains("vip");
    }).toList();

    final List<ProductDetails> list = [];

    if (regularMatches.isNotEmpty) {
      // Sort ascending so the base $5 / 700 BDT offer is picked
      regularMatches.sort((a, b) => a.rawPrice.compareTo(b.rawPrice));
      list.add(regularMatches.first);
    }

    if (vipMatches.isNotEmpty) {
      // Sort descending so the $10 / 1400 BDT offer is picked
      vipMatches.sort((a, b) => b.rawPrice.compareTo(a.rawPrice));
      list.add(vipMatches.first);
    }

    // Fallback if naming didn't match: deduplicate by id and sort ascending
    if (list.isEmpty) {
      final Map<String, ProductDetails> uniqueById = {};
      for (var p in products) {
        if (!uniqueById.containsKey(p.id) || p.rawPrice < uniqueById[p.id]!.rawPrice) {
          uniqueById[p.id] = p;
        }
      }
      final fallbackList = uniqueById.values.toList();
      fallbackList.sort((a, b) => a.rawPrice.compareTo(b.rawPrice));
      return fallbackList;
    }

    return list;
  }

  Future<void> buyProduct(ProductDetails product) async {
    final isVip = product.id.toLowerCase().contains("vip") || product.title.toLowerCase().contains("vip");
    final tier = isVip ? "vip" : "regular";

    if (tier.toUpperCase() == profileController.membershipTier.value.toUpperCase()) {
      CustomToast.showWarning("Info", "You are already on this plan");
      return;
    }

    if (!isIapAvailable.value) {
      CustomToast.showError("Unavailable", "In-App Purchases are currently unavailable on this device.");
      return;
    }

    upgradingTier.value = tier;
    isLoading.value = true;

    try {
      final PurchaseParam purchaseParam =
          PurchaseParam(productDetails: product);
      await _iap.buyNonConsumable(purchaseParam: purchaseParam);
    } catch (e) {
      debugPrint("Upgrade error: $e");
      CustomToast.showError("Error", "Failed to start purchase process");
      isLoading.value = false;
      upgradingTier.value = "";
    }
  }

  Future<void> upgradeTo(String tier) async {
    if (tier.toUpperCase() == profileController.membershipTier.value.toUpperCase()) {
      CustomToast.showWarning("Info", "You are already on this plan");
      return;
    }

    if (!isIapAvailable.value) {
      CustomToast.showError("Unavailable", "In-App Purchases are currently unavailable on this device.");
      return;
    }

    ProductDetails? targetProduct = getProduct(tier);
    if (targetProduct == null) {
      CustomToast.showError("Error", "Selected plan product details not found in store.");
      return;
    }

    upgradingTier.value = tier.toLowerCase();
    isLoading.value = true;

    try {
      final PurchaseParam purchaseParam =
          PurchaseParam(productDetails: targetProduct);
      await _iap.buyNonConsumable(purchaseParam: purchaseParam);
    } catch (e) {
      debugPrint("Upgrade error: $e");
      CustomToast.showError("Error", "Failed to start purchase process");
      isLoading.value = false;
      upgradingTier.value = "";
    }
  }

  Future<void> _handlePurchaseUpdates(List<PurchaseDetails> purchaseDetailsList) async {
    for (var purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.status == PurchaseStatus.pending) {
        isLoading.value = true;
      } else {
        isLoading.value = false;
        upgradingTier.value = "";

        if (purchaseDetails.status == PurchaseStatus.error) {
          CustomToast.showError("Purchase Error", purchaseDetails.error?.message ?? "Purchase failed");
          if (purchaseDetails.pendingCompletePurchase) {
            await _iap.completePurchase(purchaseDetails);
          }
        } else if (purchaseDetails.status == PurchaseStatus.canceled) {
          CustomToast.showWarning("Cancelled", "Purchase was cancelled");
          if (purchaseDetails.pendingCompletePurchase) {
            await _iap.completePurchase(purchaseDetails);
          }
        } else if (purchaseDetails.status == PurchaseStatus.purchased ||
            purchaseDetails.status == PurchaseStatus.restored) {
          bool verified = await _verifyPurchaseOnServer(purchaseDetails);
          if (verified) {
            if (purchaseDetails.pendingCompletePurchase) {
              await _iap.completePurchase(purchaseDetails);
            }
            await profileController.fetchMembershipStatus();
            selectedTier.value = profileController.membershipTier.value;
            CustomToast.showSuccess("Success", "Subscription verified successfully!");
          } else {
            CustomToast.showError("Verification Failed", "Failed to verify receipt with backend server.");
          }
        }
      }
    }
  }

  Future<bool> _verifyPurchaseOnServer(PurchaseDetails purchase) async {
    try {
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null) return false;

      http.Response response;
      if (Platform.isAndroid) {
        response = await http.post(
          Uri.parse(ApiUrl.verifyGoogleUrl),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            "token": purchase.verificationData.serverVerificationData,
            "productId": purchase.productID,
          }),
        );
      } else if (Platform.isIOS) {
        response = await http.post(
          Uri.parse(ApiUrl.verifyAppleUrl),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            "receiptData": purchase.verificationData.serverVerificationData,
            "transactionId": purchase.purchaseID,
            "productId": purchase.productID,
          }),
        );
      } else {
        return false;
      }

      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      } else {
        debugPrint("Backend verification error: ${response.statusCode} - ${response.body}");
        return false;
      }
    } catch (e) {
      debugPrint("Server verification exception: $e");
      return false;
    }
  }

  Future<void> restorePurchases() async {
    try {
      isRestoring.value = true;
      if (isIapAvailable.value) {
        await _iap.restorePurchases();
      }

      // Sync backend with store servers
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token != null) {
        await http.post(
          Uri.parse(ApiUrl.mobileMembershipSyncUrl),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
        );
      }

      await profileController.fetchMembershipStatus();
      selectedTier.value = profileController.membershipTier.value;
      CustomToast.showSuccess("Success", "Purchases restored and synced!");
    } catch (e) {
      debugPrint("Restore error: $e");
      CustomToast.showError("Error", "Failed to restore purchases");
    } finally {
      isRestoring.value = false;
    }
  }

  Future<void> cancelSubscription() async {
    try {
      isCancelling.value = true;
      String? token = await PrefsHelper.getString(PrefsHelper.token);
      if (token == null) return;

      final response = await http.post(
        Uri.parse(ApiUrl.cancelSubscriptionUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        await profileController.fetchMembershipStatus();
        selectedTier.value = profileController.membershipTier.value;
        CustomToast.showSuccess("Success", "Subscription cancelled successfully.");
      } else {
        final data = jsonDecode(response.body);
        CustomToast.showError("Error", data['message'] ?? "Failed to cancel subscription");
      }
    } catch (e) {
      debugPrint("Cancel error: $e");
      CustomToast.showError("Error", "Failed to cancel subscription");
    } finally {
      isCancelling.value = false;
    }
  }
}
