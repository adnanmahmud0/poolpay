import { google } from "googleapis";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { envVars } from "./env";
import logger from "../utils/logger";

const getGoogleAndroidPublisher = () => {
  const serviceAccountBase64 = envVars.IAP.GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64;
  const serviceAccountPath = envVars.IAP.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH;
  const packageName = envVars.IAP.GOOGLE_PLAY_PACKAGE_NAME;

  try {
    let auth: InstanceType<typeof google.auth.GoogleAuth> | null = null;

    // 1. Try Base64 JSON directly from .env (no file on disk needed)
    if (serviceAccountBase64) {
      try {
        const jsonStr = Buffer.from(serviceAccountBase64, "base64").toString("utf8");
        const credentials = JSON.parse(jsonStr);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ["https://www.googleapis.com/auth/androidpublisher"],
        });
        logger.info(`[IAP] Google Play client configured via in-memory credentials for ${packageName}`);
      } catch (parseErr) {
        logger.error(`[IAP] Failed to parse GOOGLE_PLAY_SERVICE_ACCOUNT_BASE64: ${parseErr}`);
      }
    }

    // 2. Fallback to reading file on disk
    if (!auth && serviceAccountPath) {
      let resolvedPath = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.resolve(process.cwd(), serviceAccountPath);

      if (!fs.existsSync(resolvedPath)) {
        const fallbackPath = path.resolve(process.cwd(), "derival81", serviceAccountPath);
        if (fs.existsSync(fallbackPath)) {
          resolvedPath = fallbackPath;
        }
      }

      if (fs.existsSync(resolvedPath)) {
        auth = new google.auth.GoogleAuth({
          keyFile: resolvedPath,
          scopes: ["https://www.googleapis.com/auth/androidpublisher"],
        });
      } else {
        logger.warn(`[IAP] Google Service Account key file not found at: ${resolvedPath}.`);
      }
    }

    if (!auth) {
      logger.warn("[IAP] No Google Play credentials found. Google Play IAP verification will run in MOCK mode.");
      return null;
    }

    const androidPublisher = google.androidpublisher({
      version: "v3",
      auth,
    });

    return androidPublisher;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`[IAP] Failed to initialize Google Play client: ${err?.message || err}. Will fallback to MOCK mode.`);
    return null;
  }
};

/**
 * Generates an Apple App Store Server API ES256 signed JWT bearer token
 * using the .p8 private key, Issuer ID, and Key ID.
 */
const getAppleServerToken = (): string | null => {
  const issuerId = envVars.IAP.APPLE_ISSUER_ID;
  const keyId = envVars.IAP.APPLE_KEY_ID;
  const bundleId = envVars.IAP.APPLE_BUNDLE_ID || "com.poolpay.app";
  const keyBase64 = envVars.IAP.APPLE_PRIVATE_KEY_BASE64;
  const keyPath = envVars.IAP.APPLE_PRIVATE_KEY_PATH;

  if (!issuerId || !keyId) {
    return null;
  }

  let privateKey: string | null = null;

  // 1. Try Base64 string directly from .env (no file needed)
  if (keyBase64) {
    try {
      privateKey = Buffer.from(keyBase64, "base64").toString("utf8");
    } catch (e) {
      logger.error(`[IAP] Failed to decode APPLE_PRIVATE_KEY_BASE64: ${e}`);
    }
  }

  // 2. Fallback to reading file on disk
  if (!privateKey && keyPath) {
    let resolvedPath = path.isAbsolute(keyPath)
      ? keyPath
      : path.resolve(process.cwd(), keyPath);

    if (!fs.existsSync(resolvedPath)) {
      const fallbackPath = path.resolve(process.cwd(), "apps", "api", keyPath);
      if (fs.existsSync(fallbackPath)) {
        resolvedPath = fallbackPath;
      }
    }

    if (fs.existsSync(resolvedPath)) {
      try {
        privateKey = fs.readFileSync(resolvedPath, "utf8");
      } catch (e) {
        logger.error(`[IAP] Failed to read Apple .p8 file at ${resolvedPath}: ${e}`);
      }
    }
  }

  if (!privateKey) {
    return null;
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
      {
        iss: issuerId,
        iat: now,
        exp: now + 3600, // Token valid for 1 hour
        aud: "appstoreconnect-v1",
        bid: bundleId,
      },
      privateKey,
      {
        algorithm: "ES256",
        header: {
          alg: "ES256",
          kid: keyId,
          typ: "JWT",
        },
      }
    );
  } catch (error) {
    logger.error(`[IAP-APPLE] Failed to sign Apple JWT token: ${error}`);
    return null;
  }
};

export const iapConfig = {
  get googleClient() {
    return getGoogleAndroidPublisher();
  },
  apple: {
    sharedSecret: envVars.IAP.APPLE_SHARED_SECRET,
    issuerId: envVars.IAP.APPLE_ISSUER_ID,
    keyId: envVars.IAP.APPLE_KEY_ID,
    bundleId: envVars.IAP.APPLE_BUNDLE_ID || "com.poolpay.app",
    teamId: envVars.IAP.APPLE_TEAM_ID,
    keyPath: envVars.IAP.APPLE_PRIVATE_KEY_PATH,
    productionUrl: "https://buy.itunes.apple.com/verifyReceipt",
    sandboxUrl: "https://sandbox.itunes.apple.com/verifyReceipt",
    serverApiUrl: "https://api.storekit.itunes.apple.com",
    serverApiSandboxUrl: "https://api.storekit-sandbox.itunes.apple.com",
    getSignedToken: getAppleServerToken,
  },
  products: {
    google: {
      packageName: envVars.IAP.GOOGLE_PLAY_PACKAGE_NAME || "com.poolpay.rosca",
      regularId: envVars.IAP.GOOGLE_PLAY_REGULAR_PRODUCT_ID || "regular_yearly_subscription",
      vipId: envVars.IAP.GOOGLE_PLAY_VIP_PRODUCT_ID || "vip_yearly_subscription",
    },
    apple: {
      regularId: envVars.IAP.APPLE_REGULAR_PRODUCT_ID || "regular_yearly_subscription",
      vipId: envVars.IAP.APPLE_VIP_PRODUCT_ID || "vip_yearly_subscription",
    },
  },
};
