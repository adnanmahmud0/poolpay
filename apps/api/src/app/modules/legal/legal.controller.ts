import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { LegalService } from "./legal.service";
import { JwtPayload } from "jsonwebtoken";

const getAllPolicies = catchAsync(async (req: Request, res: Response) => {
  const isAdmin = Boolean(req.user);
  const result = await LegalService.getAllPolicies(isAdmin);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Legal policies retrieved successfully",
    data: result,
  });
});

const getPolicyBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const isAdmin = Boolean(req.user);
  const result = await LegalService.getPolicyBySlug(slug, isAdmin);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Legal policy retrieved successfully",
    data: result,
  });
});

const updatePolicy = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const userId = (req.user as JwtPayload)?.userId;
  const result = await LegalService.updatePolicy(slug, req.body, userId);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Legal policy updated successfully",
    data: result,
  });
});

export const LegalController = {
  getAllPolicies,
  getPolicyBySlug,
  updatePolicy,
};
