import { bullMqRedis } from "../config/ioredis.config";
import logger from "./logger";

/**
 * Executes a callback with a distributed lock to prevent overlapping executions.
 * 
 * @param lockKey The unique key for the lock
 * @param ttlSeconds Time to live for the lock in seconds (default: 3600 / 1 hour)
 * @param callback The async function to execute
 */
export const withLock = async <T>(
  lockKey: string,
  ttlSeconds = 3600,
  callback: () => Promise<T>
): Promise<T | undefined> => {
  const lockValue = Date.now().toString();
  const fullLockKey = `lock:job:${lockKey}`;

  // Try to acquire lock: NX = only if not exists, EX = expire in seconds
  const acquired = await bullMqRedis.set(fullLockKey, lockValue, "EX", ttlSeconds, "NX");

  if (acquired !== "OK") {
    logger.info(`[LOCK] Skipping job "${lockKey}": already running or locked.`);
    return;
  }

  try {
    return await callback();
  } catch (error) {
    logger.error(`[LOCK] Error in locked job "${lockKey}":`, error);
    throw error;
  } finally {
    // Only delete if the value matches (basic safety)
    // Using Lua script for atomic "check and delete"
    const luaScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await bullMqRedis.eval(luaScript, 1, fullLockKey, lockValue);
  }
};
