import mongoose from "mongoose";
import dns from "node:dns/promises";
import fs from "node:fs";
import path from "node:path";
import { envVars } from "./env";
import logger from "../utils/logger";

const RUNTIME_ENV_PATH = path.resolve(__dirname, "runtime-env.json");

export type AppEnvironment = "test" | "production";

let activeDbName = "poolPay-db-test";

/** Read the persisted active environment from runtime-env.json */
export const getCurrentAppEnvironment = (): AppEnvironment => {
  try {
    if (fs.existsSync(RUNTIME_ENV_PATH)) {
      const content = fs.readFileSync(RUNTIME_ENV_PATH, "utf-8");
      const parsed = JSON.parse(content);
      if (
        parsed.appEnvironment === "production" ||
        parsed.appEnvironment === "test"
      ) {
        return parsed.appEnvironment;
      }
    }
  } catch (err) {
    logger.warn("Could not read runtime-env.json, defaulting to 'test':", err);
  }
  return "test";
};

/** Persist the active environment to runtime-env.json */
export const setCurrentAppEnvironment = (env: AppEnvironment): void => {
  try {
    fs.writeFileSync(
      RUNTIME_ENV_PATH,
      JSON.stringify({ appEnvironment: env }, null, 2),
      "utf-8"
    );
  } catch (err) {
    logger.error("Failed to write runtime-env.json:", err);
  }
};

/** Returns the connection string and database name for the specified environment */
export const getDatabaseConfig = (
  env: AppEnvironment
): { url: string; dbName: string } => {
  if (env === "production") {
    const url =
      envVars.LIVE_DATABASE_URL ||
      "mongodb://admin:password123@localhost:27017/poolPay-db-live?authSource=admin";
    return { url, dbName: "poolPay-db-live" };
  }

  const url =
    envVars.TEST_DATABASE_URL ||
    envVars.DATABASE_URL ||
    "mongodb://admin:password123@localhost:27017/poolPay-db-test?authSource=admin";
  return { url, dbName: "poolPay-db-test" };
};

/** Current active database name (for backup scripts & logging) */
export const getCurrentDbName = (): string => activeDbName;

/** Legacy alias for backwards compatibility */
export let DB_NAME = "poolPay-db-test";

export const dbConnect = async (targetEnv?: AppEnvironment) => {
  const env = targetEnv || getCurrentAppEnvironment();
  const { url, dbName } = getDatabaseConfig(env);

  activeDbName = dbName;
  DB_NAME = dbName;

  try {
    // Set DNS servers to Google's DNS to resolve MongoDB Atlas SRV records correctly if needed
    if (url.startsWith("mongodb+srv://")) {
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
    }

    await mongoose.connect(url, {
      dbName,
    });

    logger.info(
      `✅ Connected to MongoDB database [${dbName}] in [${env.toUpperCase()}] mode!`
    );
  } catch (error) {
    logger.error(
      `❌ Failed to connect to MongoDB [${dbName}]. The server will continue running and attempt to reconnect.`,
      error
    );
  }
};

/**
 * Dynamically switches the MongoDB connection between test and production databases.
 * Disconnects existing connection, persists the new environment, and reconnects.
 */
export const switchDatabaseConnection = async (newEnv: AppEnvironment) => {
  try {
    if (mongoose.connection.readyState >= 1) {
      await mongoose.disconnect();
      logger.info("🔌 Disconnected from previous database.");
    }

    setCurrentAppEnvironment(newEnv);
    await dbConnect(newEnv);

    logger.info(
      `🔄 Successfully switched active database to [${activeDbName}] (${newEnv} mode).`
    );
    return { env: newEnv, dbName: activeDbName };
  } catch (error) {
    logger.error(`❌ Failed to switch database to [${newEnv}]:`, error);
    throw error;
  }
};
