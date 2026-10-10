import mongoose from "mongoose";
import { AuditLog, IAuditLog } from "./auditLog.model";
import logger from "../../utils/logger";

/**
 * Safely creates an immutable audit log without throwing exceptions.
 * Wraps the MongoDB insertion in an isolated try/catch block to prevent
 * logging failures (e.g. database spikes) from breaking critical
 * financial loops in background workers.
 *
 * @param data The audit log payload
 * @param session Optional Mongoose transaction session
 */
export const safeAuditLog = async (
  data: IAuditLog | IAuditLog[],
  session?: mongoose.ClientSession
) => {
  try {
    const payloads = Array.isArray(data) ? data : [data];
    await AuditLog.create(payloads, { session });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(
      `[CRITICAL] AuditLog creation failed. Error suppressed to protect worker isolation: ${errMessage}`,
      { payloads: data }
    );
  }
};
