import logger from "../utils/logger";
import { envVars } from "../config/env";

/**
 * Self-Ping Scheduler
 * Periodically sends GET requests to the server's own public endpoints
 * to prevent the hosting platform (e.g. Render free tier) from sleeping.
 */
export const initSelfPing = () => {
  if (!envVars.SELF_PING_ENABLED) {
    logger.info("ℹ️ Self-ping scheduler is disabled.");
    return;
  }

  const baseUrl = envVars.BACKEND_URL.replace(/\/$/, "");
  const endpoints = ["/health", "/privacy-policy", "/terms-and-conditions"];
  let currentIndex = 0;

  const ping = async () => {
    const endpoint = endpoints[currentIndex];
    // Alternate endpoints on each ping to warm up multiple routes
    currentIndex = (currentIndex + 1) % endpoints.length;

    const url = `${baseUrl}${endpoint}`;

    try {
      logger.info(`pinging self at: ${url}`);
      const response = await fetch(url);
      if (response.ok) {
        logger.info(
          `✅ Self-ping to ${url} succeeded (Status: ${response.status})`
        );
      } else {
        logger.warn(
          `⚠️ Self-ping to ${url} failed (Status: ${response.status})`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`❌ Self-ping error for ${url}: ${errorMessage}`);
    }
  };

  const intervalMs = envVars.SELF_PING_INTERVAL * 60 * 1000;
  logger.info(
    `⏰ Initialized Self-Ping Scheduler. Target: ${baseUrl}, Interval: ${envVars.SELF_PING_INTERVAL} minutes (${intervalMs}ms)`
  );

  // Run the first ping after a short delay (15 seconds) to let the server bind and start listening
  setTimeout(() => {
    logger.info("🔄 Running initial test self-ping...");
    ping();
  }, 15000);

  // Set periodic pings
  setInterval(ping, intervalMs);
};
