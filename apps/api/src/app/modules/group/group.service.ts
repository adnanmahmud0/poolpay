import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { Group } from "./group.model";
import { IGroup } from "./group.interface";
import { GroupMember } from "../groupMember/groupMember.model";
import { emitRealTimeNotification, enqueuePushNotification } from "../../utils/notification.utils";
import {
  Notification,
  NotificationType,
} from "../notification/notification.model";
import { logActivity } from "../../utils/activityLogger";
import { TurnServices } from "../turn/turn.service";
import { GroupStatus } from "./group.interface";
import { Payment } from "../payment/payment.model";
import { Turn } from "../turn/turn.model";
import { User } from "../user/user.model";
import { PaymentMethod } from "../paymentMethod/paymentMethod.model";
import { IUser, Role } from "../user/user.interface";
import type { IGroupMember } from "../groupMember/groupMember.interface";
import { validateMembershipAction, MembershipAction } from "../membership/membership.utils";
import { withTransaction } from "../../utils/transaction.utils";

const generateInviteCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createGroup = async (userId: string, payload: Partial<IGroup>) => {
  // Membership Gating
  await validateMembershipAction(userId, MembershipAction.CREATE_GROUP);

  const { contributionAmount, totalMembers } = payload;

  if (!contributionAmount || !totalMembers) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Contribution amount and total members are required"
    );
  }

  // Check user prerequisites: Payment Method & Stripe Connect
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
  const isStartingNow =
    payload.startDate || payload.status === GroupStatus.ACTIVE;

  // Prerequisites check applies to regular users,
  // OR to admins if they are starting the group now (setting startDate or status ACTIVE)
  if (!isAdmin || (isAdmin && isStartingNow)) {
    if (
      !user.stripeConnectedAccountId ||
      user.stripeConnectStatus !== "verified"
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You must connect and verify your Stripe account before creating a group."
      );
    }

    const paymentMethodCount = await PaymentMethod.countDocuments({
      userId,
      status: "active",
    });
    if (paymentMethodCount === 0) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You must add at least one payment method before creating a group."
      );
    }
  }

  // Ensure unique invite code
  let inviteCode = generateInviteCode();
  let codeExists = await Group.findOne({ inviteCode });
  while (codeExists) {
    inviteCode = generateInviteCode();
    codeExists = await Group.findOne({ inviteCode });
  }

  return await withTransaction(async (session) => {
    const newGroup = await Group.create(
      [
        {
          ...payload,
          createdBy: new Types.ObjectId(userId),
          poolAmount: 0,
          inviteCode,
          currentMembers: 1, // Start with 1 (the creator)
          isAdminCreated: isAdmin,
        },
      ],
      session ? { session } : undefined
    );

    // Create GroupMember for the creator
    await GroupMember.create(
      [
        {
          groupId: newGroup[0]._id,
          userId: new Types.ObjectId(userId),
          joinMonth: 1,
          position: 1,
          status: "active",
        },
      ],
      session ? { session } : undefined
    );

    return newGroup[0];
  });
};

const getGroupDetails = async (groupId: string) => {
  const group = (await Group.findById(groupId)
    .populate("createdBy", "firstName lastName email profileImage")
    .lean()) as (IGroup & { createdBy: IUser }) | null;

  if (!group || group.isDeleted) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Group not found or has been deleted"
    );
  }

  // Fetch members
  const members = await GroupMember.find({ groupId })
    .populate("userId", "firstName lastName email profileImage")
    .lean();

  // Reconstruct fullName for frontend compatibility since using .lean()
  if (group.createdBy) {
    const creator = group.createdBy as unknown as IUser;
    creator.fullName = `${creator.firstName || ""} ${creator.lastName || ""}`.trim();
  }

  // For each member, find their turn and latest payment status
  const membersWithDetails = await Promise.all(
    (members as unknown as (IGroupMember & { userId: IUser })[]).map(async (member) => {
      const userId = member.userId?._id?.toString() || (member.userId as unknown as string);
      
      const [latestPayment, turn] = await Promise.all([
        Payment.findOne({
          groupId,
          userId,
        }).sort({ dueDate: -1 }),
        Turn.findOne({
          groupId,
          userId,
        }),
      ]);

      // Reconstruct fullName for member
      if (member.userId && typeof member.userId === 'object') {
        member.userId.fullName = `${member.userId.firstName || ""} ${member.userId.lastName || ""}`.trim();
      }

      return {
        ...member,
        paymentStatus: latestPayment ? latestPayment.status : "pending",
        lastPaymentDate: latestPayment ? latestPayment.paidDate : null,
        turnNumber: turn ? turn.turnNumber : null,
        turnDate: turn ? turn.scheduledDate : null,
        turnStatus: turn ? turn.status : null,
      };
    })
  );

  return {
    ...group,
    members: membersWithDetails,
  };
};

