import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PaymentServices } from "./payment.service";
import { JwtPayload } from "jsonwebtoken";

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await PaymentServices.getMyPayments(
    user.userId || user._id,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your payment history retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const PaymentControllers = {
  getMyPayments,
};
