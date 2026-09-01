import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { GroupServices } from "./group.service";
import { JwtPayload } from "jsonwebtoken";
import { storage } from "../../utils/storage/storageFactory";
import fs from "fs";

const createGroup = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const payload = req.body;

  if (req.file) {
    try {
      const groupPhoto = await storage.uploadFile(req.file, "groups");
      payload.groupPhoto = groupPhoto;

      // Delete local temp file
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (error) {
      // Cleanup local file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw error;
    }
  }

  const result = await GroupServices.createGroup(user.userId || user._id, payload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Group created successfully",
    data: result,
  });
});

const getGroupDetails = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GroupServices.getGroupDetails(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Group details retrieved successfully",
    data: result,
  });
});

const getGroupByInviteCode = catchAsync(async (req: Request, res: Response) => {
  const { inviteCode } = req.params;
  const result = await GroupServices.getGroupByInviteCode(inviteCode as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Group retrieved successfully by invite code",
    data: result,
  });
});

const deleteGroup = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { id } = req.params;
  const result = await GroupServices.deleteGroup(user.userId || user._id, id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const startGroup = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { id } = req.params;
  const result = await GroupServices.startGroup(user.userId || user._id, id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: result.group,
  });
});

export const GroupControllers = {
  createGroup,
  getGroupDetails,
  getGroupByInviteCode,
  deleteGroup,
  startGroup,
};
