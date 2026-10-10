import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DeletionRequestServices } from "./deletionRequest.service";

const createDeletionRequest = catchAsync(
  async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;
    const result = await DeletionRequestServices.createDeletionRequest(
      decodedToken.userId,
      req.body
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message:
        "Account deletion request submitted successfully. It will be reviewed by an administrator.",
      data: result,
    });
  }
);

const getAllDeletionRequests = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query;
    const result = await DeletionRequestServices.getAllDeletionRequests(
      query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Deletion requests retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const confirmDeletionRequest = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const adminUser = req.user as JwtPayload;
    const result = await DeletionRequestServices.confirmDeletionRequest(
      id,
      adminUser
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message:
        "User account deleted and deletion request approved successfully.",
      data: result,
    });
  }
);

const rejectDeletionRequest = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const adminUser = req.user as JwtPayload;
    const { adminNote } = req.body;
    const result = await DeletionRequestServices.rejectDeletionRequest(
      id,
      adminUser,
      adminNote
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Deletion request rejected successfully.",
      data: result,
    });
  }
);

export const DeletionRequestControllers = {
  createDeletionRequest,
  getAllDeletionRequests,
  confirmDeletionRequest,
  rejectDeletionRequest,
};
