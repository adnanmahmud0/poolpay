import { Types } from "mongoose";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ChatMessage, MessageType, IChatMessage } from "./chat.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { GroupMember } from "../groupMember/groupMember.model";
import { Group } from "../group/group.model";
import { IUser } from "../user/user.interface";

const getGroupMessages = async (
  groupId: string,
  query: Record<string, string>
) => {
  const messageQuery = ChatMessage.find({
    groupId: new Types.ObjectId(groupId),
  }).populate("senderId", "firstName lastName email profileImage");

  const queryBuilder = new QueryBuilder(messageQuery, query);
  const result = queryBuilder.sort().paginate().fields();

  const data = await result.build();
  const meta = await queryBuilder.getMeta();

  // Reconstruct fullName for frontend compatibility
  const messagesWithFullName = (
    data as unknown as (IChatMessage & { senderId: IUser })[]
  ).map((msg) => {
    if (msg.senderId && typeof msg.senderId === "object") {
      msg.senderId.fullName =
        `${msg.senderId.firstName || ""} ${msg.senderId.lastName || ""}`.trim() ||
        "Member";
    }
    return msg;
  });

  return {
    data: messagesWithFullName,
    meta,
  };
};

const sendMessage = async (
  userId: string,
  groupId: string,
  payload: {
    message?: string;
    messageType?: MessageType;
    attachments?: { url: string; type: "image" | "video" }[];
  }
) => {
  const { message, messageType, attachments } = payload;

  if (!message?.trim() && (!attachments || attachments.length === 0)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Either message or at least one attachment is required"
    );
  }

  // Check if group exists
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, "Group not found");
  }

  // Check if user is a member of the group
  const isMember = await GroupMember.findOne({ groupId, userId });
  if (!isMember) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not a member of this group"
    );
  }

  // Determine message type if not provided
  let finalMessageType = messageType || MessageType.TEXT;
  if (!messageType) {
    if (attachments && attachments.length > 0) {
      if (attachments.length === 1) {
        finalMessageType =
          attachments[0].type === "image"
            ? MessageType.IMAGE
            : MessageType.VIDEO;
      } else {
        finalMessageType = MessageType.MEDIA;
      }
    }
  }

  const newMessage = await ChatMessage.create({
    groupId,
    senderId: userId,
    message: message?.trim(),
    attachments,
    messageType: finalMessageType,
  });

  return newMessage;
};

export const ChatServices = {
  getGroupMessages,
  sendMessage,
};
