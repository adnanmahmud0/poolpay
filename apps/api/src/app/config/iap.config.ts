import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { envVars } from "./env";
import logger from "../utils/logger";

const getGoogleAndroidPublisher = () => {
  const serviceAccountPath = envVars.IAP.GOOGLE_PLAY_SERVICE_ACCOUNT_PATH;
  const packageName = envVars.IAP.GOOGLE_PLAY_PACKAGE_NAME;

  if (!serviceAccountPath) {
    logger.warn("[IAP] GOOGLE_PLAY_SERVICE_ACCOUNT_PATH environment variable is not defined. Google Play IAP verification will run in MOCK mode.");
    return null;
  }

  // Resolve absolute path
  const resolvedPath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(process.cwd(), serviceAccountPath);

  if (!fs.existsSync(resolvedPath)) {
    logger.warn(`[IAP] Google Service Account key file not found at: ${resolvedPath}. Google Play IAP verification will run in MOCK mode.`);
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: resolvedPath,
      scopes: ["https://www.googleapis.com/auth/androidpublisher"],
    });

    const androidPublisher = google.androidpublisher({
      version: "v3",
      auth,
    });

    logger.info(`[IAP] Google Play androidpublisher client initialized successfully for package: ${packageName}`);
    return androidPublisher;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`[IAP] Failed to initialize Google Play client: ${err?.message || err}. Will fallback to MOCK mode.`);
    return null;
  }
};

export const iapConfig = {
  get googleClient() {
    return getGoogleAndroidPublisher();
  },
  apple: {
    sharedSecret: envVars.IAP.APPLE_SHARED_SECRET,
    productionUrl: "https://buy.itunes.apple.com/verifyReceipt",
    sandboxUrl: "https://sandbox.itunes.apple.com/verifyReceipt",
  },
  products: {
    google: {
      packageName: envVars.IAP.GOOGLE_PLAY_PACKAGE_NAME || "com.poolpay.app",
      regularId: envVars.IAP.GOOGLE_PLAY_REGULAR_PRODUCT_ID,
      vipId: envVars.IAP.GOOGLE_PLAY_VIP_PRODUCT_ID,
    },
    apple: {
      regularId: envVars.IAP.APPLE_REGULAR_PRODUCT_ID,
      vipId: envVars.IAP.APPLE_VIP_PRODUCT_ID,
    },
  },
};
