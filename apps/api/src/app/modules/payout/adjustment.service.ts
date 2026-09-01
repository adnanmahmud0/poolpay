import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Adjustment } from "./adjustment.model";
import { redistributionQueue } from "../../queues/payment.queue";

const getAllAdjustments = async (query: Record<string, unknown>) => {
  const { status, groupId, userId } = query;
  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (groupId) filter.groupId = groupId;
  if (userId) filter.userId = userId;

  return await Adjustment.find(filter)
    .populate("userId", "firstName lastName email")
    .populate("groupId", "name")
    .sort({ createdAt: -1 });
};

const retryAdjustment = async (adjustmentId: string) => {
  const adjustment = await Adjustment.findById(adjustmentId);
  if (!adjustment) {
    throw new AppError(httpStatus.NOT_FOUND, "Adjustment not found");
  }

  if (adjustment.status === "completed") {
    throw new AppError(httpStatus.BAD_REQUEST, "Adjustment is already completed");
  }

  // Reset status to pending
  adjustment.status = "pending";
  await adjustment.save();

  // Re-enqueue job
  await redistributionQueue.add("processBonus", {
    adjustmentId: adjustment._id,
  }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  });

  return adjustment;
};

export const AdjustmentServices = {
  getAllAdjustments,
  retryAdjustment,
};
