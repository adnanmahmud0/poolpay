import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ChatServices } from "./chat.service";

import { JwtPayload } from "jsonwebtoken";

import { storage } from "../../utils/storage/storageFactory";
import fs from "fs";

const getGroupMessages = catchAsync(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const result = await ChatServices.getGroupMessages(
    groupId as string,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Chat messages retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { groupId } = req.params;
  const files = req.files as Record<string, Express.Multer.File[]>;

  const attachments: { url: string; type: "image" | "video" }[] = [];

  try {
    // Handle images
    if (files?.images) {
      const imageUploadPromises = files.images.map((file) =>
        storage.uploadFile(file, "chat/images")
      );
      const imageUrls = await Promise.all(imageUploadPromises);
      imageUrls.forEach((url) => attachments.push({ url, type: "image" }));
    }

    // Handle videos
    if (files?.videos) {
      const videoUploadPromises = files.videos.map((file) =>
        storage.uploadFile(file, "chat/videos")
      );
      const videoUrls = await Promise.all(videoUploadPromises);
      videoUrls.forEach((url) => attachments.push({ url, type: "video" }));
    }

    const result = await ChatServices.sendMessage(
      user.userId || user._id,
      groupId as string,
      {
        ...req.body,
        attachments,
      }
    );

    // Cleanup temp files
    const allFiles = [...(files?.images || []), ...(files?.videos || [])];
    allFiles.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Message sent successfully",
      data: result,
    });
  } catch (error) {
    // Cleanup temp files on error
    const allFiles = [...(files?.images || []), ...(files?.videos || [])];
    allFiles.forEach((file) => {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    });
    throw error;
  }
});

export const ChatControllers = {
  getGroupMessages,
  sendMessage,
};
