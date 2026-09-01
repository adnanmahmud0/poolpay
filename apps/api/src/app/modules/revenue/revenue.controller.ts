import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { RevenueServices } from "./revenue.service";

const getRevenueStats = catchAsync(async (req: Request, res: Response) => {
  const result = await RevenueServices.getRevenueStats(req.query as Record<string, string>);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Revenue statistics retrieved successfully",
    data: result.data,
    meta: result.meta,
    extra: result.stats
  });
});

const getRevenueMetrics = catchAsync(async (_req: Request, res: Response) => {
  const result = await RevenueServices.getRevenueMetrics();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Revenue metrics retrieved successfully",
    data: result,
  });
});
 
export const RevenueControllers = {
  getRevenueStats,
  getRevenueMetrics,
};
