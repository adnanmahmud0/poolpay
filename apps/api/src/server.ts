import { Server } from "http";
import app from "./app";
import { envVars } from "./app/config/env";
import logger from "./app/utils/logger";
import { initializeFirebase } from "./app/config/firebase.config";
import { initializeSocket } from "./app/socket/socket.server";
import { dbConnect } from "./app/config/dbConnect";
import { initNativeScheduler } from "./app/schedulers/native.scheduler";
import { initSelfPing } from "./app/schedulers/selfPing.scheduler";
import { seedSuperAdmin } from "./app/utils/seedSuperAdmin";
import { seedDemoGroups } from "./app/utils/seedDemoGroups";
import os from "os";
import { initBackupCronJob } from "./app/utils/backupDatabase";

let server: Server;
 
// Disable console logs in production
if (envVars.NODE_ENV === "production") {
  console.log = () => undefined;
  console.info = () => undefined;
  console.debug = () => undefined;
  console.warn = () => undefined;
}

const startServer = async () => {
  try {
    await dbConnect();

    // Seed Initial Data
    await seedSuperAdmin();
    const { getCurrentAppEnvironment } = await import("./app/config/dbConnect");
    if (getCurrentAppEnvironment() === "test") {
      await seedDemoGroups();
    } else {
      logger.info("ℹ️ Running in PRODUCTION mode: Skipped demo groups seeding.");
    }

    // Initialize Firebase
    initializeFirebase();

    server = app.listen(Number(envVars.PORT), envVars.IP, () => {
      let networkIp = envVars.IP;
      if (networkIp === "0.0.0.0") {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
          for (const iface of interfaces[name] || []) {
            if (iface.family === "IPv4" && !iface.internal) {
              networkIp = iface.address;
              break;
            }
          }
        }
      }

      logger.info(`🚀 Server is listening on:`);
      logger.info(`   > Local:   http://localhost:${envVars.PORT}`);
      logger.info(`   > Network: http://${networkIp}:${envVars.PORT}`);
      logger.info(
        `🔑 Authentication System: ${envVars.AUTH_SYSTEM.toUpperCase()}`
      );
    });

    // Initialize Socket.io after server starts listening
    initializeSocket(server);

    // Initialize Self-Ping Scheduler to prevent server from sleeping
    initSelfPing();

    // Initialize Database Backup Cron Job
    initBackupCronJob();

    // Initialize Scheduler and Workers unless explicitly disabled in development to save Redis commands
    const shouldDisableWorkers =
      envVars.NODE_ENV === "development" && envVars.DISABLE_REDIS_WORKERS_IN_DEV;

    if (!shouldDisableWorkers) {
      logger.info(
        `🚀 Initializing BullMQ workers and Native Scheduler (${envVars.NODE_ENV} mode)...`
      );

      // Initialize Native Scheduler (Redis-free)
      initNativeScheduler();

      // Clean up any legacy repeatable jobs from Redis once on start
      try {
        const { cleanupRepeatableJobs } = await import(
          "./app/utils/cleanup-repeatable"
        );
        await cleanupRepeatableJobs();
      } catch (redisError) {
        logger.error("⚠️ Background Cleanup Error (non-fatal):", redisError);
      }

      // Dynamically import workers so they start running
      // We ONLY import workers that actually receive jobs from the app logic
      await import("./app/jobs/paymentRetry.job");
      await import("./app/jobs/notification.worker");
      await import("./app/jobs/turnScheduler.worker");
      await import("./app/jobs/redistribution.worker");

      // scheduler.worker and reconciliation.worker are handled by Native Scheduler now,
      // so we DON'T need to start their BullMQ Workers anymore. 
      // This saves ~3,000 Redis commands per day!

      logger.info(
        "✅ Essential Workers loaded. Idle workers (Scheduler/Reconciliation) bypassed to save Redis quota."
      );
    } else {
      logger.info(
        "🧪 Development mode: BullMQ workers and Native Scheduler are DISABLED (DISABLE_REDIS_WORKERS_IN_DEV is true) to save Redis commands."
      );
    }
  } catch (error) {
    console.error("❌ CRITICAL: Server failed to start:");
    console.error(error);
    process.exit(1);
  }
};

startServer();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

process.on("uncaughtException", (error) => {
  logger.error("🔥 Uncaught Exception:", error);
  exitHandler();
});

process.on("unhandledRejection", (reason) => {
  logger.error("⚠️ Unhandled Rejection at:", reason);
  // We don't exit the process for unhandled rejections to keep the server running
});


process.on("SIGTERM", () => {
  logger.info("SIGTERM received");
  if (server) {
    server.close();
  }
});
