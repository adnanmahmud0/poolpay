import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TransactionServices } from "./transaction.service";
import { JwtPayload } from "jsonwebtoken";

const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await TransactionServices.getAllTransactions(
    req.query as Record<string, string>
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Transactions retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const flagTransaction = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TransactionServices.flagTransaction(
    id as string,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Transaction flagged successfully",
    data: result,
  });
});

const freezeTransaction = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TransactionServices.freezeTransaction(id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Transaction frozen successfully",
    data: result,
  });
});

const getMyTransactions = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const result = await TransactionServices.getMyTransactions(
    user.userId || user._id,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your transactions retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const TransactionControllers = {
  getAllTransactions,
  flagTransaction,
  freezeTransaction,
  getMyTransactions,
};
