import mongoose from "mongoose";
import dns from "node:dns/promises";
import { envVars } from "./env";
import logger from "../utils/logger";

export const DB_NAME = "poolPay-db";

export const dbConnect = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    // Set DNS servers to Google's DNS to resolve MongoDB Atlas SRV records correctly
    if (envVars.DATABASE_URL.startsWith("mongodb+srv://")) {
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
    }

    await mongoose.connect(envVars.DATABASE_URL, {
      dbName: DB_NAME,
    });
    logger.info("✅ Connected to MongoDB successfully!");
  } catch (error) {
    logger.error(
      "❌ Failed to connect to MongoDB. The server will continue running and attempt to reconnect automatically.",
      error
    );
    // process.exit(1);
  }
};
