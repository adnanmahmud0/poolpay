import { initializeApp, cert } from "firebase-admin/app";
import { envVars } from "./env";

export const initializeFirebase = () => {
  try {
    if (!envVars.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      console.warn("⚠️ Firebase service account not provided. Push notifications will be disabled.");
      return;
    }

    const base64String = envVars.FIREBASE_SERVICE_ACCOUNT_BASE64;
    const decodedString = Buffer.from(base64String, "base64").toString("utf-8");
    const serviceAccount = JSON.parse(decodedString);

    initializeApp({
      credential: cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
  }
};
