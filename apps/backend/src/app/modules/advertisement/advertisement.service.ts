import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Advertisement } from "./advertisement.model";
import { IAdvertisement } from "./advertisement.interface";

const createAdvertisement = async (
  userId: string,
  payload: Partial<IAdvertisement>
) => {
  // Check for duplicate priority if priority is provided and active
  if (payload.priority !== undefined && payload.isActive !== false) {
    const existing = await Advertisement.findOne({
      priority: payload.priority,
      isActive: true,
    });
    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        `An active advertisement with priority ${payload.priority} already exists`
      );
    }
  }

  if (payload.actionType === "link" && payload.actionValue) {
    payload.redirectUrl = payload.actionValue;
  } else if (!payload.actionValue && payload.redirectUrl) {
    payload.actionType = "link";
    payload.actionValue = payload.redirectUrl;
  }

  const result = await Advertisement.create({ ...payload, createdBy: userId });
  return result;
};

const getAllAdvertisements = async () => {
  return await Advertisement.find()
    .sort({ priority: -1, createdAt: -1 })
    .populate("createdBy", "firstName lastName email");
};

const getActiveAdvertisements = async () => {
  const now = new Date();

  return await Advertisement.find({
    isActive: true,
    $and: [
      {
        $or: [
          { startDate: { $lte: now } },
          { startDate: { $exists: false } },
          { startDate: null },
        ],
      },
      {
        $or: [
          { endDate: { $gte: now } },
          { endDate: { $exists: false } },
          { endDate: null },
        ],
      },
    ],
  })
    .sort({ priority: -1 })
    .select("-createdBy -createdAt -updatedAt");
};

const updateAdvertisement = async (
  id: string,
  payload: Partial<IAdvertisement>
) => {
  const ad = await Advertisement.findById(id);
  if (!ad) {
    throw new AppError(httpStatus.NOT_FOUND, "Advertisement not found");
  }

  // Check for duplicate priority
  if (payload.priority !== undefined || payload.isActive !== undefined) {
    const newPriority =
      payload.priority !== undefined ? payload.priority : ad.priority;
    const newIsActive =
      payload.isActive !== undefined ? payload.isActive : ad.isActive;

    if (newIsActive && newPriority !== undefined) {
      const existing = await Advertisement.findOne({
        _id: { $ne: id },
        priority: newPriority,
        isActive: true,
      });
      if (existing) {
        throw new AppError(
          httpStatus.CONFLICT,
          `An active advertisement with priority ${newPriority} already exists`
        );
      }
    }
  }

  if (payload.actionType === "link" && payload.actionValue) {
    payload.redirectUrl = payload.actionValue;
  } else if (!payload.actionValue && payload.redirectUrl) {
    payload.actionType = "link";
    payload.actionValue = payload.redirectUrl;
  }

  const result = await Advertisement.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  return result;
};

const deleteAdvertisement = async (id: string) => {
  const ad = await Advertisement.findByIdAndDelete(id);
  if (!ad) {
    throw new AppError(httpStatus.NOT_FOUND, "Advertisement not found");
  }
  return ad;
};

export const AdvertisementServices = {
  createAdvertisement,
  getAllAdvertisements,
  getActiveAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
};
