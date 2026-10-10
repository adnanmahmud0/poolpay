import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserServices } from "./user.service";
import AppError from "../../errorHelpers/AppError";
import { User } from "./user.model";
import { storage } from "../../utils/storage/storageFactory";
import fs from "fs";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.createUser(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User Created Successfully",
    data: user,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  const verifiedToken = req.user;
  const payload = req.body;

  const user = await UserServices.updateUser(
    userId,
    payload,
    verifiedToken as JwtPayload
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Updated Successfully",
    data: user,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await UserServices.getAllUsers(
    query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "All Users Retrieved Successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await UserServices.getMe(decodedToken.userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Your Profile Retrieved Successfully",
    data: result.data,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserServices.getSingleUser(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Retrieved Successfully",
    data: result,
  });
});

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const userId = decodedToken.userId;

  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, "No image file provided");
  }

  // 1. Get current user to check for old image
  const currentUser = await User.findById(userId);
  if (currentUser?.profileImage) {
    // Delete old image from storage provider, but continue even if it fails
    try {
      await storage.deleteFile(currentUser.profileImage);
    } catch (error) {
      console.warn("Failed to delete old profile image:", error);
    }
  }

  try {
    // 2. Upload new image using the selected provider
    const profileImage = await storage.uploadFile(req.file, "profiles");

    // 3. Update user in DB
    const user = await UserServices.updateUser(
      userId,
      { profileImage },
      decodedToken
    );

    // 4. Delete local temp file
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile image uploaded successfully",
      data: user,
    });
  } catch (error) {
    // Cleanup local file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
});

const suspendUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserServices.suspendUser(id, req.user as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Suspended Successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await UserServices.deleteUser(id, req.user as JwtPayload);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Deleted Successfully",
    data: result,
  });
});

const getMyFinancialStats = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await UserServices.getMyFinancialStats(
    decodedToken.userId,
    decodedToken.role
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Financial statistics retrieved successfully",
    data: result,
  });
});

export const UserControllers = {
  createUser,
  updateUser,
  getAllUsers,
  getMe,
  getSingleUser,
  uploadProfileImage,
  suspendUser,
  deleteUser,
  getMyFinancialStats,
};
