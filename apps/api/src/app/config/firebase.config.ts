import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { envVars } from "./env";

export const initializeFirebase = () => {
  try {
    if (getApps().length > 0) {
      return getApp();
    }

    if (!envVars.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      console.warn("⚠️ Firebase service account not provided. Firebase Auth & Push notifications will be disabled.");
      return null;
    }

    const base64String = envVars.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const decodedString = Buffer.from(base64String, "base64").toString("utf-8");
    const serviceAccount = JSON.parse(decodedString);

    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id || "poolpay-e80df",
    });

    console.log(`✅ Firebase Admin initialized successfully for project: ${serviceAccount.project_id || "poolpay-e80df"}!`);
    return app;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    return null;
  }
};

export const getFirebaseAuth = () => {
  initializeFirebase();
  return getAuth();
};
