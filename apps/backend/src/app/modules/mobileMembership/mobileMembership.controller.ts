import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import { MobileMembershipServices } from "./mobileMembership.service";
import { User } from "../user/user.model";
import AppError from "../../errorHelpers/AppError";

const verifyGooglePurchase = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { token, productId } = req.body;

  const result = await MobileMembershipServices.verifyGooglePurchase(
    user.userId,
    productId,
    token
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.user,
  });
});

const verifyApplePurchase = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { receiptData, transactionId, productId } = req.body;

  const result = await MobileMembershipServices.verifyApplePurchase(
    user.userId,
    receiptData,
    transactionId,
    productId
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.user,
  });
});

const syncSubscriptionStatus = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const result = await MobileMembershipServices.syncMobileSubscriptionStatus(
      user.userId
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: result.message,
      data: result.user,
    });
  }
);

const getMembershipStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;

  const result = await User.findById(user.userId).select(
    "membershipTier subscriptionStatus subscriptionExpiry membershipProvider autoRenewEnabled platformSubscriptionId"
  );

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Mobile membership status retrieved successfully",
    data: result,
  });
});

export const MobileMembershipControllers = {
  verifyGooglePurchase,
  verifyApplePurchase,
  syncSubscriptionStatus,
  getMembershipStatus,
};
