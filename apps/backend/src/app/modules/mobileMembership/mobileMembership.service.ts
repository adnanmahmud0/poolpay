import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import {
  MembershipTier,
  SubscriptionStatus,
  MembershipProvider,
} from "../user/user.interface";
import { iapConfig } from "../../config/iap.config";
import logger from "../../utils/logger";
import { AuditLog, AuditAction, EntityType } from "../auditLog/auditLog.model";
import {
  emitRealTimeNotification,
  enqueuePushNotification,
  enqueueEmailNotification,
} from "../../utils/notification.utils";
import {
  Notification,
  NotificationType,
} from "../notification/notification.model";
import { withTransaction } from "../../utils/transaction.utils";

/**
 * Maps store product IDs to local database MembershipTiers
 */
const getTierFromProductId = (
  productId: string,
  platform: "google" | "apple"
): MembershipTier => {
  const regularId =
    platform === "google"
      ? iapConfig.products.google.regularId
      : iapConfig.products.apple.regularId;
  const vipId =
    platform === "google"
      ? iapConfig.products.google.vipId
      : iapConfig.products.apple.vipId;

  if (productId === regularId) {
    return MembershipTier.REGULAR;
  }
  if (productId === vipId) {
    return MembershipTier.VIP;
  }

  // Fallback string matching to make it resilient
  const lowerId = productId.toLowerCase();
  if (lowerId.includes("vip")) {
    return MembershipTier.VIP;
  }
  if (lowerId.includes("regular")) {
    return MembershipTier.REGULAR;
  }

  throw new AppError(
    httpStatus.BAD_REQUEST,
    `Invalid product ID: ${productId}. Could not map to a Membership Tier.`
  );
};

/**
 * Verifies purchase token against Google Play Store API
 */
const verifyGooglePurchase = async (
  userId: string,
  productId: string,
  token: string
) => {
  return await withTransaction(async (session) => {
    const user = await User.findById(userId).session(session || null);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const targetTier = getTierFromProductId(productId, "google");
    const packageName = iapConfig.products.google.packageName;
    const client = iapConfig.googleClient;

    let expiryTimeMillis: string;
    let autoRenewing = true;
    let platformSubscriptionId = token; // default fallback is token itself

    if (!client) {
      // DEVELOPMENT MOCK MODE
      if (process.env.NODE_ENV === "development") {
        logger.info(
          `[IAP-GOOGLE] Running in MOCK Mode for user ${userId}. Approving mock purchase.`
        );
        // Set mock expiry to 1 year from now
        expiryTimeMillis = String(Date.now() + 365 * 24 * 60 * 60 * 1000);
        autoRenewing = true;
      } else {
        throw new AppError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Google Play developer client is not configured on this server."
        );
      }
    } else {
      // PRODUCTION API CALL
      try {
        const response = await client.purchases.subscriptions.get({
          packageName,
          subscriptionId: productId,
          token,
        });

        const data = response.data;
        logger.info(
          `[IAP-GOOGLE] Google Play Store verified token successfully: ${JSON.stringify(data)}`
        );

        if (!data.expiryTimeMillis) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "Invalid subscription response: Missing expiry time from Google Play."
          );
        }

        expiryTimeMillis = data.expiryTimeMillis;
        autoRenewing = data.autoRenewing ?? true;

        if (data.orderId) {
          platformSubscriptionId = data.orderId;
        }
      } catch (error: unknown) {
        const err = error as Error;
        logger.error(
          `[IAP-GOOGLE] Failed to verify token with Google: ${err?.message || err}`
        );
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Google Play Store verification failed: ${err?.message || "Invalid purchase token"}`
        );
      }
    }

    const expiryDate = new Date(parseInt(expiryTimeMillis));
    const now = new Date();

    // Check if platform expiry date is in the past
    if (expiryDate.getTime() < now.getTime()) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This subscription expired on ${expiryDate.toISOString()} according to the Google Play Store.`
      );
    }

    // Perform database updates
    user.membershipTier = targetTier;
    user.subscriptionStatus = SubscriptionStatus.ACTIVE;
    user.subscriptionExpiry = expiryDate;
    user.membershipProvider = MembershipProvider.GOOGLE_PLAY;
    user.platformSubscriptionId = platformSubscriptionId;
    user.purchaseToken = token;
    user.autoRenewEnabled = autoRenewing;
    user.membershipStartedAt = user.membershipStartedAt || now;
    user.lastBillingDate = now;
    user.gracePeriodUntil = undefined;

    await user.save(session ? { session } : undefined);

    // Audit logs
    await AuditLog.create(
      [
        {
          entityType: EntityType.USER,
          entityId: userId,
          action: AuditAction.MEMBERSHIP_UPGRADE,
          metadata: {
            provider: MembershipProvider.GOOGLE_PLAY,
            tier: targetTier,
            productId,
            platformSubscriptionId,
            expiryDate,
          },
        },
      ],
      session ? { session } : undefined
    );

    // Notify User
    const title = "Membership Activated";
    const body = `Welcome! Your ${targetTier.toUpperCase()} membership has been successfully activated via Google Play.`;

    emitRealTimeNotification(userId, title, body);
    if (user.fcmToken) {
      await enqueuePushNotification(userId, title, body, {
        type: "membership_activated",
      });
    }
    await enqueueEmailNotification(user.email, title, "adminAlert", {
      message: body,
    });

    await Notification.create([
      {
        userId: user._id,
        title,
        message: body,
        type: NotificationType.NEW_MESSAGE,
      },
    ]);

    return {
      message:
        "Google Play Store purchase verified and membership activated successfully.",
      user: {
        membershipTier: user.membershipTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        membershipProvider: user.membershipProvider,
        autoRenewEnabled: user.autoRenewEnabled,
      },
    };
  });
};

