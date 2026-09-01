
import Redis from "ioredis";
import dotenv from "dotenv";

// Load env variables
dotenv.config();

const redisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};

const redis = new Redis(redisOptions);

async function fixRedis() {
  console.log("Connecting to Redis at", redisOptions.host, "...");
  try {
    // Attempt to set the eviction policy to noeviction
    const response = await redis.config("SET", "maxmemory-policy", "noeviction");
    console.log("✅ Config Set Response:", response);
    
    // Verify the change
    const currentPolicy = await redis.config("GET", "maxmemory-policy");
    console.log("✅ Current maxmemory-policy is now:", currentPolicy);
  } catch (err: unknown) {
    console.error("❌ Could not set policy via script:", (err as Error).message);
    console.log("\nNext Steps:");
    console.log("1. If you use a cloud Redis (like Upstash, Redis Labs, Render, or Railway), please go to their web dashboard.");
    console.log("2. Look for 'Eviction Policy' and change it to 'noeviction'.");
    console.log("3. This is a recommended safety setting for BullMQ to prevent background jobs from being deleted.");
  } finally {
    redis.disconnect();
    process.exit();
  }
}

fixRedis();
