import { Request } from "express";
import { ActivityLog } from "../modules/activityLog/activityLog.model";
import { ClientSession, Types } from "mongoose";
import logger from "./logger";

export const logActivity = async (
  userId: string | Types.ObjectId,
  action: string,
  details: string,
  session?: ClientSession,
  req?: Request
) => {
  try {
    const logData = {
      userId: new Types.ObjectId(userId),
      action,
      details,
      ipAddress: req?.ip || req?.headers["x-forwarded-for"]?.toString(),
      device: req?.headers["user-agent"],
    };

    await ActivityLog.create([logData], { session });
    logger.info(`[ACTIVITY_LOG] ${action}: ${details} for user ${userId}`);
  } catch (error) {
    logger.error("[ACTIVITY_LOG_ERROR] Failed to save activity log:", error);
  }
};
