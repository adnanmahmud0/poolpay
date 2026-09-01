import httpStatus from "http-status-codes";
import mongoose, { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { Group } from "../group/group.model";
import { GroupMember } from "./groupMember.model";
import {
  ContributionFrequency,
  GroupStatus,
  IGroup,
} from "../group/group.interface";
import { MemberStatus, IGroupMember } from "./groupMember.interface";
import { User } from "../user/user.model";
import { IUserDocument, Role, IUser } from "../user/user.interface";
import { TurnServices } from "../turn/turn.service";
import {
  Notification,
  NotificationType,
} from "../notification/notification.model";
import logger from "../../utils/logger";
import {
  enqueuePushNotification,
  enqueueEmailNotification,
  emitRealTimeNotification
} from "../../utils/notification.utils";
import { PaymentMethod } from "../paymentMethod/paymentMethod.model";
import { QueryBuilder } from "../../utils/QueryBuilder";

const calculateJoinMonth = (
  startDate: Date | undefined,
  frequency: ContributionFrequency
): number => {
  if (!startDate) return 1;
  const now = new Date();
  if (now <= startDate) return 1;

  const timeDiff = now.getTime() - startDate.getTime();

  if (frequency === ContributionFrequency.WEEKLY) {
    const weeks = Math.floor(timeDiff / (1000 * 60 * 60 * 24 * 7));
    return weeks + 1;
  }

  if (frequency === ContributionFrequency.MONTHLY) {
    const months =
      (now.getFullYear() - startDate.getFullYear()) * 12 +
      now.getMonth() -
      startDate.getMonth();
    return months + 1;
  }

  if (frequency === ContributionFrequency.YEARLY) {
    const years = now.getFullYear() - startDate.getFullYear();
    return years + 1;
  }

  return 1;
};

const validateGroupJoin = async (userId: string, inviteCode: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(httpStatus.NOT_FOUND, "User not found");

  const group = await Group.findOne({
    inviteCode,
    status: { $in: [GroupStatus.UPCOMING, GroupStatus.ACTIVE] },
    isDeleted: { $ne: true },
  });

  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, "Invalid invite code or group is inactive");
  }

  const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
  const isStartingNow = group.status === GroupStatus.ACTIVE;

  if (!isAdmin || (isAdmin && isStartingNow)) {
    if (!user.stripeConnectedAccountId || user.stripeConnectStatus !== "verified") {
      throw new AppError(httpStatus.FORBIDDEN, "You must connect and verify your Stripe account before joining a group.");
    }
    const paymentMethodCount = await PaymentMethod.countDocuments({ userId, status: "active" });
    if (paymentMethodCount === 0) {
      throw new AppError(httpStatus.FORBIDDEN, "You must add at least one payment method before joining a group.");
    }
  }

  if (group.currentMembers >= group.totalMembers) {
    throw new AppError(httpStatus.BAD_REQUEST, "Group is already full");
  }

  const existingMember = await GroupMember.findOne({
    groupId: group._id,
    userId: new Types.ObjectId(userId),
  });

  if (existingMember) {
    throw new AppError(httpStatus.CONFLICT, "You are already a member of this group");
  }

  return { user, group };
};

const joinGroup = async (userId: string, inviteCode: string) => {
  const { user, group } = await validateGroupJoin(userId, inviteCode);

  const joinMonth = calculateJoinMonth(
    group.startDate as Date,
    group.contributionFrequency as ContributionFrequency
  );
  const position = group.currentMembers + 1;

  let missedMonths = 0;
  let missedAmount = 0;

  if (joinMonth > 1) {
    missedMonths = joinMonth - 1;
    missedAmount = missedMonths * group.contributionAmount;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const newMember = await GroupMember.create(
      [
        {
          groupId: group._id,
          userId: new Types.ObjectId(userId),
          joinMonth,
          position,
          missedAmount,
          missedPayments: missedMonths,
        },
      ],
      { session }
    );

    await Group.findByIdAndUpdate(
      group._id,
      { $inc: { currentMembers: 1 } },
      { session }
    );

    // Recalculate Turns & Payments if the group is already active
    if (group.status === GroupStatus.ACTIVE) {
      await TurnServices.recalculateTurnsAfterRemoval(
        group._id.toString(),
        session
      );
    }

    await session.commitTransaction();

    // Notify Creator
    const creatorId = group.createdBy.toString();
    const joinerName = user.fullName || "A new member";
    const title = "New Member Joined";
    const body = `${joinerName} has joined your group "${group.name}".`;

    emitRealTimeNotification(creatorId, title, body, { groupId: group._id, userId });
    enqueuePushNotification(creatorId, title, body, { groupId: group._id.toString(), userId });
    
    await Notification.create([{
      userId: group.createdBy,
      title,
      message: body,
      type: NotificationType.NEW_MESSAGE
    }]);

    // Notify Joiner (Success)
    const joinerTitle = "Joined Group";
    const joinerBody = `You have successfully joined "${group.name}".`;
    emitRealTimeNotification(userId, joinerTitle, joinerBody);
    enqueuePushNotification(userId, joinerTitle, joinerBody);

    return newMember[0];
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[TRANSACTION_ROLLBACK] joinGroup failed for user ${userId}:`,
      error
    );
    throw error;
  } finally {
    session.endSession();
  }
};

const getGroupMembers = async (groupId: string) => {
  const members = await GroupMember.find({ groupId }).populate(
    "userId",
    "firstName lastName email profileImage"
  );
  return members;
};

const markNotice = async (
  memberId: string,
  noticeStatus: "NONE" | "NOTICE"
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const member = await GroupMember.findByIdAndUpdate(
      memberId,
      { noticeStatus },
      { new: true, session }
    ).populate("userId", "fullName email fcmToken");

    if (!member) {
      throw new AppError(httpStatus.NOT_FOUND, "Group member not found");
    }

    await session.commitTransaction();

    const user: IUserDocument = member.userId as unknown as IUserDocument;
    const group = await Group.findById(member.groupId);

    logger.info(
      `[PAYMENT_FLOW] Notice marked as ${noticeStatus} for member ${memberId}`
    );

    const notificationPromises: Promise<unknown>[] = [
      enqueueEmailNotification(user.email, "Notice Status Updated", "otp", {
        name: `${user.firstName} ${user.lastName}`.trim(),
        otp: noticeStatus,
      })
    ];

    if (user.fcmToken) {
      notificationPromises.push(
        enqueuePushNotification(
          user._id.toString(),
          "Status Update",
          `Your notice status for ${group?.name} has been updated to ${noticeStatus}.`,
          undefined
        )
      );
    }

    await Promise.all(notificationPromises);

    return member;
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[TRANSACTION_ROLLBACK] markNotice failed for member ${memberId}:`,
      error
    );
    throw error;
  } finally {
    session.endSession();
  }
};

