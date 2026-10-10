import Redis from "ioredis";
import { envVars } from "./env";

// Shared Redis options to be reused across Workers and Queues
export const redisConnectionOptions = {
  host: envVars.REDIS_HOST,
  port: parseInt(envVars.REDIS_PORT || "6379"),
  username: envVars.REDIS_USERNAME,
  password: envVars.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: false,
  lazyConnect: true, // Only connect when a command is sent
  tls: envVars.REDIS_HOST.includes("upstash.io") ? {} : undefined,
  retryStrategy(times: number) {
    if (times > 5) {
      console.warn(
        "🛑 Redis connection retries exceeded. Stopping reconnection attempts."
      );
      return null;
    }
    const delay = Math.min(times * 100, 3000); // Max 3 seconds delay
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
};

export const bullMqRedis = new Redis(redisConnectionOptions);

// Log the options to verify in Render logs
console.log(
  `📡 Redis Connection Initialized (maxRetriesPerRequest: ${bullMqRedis.options.maxRetriesPerRequest})`
);

bullMqRedis.on("connect", () => {
  // console.log("✅ bullMqRedis connected!");
});

bullMqRedis.on("error", (error) => {
  if (
    error.message.includes("ECONNRESET") ||
    error.message.includes("ETIMEDOUT")
  ) {
    return; // Ignore common network noise in console
  }
  console.error("❌ bullMqRedis connection error:", error.message);
});

bullMqRedis.on("close", () => {
  // console.log("❌ bullMqRedis disconnected!");
});
