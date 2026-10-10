import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { GroupMemberServices } from "./groupMember.service";
import { JwtPayload } from "jsonwebtoken";

const joinGroup = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { inviteCode } = req.body;
  const result = await GroupMemberServices.joinGroup(
    user.userId || user._id,
    inviteCode
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Joined group successfully",
    data: result,
  });
});

const getGroupMembers = catchAsync(async (req: Request, res: Response) => {
  const { groupId } = req.params;
  const result = await GroupMemberServices.getGroupMembers(groupId as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Group members retrieved successfully",
    data: result,
  });
});

const markNotice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { noticeStatus } = req.body;
  const result = await GroupMemberServices.markNotice(
    id as string,
    noticeStatus
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Notice status updated successfully",
    data: result,
  });
});

const removeMember = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { removalNote } = req.body;
  const admin = req.user as JwtPayload;
  const result = await GroupMemberServices.removeMember(
    id as string,
    removalNote,
    admin.userId || admin._id
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Member removed from group successfully",
    data: result,
  });
});

const getMyGroups = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayload;
  const { data, meta, summary } = await GroupMemberServices.getMyGroups(
    user.userId || user._id,
    req.query
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "My groups retrieved successfully",
    meta,
    summary,
    data,
  });
});

export const GroupMemberControllers = {
  joinGroup,
  getGroupMembers,
  markNotice,
  removeMember,
  getMyGroups,
};
