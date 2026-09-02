import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentMethodServices } from "./paymentMethod.service";
import { JwtPayload } from "jsonwebtoken";

const addPaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await PaymentMethodServices.addPaymentMethod(
    user.userId || user._id,
    req.body
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Payment method added successfully",
    data: result,
  });
});

const createSetupIntent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await PaymentMethodServices.createSetupIntent(user.userId || user._id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Setup intent created successfully",
    data: result,
  });
});

const createEphemeralKey = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await PaymentMethodServices.createEphemeralKey(user.userId || user._id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ephemeral key created successfully",
    data: result,
  });
});

const getPaymentMethods = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await PaymentMethodServices.getPaymentMethods(user.userId || user._id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment methods retrieved successfully",
    data: result,
  });
});

const setDefaultPaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { id } = req.params;
  
  const result = await PaymentMethodServices.setDefaultPaymentMethod(
    user.userId || user._id,
    id as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Default payment method updated successfully",
    data: result,
  });
});

const toggleAutoPay = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { id } = req.params;
  const { autoPayEnabled } = req.body;
  
  const result = await PaymentMethodServices.toggleAutoPay(
    user.userId || user._id,
    id as string,
    autoPayEnabled
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Auto-pay ${autoPayEnabled ? "enabled" : "disabled"} successfully`,
    data: result,
  });
});

const deletePaymentMethod = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { id } = req.params;
  
  const result = await PaymentMethodServices.deletePaymentMethod(
    user.userId || user._id,
    id as string
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment method deleted successfully",
    data: result,
  });
});

export const PaymentMethodControllers = {
  addPaymentMethod,
  createSetupIntent,
  createEphemeralKey,
  getPaymentMethods,
  setDefaultPaymentMethod,
  toggleAutoPay,
  deletePaymentMethod,
};
