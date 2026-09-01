import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";
import { MembershipServices } from "./membership.service";

const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { targetTier, successUrl, cancelUrl } = req.body;
  const result = await MembershipServices.createSubscription(user.userId, targetTier, successUrl, cancelUrl);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.isUpdate ? "Subscription update initiated successfully" : "Subscription session created successfully",
    data: result,
  });
});


const cancelSubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await MembershipServices.cancelSubscription(user.userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Subscription cancellation processed successfully",
    data: result,
  });
});

const toggleAutoRenew = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await MembershipServices.toggleAutoRenew(user.userId, req.body.autoRenew);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Auto-renew setting updated successfully",
    data: result,
  });
});

const getMembershipStatus = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await MembershipServices.getMembershipStatus(user.userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Membership status retrieved successfully",
    data: result,
  });
});

export const MembershipControllers = {
  createSubscription,
  cancelSubscription,
  toggleAutoRenew,
  getMembershipStatus,
};
