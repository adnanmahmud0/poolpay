import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes";
import { AdvertisementServices } from "./advertisement.service";
import { storage } from "../../utils/storage/storageFactory";
import AppError from "../../errorHelpers/AppError";
import { Advertisement } from "./advertisement.model";

import { JwtPayload } from "jsonwebtoken";

const createAdvertisement = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, "Banner image is required");
  }

  // Upload to storage
  const bannerImage = await storage.uploadFile(req.file, "advertisements");
  req.body.bannerImage = bannerImage;

  const result = await AdvertisementServices.createAdvertisement(user.userId || user._id, req.body);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Advertisement created successfully",
    data: result,
  });
});

const getAllAdvertisements = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdvertisementServices.getAllAdvertisements();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Advertisements retrieved successfully",
    data: result,
  });
});

const getActiveAdvertisements = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdvertisementServices.getActiveAdvertisements();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Active advertisements retrieved successfully",
    data: result,
  });
});

const updateAdvertisement = catchAsync(async (req: Request, res: Response) => {
  if (req.file) {
    const currentAd = await Advertisement.findById(req.params.id);
    if (currentAd?.bannerImage) {
      try {
        await storage.deleteFile(currentAd.bannerImage);
      } catch (error) {
        console.warn("Failed to delete old advertisement image:", error);
      }
    }

    const bannerImage = await storage.uploadFile(req.file, "advertisements");
    req.body.bannerImage = bannerImage;
  }

  const result = await AdvertisementServices.updateAdvertisement(req.params.id as string, req.body);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Advertisement updated successfully",
    data: result,
  });
});

const deleteAdvertisement = catchAsync(async (req: Request, res: Response) => {
  const currentAd = await Advertisement.findById(req.params.id);
  if (currentAd?.bannerImage) {
    try {
      await storage.deleteFile(currentAd.bannerImage);
    } catch (error) {
      console.warn("Failed to delete advertisement image during deletion:", error);
    }
  }

  await AdvertisementServices.deleteAdvertisement(req.params.id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Advertisement deleted successfully",
    data: null,
  });
});

export const AdvertisementControllers = {
  createAdvertisement,
  getAllAdvertisements,
  getActiveAdvertisements,
  updateAdvertisement,
  deleteAdvertisement,
};
