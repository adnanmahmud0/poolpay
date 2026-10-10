import { createClient } from "redis";
import { envVars } from "./env";

export const redisClient = createClient({
  username: envVars.REDIS_USERNAME,
  password: envVars.REDIS_PASSWORD,
  socket: {
    host: envVars.REDIS_HOST,
    port: Number(envVars.REDIS_PORT),
    ...(envVars.REDIS_HOST.includes("upstash.io") ? { tls: true } : {}),
  },
});

redisClient.on("error", (err) => console.log("Redis Client Error!", err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    // BullMQ requires noeviction policy, but the server does not support config setting
    console.log("redis connected!");
  }
};
