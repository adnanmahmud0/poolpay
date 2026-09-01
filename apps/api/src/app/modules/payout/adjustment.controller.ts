import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdjustmentServices } from "./adjustment.service";

const getAllAdjustments = catchAsync(async (req: Request, res: Response) => {
  const result = await AdjustmentServices.getAllAdjustments(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Adjustments retrieved successfully",
    data: result,
  });
});

const retryAdjustment = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdjustmentServices.retryAdjustment(id as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Adjustment retry initiated successfully",
    data: result,
  });
});

export const AdjustmentControllers = {
  getAllAdjustments,
  retryAdjustment,
};