const getGroupByInviteCode = async (inviteCode: string) => {
  const group = (await Group.findOne({
    inviteCode,
    isDeleted: { $ne: true },
  }).populate("createdBy", "firstName lastName email profileImage")
    .lean()) as (IGroup & { createdBy: IUser }) | null;
  if (!group) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Group not found with this invite code or has been deleted"
    );
  }

  if (group.createdBy) {
    const creator = group.createdBy as unknown as IUser;
    creator.fullName = `${creator.firstName || ""} ${creator.lastName || ""}`.trim();
  }
  return group;
};

const checkMembersPaymentMethods = async (groupId: string) => {
  const members = await GroupMember.find({ groupId, status: "active" }).populate(
    "userId",
    "firstName lastName stripeConnectedAccountId stripeConnectStatus"
  );

  const validationResults = await Promise.all(
    members.map(async (member) => {
      const user = member.userId as unknown as IUser;
      const paymentMethodCount = await PaymentMethod.countDocuments({
        userId: user._id,
        status: "active",
      });

      if (
        paymentMethodCount === 0 ||
        !user.stripeConnectedAccountId ||
        user.stripeConnectStatus !== "verified"
      ) {
        return user.fullName;
      }
      return null;
    })
  );

  const membersIneligible = validationResults.filter(Boolean) as string[];

  if (membersIneligible.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `The following members are not eligible: ${membersIneligible.join(
        ", "
      )}. They must have a verified Stripe account and at least one active payment method before the group can start.`
    );
  }
};

const deleteGroup = async (userId: string, groupId: string) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, "Group not found");
  }

  // Check if user is the creator (admin)
  if (group.createdBy.toString() !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only the group owner can delete this group"
    );
  }

  if (group.isDeleted) {
    throw new AppError(httpStatus.BAD_REQUEST, "Group is already deleted");
  }

  if (group.status === GroupStatus.ACTIVE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Active groups cannot be deleted. Please cancel the group first to handle settlements."
    );
  }

  if (group.status === GroupStatus.COMPLETED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Completed groups cannot be deleted for audit reasons. They are archived."
    );
  }

  return await withTransaction(async (session) => {
    // 1. Mark group as deleted
    group.isDeleted = true;
    await group.save(session ? { session } : undefined);

    // 2. Find all active members
    const members = await GroupMember.find({
      groupId: group._id,
      status: "active",
    }).session(session || null);

    // 3. Notify all members
    const notifications = members.map((member) => ({
      userId: member.userId,
      title: "Group Deleted",
      message: `The group "${group.name}" has been deleted by the owner.`,
      type: NotificationType.GROUP_DELETED,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, session ? { session } : {});
    }

    // Side-effects (Real-time and Push)
    for (const n of notifications) {
      emitRealTimeNotification(n.userId.toString(), n.title, n.message, { groupId: group._id.toString() });
      enqueuePushNotification(n.userId.toString(), n.title, n.message, { groupId: group._id.toString() });
    }

    // 4. Log Activity
    await logActivity(
      userId,
      "GROUP_DELETED",
      `Group ${group.name} (${group._id}) was soft-deleted by owner.`
    );

    return { message: "Group soft-deleted successfully and members notified" };
  });
};

const startGroup = async (userId: string, groupId: string) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, "Group not found");
  }

  // 1. Verify Ownership
  if (group.createdBy.toString() !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only the group owner can start this group"
    );
  }

  // 2. Prevent Duplicate Activation
  if (group.status === GroupStatus.ACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, "Group is already started");
  }

  if (group.status !== GroupStatus.UPCOMING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Group cannot be started from '${group.status}' status`
    );
  }
 
  // 3. Verify member count
  if (group.currentMembers < group.totalMembers) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Group needs ${group.totalMembers} members to start. Current members: ${group.currentMembers}`
    );
  }

  // 3. Verify all members have at least one payment method
  await checkMembersPaymentMethods(groupId);

  return await withTransaction(async (session) => {
    // 3. Update Group Status and Start Date
    group.status = GroupStatus.ACTIVE;
    group.startDate = new Date();
    await group.save(session ? { session } : undefined);

    // 4. Generate Initial Turns for all current members
    await TurnServices.generateTurnsForGroup(group._id.toString(), session || null);

    // 5. Notify all members
    const members = await GroupMember.find({
      groupId: group._id,
      status: "active",
    }).session(session || null);

    const notifications = members.map((member) => ({
      userId: member.userId,
      title: "Group Started!",
      message: `The savings round for "${group.name}" has officially started. Check your turns!`,
      type: NotificationType.GROUP_STARTED,
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications, session ? { session } : {});
    }

    // Side-effects (Real-time and Push)
    for (const n of notifications) {
      emitRealTimeNotification(n.userId.toString(), n.title, n.message, { groupId: group._id.toString() });
      enqueuePushNotification(n.userId.toString(), n.title, n.message, { groupId: group._id.toString() });
    }

    // 6. Log Activity
    await logActivity(
      userId,
      "GROUP_STARTED",
      `Group ${group.name} (${group._id}) was activated by owner.`
    );

    return { message: "Group started successfully and turns generated", group };
  });
};

export const GroupServices = {
  createGroup,
  getGroupDetails,
  getGroupByInviteCode,
  deleteGroup,
  startGroup,
  checkMembersPaymentMethods,
};