/**
 * Stub/Placeholder for Apple IAP Verification (Implemented in Step 4)
 */
interface AppleReceiptItem {
  expires_date_ms: string;
  product_id: string;
  original_transaction_id: string;
}

interface AppleVerifyResponse {
  status: number;
  receipt?: unknown;
  latest_receipt_info?: AppleReceiptItem[];
  pending_renewal_info?: {
    product_id: string;
    auto_renew_status: string;
  }[];
}

/**
 * Helper to execute raw POST request to Apple's receipt validation API
 */
const callAppleVerifyAPI = async (
  receiptData: string,
  password?: string,
  useSandbox = false
): Promise<AppleVerifyResponse> => {
  const url = useSandbox
    ? iapConfig.apple.sandboxUrl
    : iapConfig.apple.productionUrl;

  try {
    const payload = {
      "receipt-data": receiptData,
      ...(password && { password }),
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP network error with Apple validation server. Status: ${response.status}`
      );
    }

    return (await response.json()) as AppleVerifyResponse;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(
      `[IAP-APPLE] HTTP request failed to Apple: ${err?.message || err}`
    );
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Could not connect to Apple App Store servers: ${err?.message || err}`
    );
  }
};

interface StoreKit2TransactionPayload {
  originalTransactionId: string;
  transactionId: string;
  productId: string;
  expiresDate?: number;
  purchaseDate?: number;
  type?: string;
}

interface StoreKit2RenewalPayload {
  autoRenewStatus?: number;
  productId?: string;
}

