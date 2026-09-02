import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SettingsServices } from "./settings.service";
import { JwtPayload } from "jsonwebtoken";

const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await SettingsServices.getSettings();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "System settings retrieved successfully",
    data: result,
  });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const result = await SettingsServices.updateSettings(req.body, userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "System settings updated successfully",
    data: result,
  });
});

const updateSupportEmail = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const result = await SettingsServices.updateSupportEmail(req.body.email, userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Support email updated successfully",
    data: result,
  });
});

const getAuthSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await SettingsServices.getAuthSettings();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Settings retrieved successfully",
    data: result,
  });
});

const getContactSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await SettingsServices.getContactSettings();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Contact settings retrieved successfully",
    data: result,
  });
});

export const SettingsControllers = {
  getSettings,
  updateSettings,
  updateSupportEmail,
  getAuthSettings,
  getContactSettings,
};