const removeMember = async (
  memberId: string,
  removalNote: string,
  adminId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const member = await GroupMember.findById(memberId).session(session);
    if (!member || member.status === MemberStatus.REMOVED) {
      throw new AppError(httpStatus.NOT_FOUND, "Active group member not found");
    }

    const group = await Group.findById(member.groupId).session(session);
    if (!group) {
      throw new AppError(httpStatus.NOT_FOUND, "Group not found");
    }

    member.status = MemberStatus.REMOVED;
    member.removalNote = removalNote;
    member.removedAt = new Date();
    await member.save({ session });

    await Group.findByIdAndUpdate(
      group._id,
      { $inc: { currentMembers: -1 } },
      { session }
    );

    // Recalculate Turns
    await TurnServices.recalculateTurnsAfterRemoval(
      group._id.toString(),
      session
    );

    await session.commitTransaction();

    logger.info(
      `[PAYMENT_FLOW] Member ${memberId} removed from group ${group.name}. Reason: ${removalNote}`
    );

    const user = await User.findById(member.userId);
    const notificationPromises: Promise<unknown>[] = [
      Notification.create({
        userId: user._id,
        title: "Group Removal",
        message: `You have been removed from ${group.name}. Reason: ${removalNote}`,
        type: NotificationType.PAYMENT_FAILED,
      })
    ];

    if (user?.fcmToken) {
      notificationPromises.push(
        enqueuePushNotification(
          user._id.toString(),
          "Group Removal",
          `You have been removed from ${group.name}. Reason: ${removalNote}`,
          undefined
        )
      );
    }

    if (user?.email) {
      notificationPromises.push(
        enqueueEmailNotification(
          user.email,
          "Removed from Group",
          "removalEmail",
          {
            name: `${user.firstName} ${user.lastName}`.trim(),
            groupName: group.name,
            reason: removalNote,
          }
        )
      );
    }

    await Promise.all(notificationPromises);

    return member;
  } catch (error) {
    await session.abortTransaction();
    logger.error(
      `[TRANSACTION_ROLLBACK] removeMember failed for member ${memberId} (Admin: ${adminId}):`,
      error
    );
    throw error;
  } finally {
    session.endSession();
  }
};

const getUserGroupSummary = async (userId: string) => {
  const summary = await GroupMember.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: MemberStatus.ACTIVE,
      },
    },
    {
      $lookup: {
        from: "groups",
        localField: "groupId",
        foreignField: "_id",
        as: "group",
      },
    },
    { $unwind: "$group" },
    { $match: { "group.isDeleted": { $ne: true } } },
    {
      $group: {
        _id: "$group.status",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    active: summary.find((s) => s._id === "active")?.count || 0,
    upcoming: summary.find((s) => s._id === "upcoming")?.count || 0,
    completed: summary.find((s) => s._id === "completed")?.count || 0,
    totalJoined: summary.reduce((acc, curr) => acc + curr.count, 0),
  };
};

const getMyGroups = async (userId: string, query: Record<string, unknown>) => {
  // 1. Get status summary for user's joined groups
  const summaryObj = await getUserGroupSummary(userId);

  // 2. Get paginated group list using QueryBuilder
  const membershipQuery = GroupMember.find({
    userId: new Types.ObjectId(userId),
    status: MemberStatus.ACTIVE,
  })
    .populate({
      path: "groupId",
      match: { isDeleted: { $ne: true } },
      populate: {
        path: "createdBy",
        select: "firstName lastName email profileImage",
      },
    })
    .sort({ createdAt: -1 });

  const queryBuilder = new QueryBuilder(membershipQuery, query as Record<string, string>);
  const memberships = await queryBuilder.paginate().build();
  const meta = await queryBuilder.getMeta();

  const data = (
    memberships as unknown as (IGroupMember & {
      groupId: IGroup & { createdBy: IUser };
    })[]
  )
    .map((m) => {
      const g = m.groupId;
      if (g && g.createdBy && typeof g.createdBy === "object") {
        g.createdBy.fullName =
          `${g.createdBy.firstName || ""} ${g.createdBy.lastName || ""}`.trim() ||
          "Member";
      }
      return g;
    })
    .filter((g) => g !== null);

  return {
    data,
    meta,
    summary: summaryObj,
  };
};

export const GroupMemberServices = {
  joinGroup,
  getGroupMembers,
  markNotice,
  removeMember,
  getMyGroups,
};
