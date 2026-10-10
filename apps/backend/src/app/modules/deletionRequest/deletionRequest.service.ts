import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { UserServices } from "../user/user.service";
import {
  Notification,
  NotificationType,
} from "../notification/notification.model";
import { DeletionRequest } from "./deletionRequest.model";
import { DeletionRequestStatus } from "./deletionRequest.interface";

const createDeletionRequest = async (
  userId: string,
  payload: { password: string; reason?: string }
) => {
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Verify password if user has a password set
  if (user.password) {
    const isPasswordValid = await user.comparePassword(payload.password);
    if (!isPasswordValid) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Incorrect password. Please enter your valid password to confirm deletion request."
      );
    }
  }

  // Check if a pending deletion request already exists
  const existingPending = await DeletionRequest.findOne({
    userId: user._id,
    status: DeletionRequestStatus.PENDING,
  });

  if (existingPending) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "An account deletion request has already been submitted and is currently pending administrator review."
    );
  }

  const newRequest = await DeletionRequest.create({
    userId: user._id,
    userEmail: user.email,
    userName: user.fullName || `${user.firstName} ${user.lastName}`.trim(),
    userPhone: user.phone,
    reason: payload.reason?.trim() || "Account deletion requested by user.",
    status: DeletionRequestStatus.PENDING,
  });

  // Notify user that the request was successfully received
  try {
    await Notification.create({
      userId: user._id,
      title: "Account Deletion Request Received",
      message:
        "Your request to delete your account has been received and queued for administrative review. Our compliance team will review your account obligations.",
      type: NotificationType.GENERAL || NotificationType.PAYMENT_FAILED,
    });
  } catch (error) {
    console.warn(
      "Could not create user notification for deletion request:",
      error
    );
  }

  return newRequest;
};

const getAllDeletionRequests = async (query: Record<string, string>) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};

  if (query.status && query.status !== "all") {
    filter.status = query.status.toLowerCase();
  }

  if (query.search) {
    filter.$or = [
      { userName: { $regex: query.search, $options: "i" } },
      { userEmail: { $regex: query.search, $options: "i" } },
    ];
  }

  const [data, total, totalPending, totalApproved, totalRejected] =
    await Promise.all([
      DeletionRequest.find(filter)
        .populate("userId", "firstName lastName email profileImage status")
        .populate("reviewedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DeletionRequest.countDocuments(filter),
      DeletionRequest.countDocuments({ status: DeletionRequestStatus.PENDING }),
      DeletionRequest.countDocuments({
        status: DeletionRequestStatus.APPROVED,
      }),
      DeletionRequest.countDocuments({
        status: DeletionRequestStatus.REJECTED,
      }),
    ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
      totalPending,
      totalApproved,
      totalRejected,
    },
  };
};

const confirmDeletionRequest = async (
  requestId: string,
  adminUser: JwtPayload
) => {
  const request = await DeletionRequest.findById(requestId);
  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, "Deletion request not found");
  }

  if (request.status !== DeletionRequestStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot confirm a deletion request that is already ${request.status}.`
    );
  }

  // Delete the user permanently
  try {
    await UserServices.deleteUser(request.userId.toString(), adminUser);
  } catch (error: any) {
    // If user already deleted or not found, proceed to mark request approved
    console.warn(
      "User deletion during request confirmation note:",
      error?.message
    );
  }

  request.status = DeletionRequestStatus.APPROVED;
  request.reviewedBy = new Types.ObjectId(adminUser.userId);
  request.reviewedAt = new Date();
  await request.save();

  return request;
};

const rejectDeletionRequest = async (
  requestId: string,
  adminUser: JwtPayload,
  adminNote?: string
) => {
  const request = await DeletionRequest.findById(requestId);
  if (!request) {
    throw new AppError(httpStatus.NOT_FOUND, "Deletion request not found");
  }

  if (request.status !== DeletionRequestStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Cannot reject a deletion request that is already ${request.status}.`
    );
  }

  request.status = DeletionRequestStatus.REJECTED;
  request.reviewedBy = new Types.ObjectId(adminUser.userId);
  request.reviewedAt = new Date();
  if (adminNote) {
    request.adminNote = adminNote;
  }
  await request.save();

  // Send notification to user that their deletion request was rejected
  try {
    await Notification.create({
      userId: request.userId,
      title: "Account Deletion Request Update",
      message: adminNote
        ? `Your account deletion request was rejected: ${adminNote}`
        : "Your account deletion request was reviewed and rejected by our administration team.",
      type: NotificationType.GENERAL || NotificationType.PAYMENT_FAILED,
    });
  } catch (error) {
    console.warn(
      "Could not create user notification for deletion rejection:",
      error
    );
  }

  return request;
};

export const DeletionRequestServices = {
  createDeletionRequest,
  getAllDeletionRequests,
  confirmDeletionRequest,
  rejectDeletionRequest,
};