const decodeJwsPayload = <T = Record<string, unknown>>(
  jws: string
): T | null => {
  try {
    const parts = jws.split(".");
    if (parts.length < 2) return null;
    const jsonStr = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
};

/**
 * Helper to query Apple's modern StoreKit 2 App Store Server API
 */
const callStoreKit2TransactionAPI = async (
  transactionId: string,
  useSandbox = false
): Promise<{
  transaction: StoreKit2TransactionPayload;
  autoRenewing: boolean;
} | null> => {
  const token = iapConfig.apple.getSignedToken();
  if (!token) return null;

  const baseUrl = useSandbox
    ? iapConfig.apple.serverApiSandboxUrl
    : iapConfig.apple.serverApiUrl;

  const url = `${baseUrl}/inApps/v1/subscriptions/${transactionId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404 && !useSandbox) {
      // Retry against Sandbox endpoint
      logger.info(
        `[IAP-APPLE] Transaction ${transactionId} not found in production StoreKit 2, trying sandbox...`
      );
      return await callStoreKit2TransactionAPI(transactionId, true);
    }

    if (!response.ok) {
      // Try single transaction endpoint
      const singleTxUrl = `${baseUrl}/inApps/v1/transactions/${transactionId}`;
      const singleRes = await fetch(singleTxUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!singleRes.ok && !useSandbox) {
        return await callStoreKit2TransactionAPI(transactionId, true);
      }

      if (singleRes.ok) {
        const singleData = (await singleRes.json()) as {
          signedTransactionInfo?: string;
        };
        if (singleData.signedTransactionInfo) {
          const payload = decodeJwsPayload<StoreKit2TransactionPayload>(
            singleData.signedTransactionInfo
          );
          if (payload) {
            return { transaction: payload, autoRenewing: true };
          }
        }
      }

      logger.warn(
        `[IAP-APPLE] StoreKit 2 API returned status ${response.status} for transaction ${transactionId}`
      );
      return null;
    }

    const data = (await response.json()) as {
      data?: {
        lastTransactions?: {
          signedTransactionInfo: string;
          signedRenewalInfo?: string;
        }[];
      }[];
    };

    const firstGroup = data?.data?.[0];
    const lastTx = firstGroup?.lastTransactions?.[0];
    if (!lastTx?.signedTransactionInfo) {
      return null;
    }

    const txPayload = decodeJwsPayload<StoreKit2TransactionPayload>(
      lastTx.signedTransactionInfo
    );
    if (!txPayload) return null;

    let autoRenewing = true;
    if (lastTx.signedRenewalInfo) {
      const renewalPayload = decodeJwsPayload<StoreKit2RenewalPayload>(
        lastTx.signedRenewalInfo
      );
      if (
        renewalPayload &&
        typeof renewalPayload.autoRenewStatus === "number"
      ) {
        autoRenewing = renewalPayload.autoRenewStatus === 1;
      }
    }

    return { transaction: txPayload, autoRenewing };
  } catch (error) {
    logger.error(`[IAP-APPLE] Error querying StoreKit 2 server API: ${error}`);
    return null;
  }
};

/**
 * Verifies App Store purchase using modern StoreKit 2 API or legacy iTunes verifyReceipt
 */
const verifyApplePurchase = async (
  userId: string,
  receiptData?: string,
  rawTransactionId?: string,
  clientProductId?: string
): Promise<{ message: string; user: unknown }> => {
  return await withTransaction(async (session) => {
    const user = await User.findById(userId).session(session || null);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const sharedSecret = iapConfig.apple.sharedSecret;
    let expiresDateMs = "";
    let autoRenewing = true;
    let platformSubscriptionId = "";
    let productId = "";

    // Resolve transaction ID from client or receiptData if possible
    let transactionId = rawTransactionId;
    if (!transactionId && receiptData) {
      const cleanReceipt = receiptData.trim();
      if (/^\d{10,25}$/.test(cleanReceipt)) {
        transactionId = cleanReceipt;
      } else if (
        cleanReceipt.includes(".") &&
        cleanReceipt.split(".").length === 3
      ) {
        const jwsData =
          decodeJwsPayload<StoreKit2TransactionPayload>(cleanReceipt);
        if (jwsData?.transactionId) {
          transactionId = jwsData.transactionId;
        }
      }
    }

    let verifiedViaStoreKit2 = false;

    // 1. ATTEMPT STOREKIT 2 (App Store Server API with .p8 private key)
    if (transactionId) {
      logger.info(
        `[IAP-APPLE] Attempting StoreKit 2 verification for transaction: ${transactionId}`
      );
      const sk2Result = await callStoreKit2TransactionAPI(transactionId);
      if (sk2Result) {
        verifiedViaStoreKit2 = true;
        expiresDateMs = String(
          sk2Result.transaction.expiresDate ||
            Date.now() + 365 * 24 * 60 * 60 * 1000
        );
        productId = sk2Result.transaction.productId;
        platformSubscriptionId =
          sk2Result.transaction.originalTransactionId || transactionId;
        autoRenewing = sk2Result.autoRenewing;
        logger.info(
          `[IAP-APPLE] StoreKit 2 verification succeeded: productId=${productId}, expires=${expiresDateMs}`
        );
      }
    }

    // 2. FALLBACK TO STOREKIT 1 (Legacy verifyReceipt API) IF NOT VERIFIED VIA STOREKIT 2
    if (!verifiedViaStoreKit2) {
      if (
        process.env.NODE_ENV === "development" &&
        (!sharedSecret || receiptData === "mock_receipt_token")
      ) {
        logger.info(
          `[IAP-APPLE] Running in MOCK Mode for user ${userId}. Approving mock purchase.`
        );
        expiresDateMs = String(Date.now() + 365 * 24 * 60 * 60 * 1000);
        autoRenewing = true;
        platformSubscriptionId = transactionId || "mock_apple_trans_123456789";
        productId =
          clientProductId ||
          iapConfig.products.apple.regularId ||
          "regular_yearly_subscription";
      } else if (receiptData) {
        // PRODUCTION/SANDBOX APPLE RECEIPT VERIFICATION FLOW
        let appleResponse = await callAppleVerifyAPI(
          receiptData,
          sharedSecret,
          false
        ); // Try Production first

        // Status 21007 indicates a Sandbox receipt was sent to Production endpoint
        if (appleResponse.status === 21007) {
          logger.info(
            "[IAP-APPLE] Sandbox receipt sent to production, falling back to Sandbox verification."
          );
          appleResponse = await callAppleVerifyAPI(
            receiptData,
            sharedSecret,
            true
          ); // Fallback to Sandbox
        }

        if (appleResponse.status !== 0) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `App Store receipt validation failed with error code: ${appleResponse.status}`
          );
        }

        const latestReceiptInfo = appleResponse.latest_receipt_info;

        if (!latestReceiptInfo || latestReceiptInfo.length === 0) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "App Store receipt contains no latest purchase information."
          );
        }

        // Get the latest purchase item (sorted by expires_date_ms desc)
        const latestPurchase = latestReceiptInfo.reduce(
          (latest: AppleReceiptItem, current: AppleReceiptItem) => {
            const latestTime = parseInt(latest.expires_date_ms);
            const currentTime = parseInt(current.expires_date_ms);
            return currentTime > latestTime ? current : latest;
          },
          latestReceiptInfo[0]
        );

        logger.info(
          `[IAP-APPLE] App Store verified receipt successfully: ${JSON.stringify(latestPurchase)}`
        );

        expiresDateMs = latestPurchase.expires_date_ms;
        productId = latestPurchase.product_id;
        platformSubscriptionId = latestPurchase.original_transaction_id;

        // Extract auto-renewal status from pending_renewal_info if available
        const pendingRenewalInfo = appleResponse.pending_renewal_info;
        if (pendingRenewalInfo && pendingRenewalInfo.length > 0) {
          const renewalInfo = pendingRenewalInfo.find(
            (info) => info.product_id === productId
          );
          if (renewalInfo) {
            autoRenewing = renewalInfo.auto_renew_status === "1";
          }
        }
      } else {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Neither valid transactionId nor receiptData could be verified by Apple."
        );
      }
    }

    const targetTier = getTierFromProductId(productId, "apple");
    const expiryDate = new Date(parseInt(expiresDateMs));
    const now = new Date();

    // Check if platform expiry date is in the past
    if (expiryDate.getTime() < now.getTime()) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `This subscription expired on ${expiryDate.toISOString()} according to the App Store.`
      );
    }

    // Perform database updates
    user.membershipTier = targetTier;
    user.subscriptionStatus = SubscriptionStatus.ACTIVE;
    user.subscriptionExpiry = expiryDate;
    user.membershipProvider = MembershipProvider.APPLE_STORE;
    user.platformSubscriptionId = platformSubscriptionId;
    user.purchaseToken = receiptData; // Save receiptData as purchaseToken
    user.autoRenewEnabled = autoRenewing;
    user.membershipStartedAt = user.membershipStartedAt || now;
    user.lastBillingDate = now;
    user.gracePeriodUntil = undefined;

    await user.save(session ? { session } : undefined);

    // Audit logs
    await AuditLog.create(
      [
        {
          entityType: EntityType.USER,
          entityId: userId,
          action: AuditAction.MEMBERSHIP_UPGRADE,
          metadata: {
            provider: MembershipProvider.APPLE_STORE,
            tier: targetTier,
            productId,
            platformSubscriptionId,
            expiryDate,
          },
        },
      ],
      session ? { session } : undefined
    );

    // Notify User
    const title = "Membership Activated";
    const body = `Welcome! Your ${targetTier.toUpperCase()} membership has been successfully activated via Apple App Store.`;

    emitRealTimeNotification(userId, title, body);
    if (user.fcmToken) {
      await enqueuePushNotification(userId, title, body, {
        type: "membership_activated",
      });
    }
    await enqueueEmailNotification(user.email, title, "adminAlert", {
      message: body,
    });

    await Notification.create([
      {
        userId: user._id,
        title,
        message: body,
        type: NotificationType.NEW_MESSAGE,
      },
    ]);

    return {
      message:
        "Apple App Store receipt verified and membership activated successfully.",
      user: {
        membershipTier: user.membershipTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        membershipProvider: user.membershipProvider,
        autoRenewEnabled: user.autoRenewEnabled,
      },
    };
  });
};

/**
 * Synchronizes user's Google Play or App Store subscription status on-demand
 */
const syncMobileSubscriptionStatus = async (userId: string) => {
  return await withTransaction(async (session) => {
    const user = await User.findById(userId).session(session || null);
    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    // If no provider, skip remote verification sync
    if (!user.membershipProvider) {
      return {
        message: "No mobile subscription provider found for this account.",
        user: {
          membershipTier: user.membershipTier,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiry: user.subscriptionExpiry,
          membershipProvider: user.membershipProvider,
        },
      };
    }

    let expiryTimeMillis = "";
    let autoRenewing = true;
    const now = new Date();

    if (user.membershipProvider === MembershipProvider.GOOGLE_PLAY) {
      const token = user.purchaseToken;
      const client = iapConfig.googleClient;
      const packageName = iapConfig.products.google.packageName;

      // Find the user's mapped active product ID (Regular or VIP)
      let productId =
        iapConfig.products.google.regularId || "regular_membership";
      if (user.membershipTier === MembershipTier.VIP) {
        productId = iapConfig.products.google.vipId || "vip_membership";
      }

      if (!token) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "No purchase token found for Google Play subscription."
        );
      }

      if (!client) {
        // Development Mock
        if (process.env.NODE_ENV === "development") {
          logger.info(
            `[IAP-SYNC] Running in MOCK Mode for Google Play user ${userId}`
          );
          expiryTimeMillis = user.subscriptionExpiry
            ? String(user.subscriptionExpiry.getTime())
            : String(Date.now() + 365 * 24 * 60 * 60 * 1000);
          autoRenewing = user.autoRenewEnabled;
        } else {
          throw new AppError(
            httpStatus.INTERNAL_SERVER_ERROR,
            "Google Play client is not configured."
          );
        }
      } else {
        // Production validation
        try {
          const response = await client.purchases.subscriptions.get({
            packageName,
            subscriptionId: productId,
            token,
          });
          expiryTimeMillis = response.data.expiryTimeMillis || "";
          autoRenewing = response.data.autoRenewing ?? true;
        } catch (error: unknown) {
          const err = error as Error;
          logger.error(`[IAP-SYNC] Google sync failed: ${err?.message || err}`);
          const alternateProductId =
            productId === iapConfig.products.google.regularId
              ? iapConfig.products.google.vipId || "vip_membership"
              : iapConfig.products.google.regularId || "regular_membership";

          try {
            const response = await client.purchases.subscriptions.get({
              packageName,
              subscriptionId: alternateProductId,
              token,
            });
            expiryTimeMillis = response.data.expiryTimeMillis || "";
            autoRenewing = response.data.autoRenewing ?? true;
          } catch (altError: unknown) {
            const altErr = altError as Error;
            logger.error(
              `[IAP-SYNC] Google alternate sync also failed: ${altErr?.message || altErr}`
            );
            throw new AppError(
              httpStatus.BAD_REQUEST,
              `Failed to sync with Google Play: ${altErr?.message || altErr}`
            );
          }
        }
      }
    } else if (user.membershipProvider === MembershipProvider.APPLE_STORE) {
      const receiptData = user.purchaseToken; // saved receipt data
      const sharedSecret = iapConfig.apple.sharedSecret;

      if (!receiptData) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "No receipt data found for Apple subscription."
        );
      }

      if (
        process.env.NODE_ENV === "development" &&
        (!sharedSecret || receiptData === "mock_receipt_token")
      ) {
        logger.info(`[IAP-SYNC] Running in MOCK Mode for Apple user ${userId}`);
        expiryTimeMillis = user.subscriptionExpiry
          ? String(user.subscriptionExpiry.getTime())
          : String(Date.now() + 365 * 24 * 60 * 60 * 1000);
        autoRenewing = user.autoRenewEnabled;
      } else {
        let appleResponse = await callAppleVerifyAPI(
          receiptData,
          sharedSecret,
          false
        );
        if (appleResponse.status === 21007) {
          appleResponse = await callAppleVerifyAPI(
            receiptData,
            sharedSecret,
            true
          );
        }

        if (appleResponse.status !== 0) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `App Store sync failed. Status: ${appleResponse.status}`
          );
        }

        const latestReceiptInfo = appleResponse.latest_receipt_info;
        if (!latestReceiptInfo || latestReceiptInfo.length === 0) {
          throw new AppError(
            httpStatus.BAD_REQUEST,
            "App Store returned no purchase details."
          );
        }

        const latestPurchase = latestReceiptInfo.reduce(
          (latest: AppleReceiptItem, current: AppleReceiptItem) => {
            const latestTime = parseInt(latest.expires_date_ms);
            const currentTime = parseInt(current.expires_date_ms);
            return currentTime > latestTime ? current : latest;
          },
          latestReceiptInfo[0]
        );

        expiryTimeMillis = latestPurchase.expires_date_ms;

        const pendingRenewalInfo = appleResponse.pending_renewal_info;
        if (pendingRenewalInfo && pendingRenewalInfo.length > 0) {
          const renewalInfo = pendingRenewalInfo.find(
            (info) => info.product_id === latestPurchase.product_id
          );
          if (renewalInfo) {
            autoRenewing = renewalInfo.auto_renew_status === "1";
          }
        }
      }
    }

    const expiryDate = new Date(parseInt(expiryTimeMillis));
    let statusUpdated = false;

    // Check if expired
    if (expiryDate.getTime() < now.getTime()) {
      // Automatic downgrade
      if (user.membershipTier !== MembershipTier.GUEST) {
        user.membershipTier = MembershipTier.GUEST;
        user.subscriptionStatus = SubscriptionStatus.EXPIRED;
        user.autoRenewEnabled = false;
        user.subscriptionExpiry = expiryDate;
        statusUpdated = true;

        // Audit Log
        await AuditLog.create(
          [
            {
              entityType: EntityType.USER,
              entityId: userId,
              action: AuditAction.MEMBERSHIP_CANCEL,
              metadata: {
                reason: "Expired",
                provider: user.membershipProvider,
              },
            },
          ],
          session ? { session } : undefined
        );

        // Notify User
        const title = "Membership Expired";
        const body = `Your ${user.membershipTier.toUpperCase()} membership has expired and your account has been returned to GUEST status.`;
        emitRealTimeNotification(userId, title, body);
        if (user.fcmToken) {
          await enqueuePushNotification(userId, title, body, {
            type: "membership_expired",
          });
        }
        await enqueueEmailNotification(user.email, title, "adminAlert", {
          message: body,
        });

        await Notification.create([
          {
            userId: user._id,
            title,
            message: body,
            type: NotificationType.PAYMENT_FAILED,
          },
        ]);
      }
    } else {
      // Just update renewal state or expiry date if modified by store (e.g. extension, cancellation)
      if (
        user.autoRenewEnabled !== autoRenewing ||
        user.subscriptionExpiry?.getTime() !== expiryDate.getTime()
      ) {
        user.autoRenewEnabled = autoRenewing;
        user.subscriptionExpiry = expiryDate;
        user.subscriptionStatus = SubscriptionStatus.ACTIVE;
        statusUpdated = true;
      }
    }

    if (statusUpdated) {
      await user.save(session ? { session } : undefined);
    }

    return {
      message: "Subscription synchronized successfully.",
      user: {
        membershipTier: user.membershipTier,
        subscriptionStatus: user.subscriptionStatus,
        subscriptionExpiry: user.subscriptionExpiry,
        membershipProvider: user.membershipProvider,
        autoRenewEnabled: user.autoRenewEnabled,
      },
    };
  });
};

export const MobileMembershipServices = {
  verifyGooglePurchase,
  verifyApplePurchase,
  syncMobileSubscriptionStatus,
};
