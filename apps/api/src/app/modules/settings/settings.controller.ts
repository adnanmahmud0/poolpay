import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { SettingsServices } from "./settings.service";
import { JwtPayload } from "jsonwebtoken";
import { getActiveStripePublishableKey } from "../../utils/envConfig";

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

const toggleEnvironment = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const { environment } = req.body as { environment: 'test' | 'production' };

  if (!['test', 'production'].includes(environment)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "environment must be 'test' or 'production'",
    });
  }

  const result = await SettingsServices.toggleEnvironment(environment, userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Environment switched to ${environment} mode`,
    data: result,
  });
});

/** Public endpoint — no auth required. Returns current environment + matching Stripe publishable key. */
const getAppConfig = catchAsync(async (_req: Request, res: Response) => {
  const config = await SettingsServices.getAppConfig();
  const stripePublishableKey = await getActiveStripePublishableKey();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "App config retrieved successfully",
    data: { ...config, stripePublishableKey },
  });
});

export const SettingsControllers = {
  getSettings,
  updateSettings,
  updateSupportEmail,
  getAuthSettings,
  getContactSettings,
  toggleEnvironment,
  getAppConfig,
};
