import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import logger from "../../utils/logger";
import { emitRealTimeNotification, enqueuePushNotification } from "../../utils/notification.utils";
import { AuthProvider, IUser, Role, UserStatus } from "./user.interface";
import { User } from "./user.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { userSearchableFields } from "./user.constant";
import {
  Notification,
  NotificationType,
} from "../notification/notification.model";
import { Settings } from "../settings/settings.model";
import { Transaction, TransactionType, TransactionStatus } from "../transaction/transaction.model";
import { Turn } from "../turn/turn.model";
import { TurnStatus } from "../turn/turn.interface";
import { Types } from "mongoose";
import { GroupMember } from "../groupMember/groupMember.model";

const createUser = async (payload: Partial<IUser>) => {
  const { email, password, ...rest } = payload;

  const isUserExist = await User.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User Already Exist");
  }

  const hashedPassword = await bcryptjs.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND)
  );

  const user = await User.create({
    email,
    password: hashedPassword,
    authProvider: AuthProvider.EMAIL,
    status: UserStatus.PENDING,
    role: Role.USER,
    ...rest,
  });

  return user;
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  if (decodedToken.role === Role.USER) {
    if (userId !== decodedToken.userId) {
      throw new AppError(401, "You are not authorized!");
    }
  }

  const ifUserExist = await User.findById(userId);

  if (!ifUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  if (
    decodedToken.role === Role.ADMIN &&
    ifUserExist.role === Role.SUPER_ADMIN
  ) {
    throw new AppError(401, "You are not authorized!");
  }

  if (payload.role) {
    if (decodedToken.role === Role.USER) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }

    // Only Super Admin can assign Super Admin role
    if (
      payload.role === Role.SUPER_ADMIN &&
      decodedToken.role !== Role.SUPER_ADMIN
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Only Super Admin can assign Super Admin role"
      );
    }

    // Only Super Admin can change the role of an Admin
    if (
      ifUserExist.role === Role.ADMIN &&
      decodedToken.role !== Role.SUPER_ADMIN
    ) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Only Super Admin can change an Admin's role"
      );
    }

    // Admin cannot change their own role (even to downgrade)
    if (userId === decodedToken.userId && decodedToken.role === Role.ADMIN) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Admin cannot change their own role"
      );
    }
  }

  if (payload.status) {
    if (decodedToken.role === Role.USER) {
      throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
    }
  }

  // Prevent email update and set isUpdatedProfile to true
  if (payload.email) {
    delete payload.email;
  }

  const rawPayload = payload as Record<string, unknown>;

  // Map address to streetAddress if present
  if (rawPayload.address) {
    payload.streetAddress = rawPayload.address as string;
    delete rawPayload.address;
  }

  // Split fullName into firstName and lastName if present
  if (rawPayload.fullName) {
    const nameParts = (rawPayload.fullName as string).trim().split(/\s+/);
    payload.firstName = nameParts[0];
    payload.lastName = nameParts.slice(1).join(" ") || nameParts[0];
    delete rawPayload.fullName;
  }

  // Check if user is toggling 2FA
  if (payload.twoFactorEnabled !== undefined) {
    const settings = await Settings.findOne();
    if (settings && !settings.isTwoFactorAuthenticationEnabled) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Two-Factor Authentication is currently disabled globally by admin."
      );
    }
  }

  payload.isUpdatedProfile = true;

  const newUpdatedUser = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  if (newUpdatedUser) {
    // Notify user if status or KYC status changes
    if (payload.status && payload.status !== ifUserExist.status) {
      const title = "Account Status Updated";
      const message = `Your account status has been updated to ${payload.status}.`;
      await Notification.create({
        userId: newUpdatedUser._id,
        title,
        message,
        type: NotificationType.PAYMENT_DUE,
      });
      emitRealTimeNotification(newUpdatedUser._id.toString(), title, message);
      enqueuePushNotification(newUpdatedUser._id.toString(), title, message);
    }

    if (payload.kycStatus && payload.kycStatus !== ifUserExist.kycStatus) {
      const title = "KYC Status Updated";
      const message = `Your KYC verification status has been updated to ${payload.kycStatus}.`;
      await Notification.create({
        userId: newUpdatedUser._id,
        title,
        message,
        type: NotificationType.PAYMENT_DUE,
      });
      emitRealTimeNotification(newUpdatedUser._id.toString(), title, message);
      enqueuePushNotification(newUpdatedUser._id.toString(), title, message);
    }
  }

  return newUpdatedUser;
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);
  const usersData = queryBuilder
    .filter()
    .search(userSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta(),
  ]);

  const filter = queryBuilder.modelQuery.getFilter();

  const [activeUsers, pendingUsers, suspendedUsers] = await Promise.all([
    User.countDocuments({ ...filter, status: UserStatus.ACTIVE }),
    User.countDocuments({ ...filter, status: UserStatus.PENDING }),
    User.countDocuments({ ...filter, status: UserStatus.SUSPENDED }),
  ]);

  return {
    data,
    meta: {
      ...meta,
      activeUsers,
      pendingUsers,
      suspendedUsers,
    },
  };
};

const getSingleUser = async (id: string) => {
  const result = await User.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  return result;
};

const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  return {
    data: user,
  };
};

const suspendUser = async (id: string, decodedToken: JwtPayload) => {
  const userExist = await User.findById(id);
  if (!userExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Prevent Admin from suspending Super Admin
  if (decodedToken.role === Role.ADMIN && userExist.role === Role.SUPER_ADMIN) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin cannot suspend Super Admin");
  }

  if (userExist.status === UserStatus.SUSPENDED) {
    return userExist;
  }

  const user = await User.findByIdAndUpdate(
    id,
    { status: UserStatus.SUSPENDED },
    { new: true }
  );

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const title = "Account Suspended";
  const message = "Your account has been suspended by an administrator for compliance reasons.";
  
  await Notification.create({
    userId: user._id,
    title,
    message,
    type: NotificationType.PAYMENT_FAILED,
  });
  emitRealTimeNotification(user._id.toString(), title, message);
  enqueuePushNotification(user._id.toString(), title, message);

  logger.warn(`[COMPLIANCE] User ${id} (${user.email}) SUSPENDED by Admin.`);

  return user;
};

const deleteUser = async (id: string, decodedToken: JwtPayload) => {
  const userExist = await User.findById(id);
  if (!userExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  // Prevent Admin from deleting Super Admin
  if (decodedToken.role === Role.ADMIN && userExist.role === Role.SUPER_ADMIN) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Admin cannot delete Super Admin");
  }

  const result = await User.findByIdAndDelete(id);
  return result;
};

const getMyFinancialStats = async (userId: string, role: string) => {
  const isUser = role === Role.USER;
  const amountField = isUser ? "$netAmount" : "$amount";

  const [payoutStats] = await Transaction.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        type: TransactionType.PAYOUT,
        status: TransactionStatus.SUCCESS,
      },
    },
    { $group: { _id: null, totalPayout: { $sum: amountField } } },
  ]);

  const [savingStats] = await Transaction.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        type: TransactionType.CONTRIBUTION,
        status: TransactionStatus.SUCCESS,
      },
    },
    { $group: { _id: null, totalSavings: { $sum: "$amount" } } },
  ]);

  const activeGroupCount = await GroupMember.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: "active",
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
    {
      $match: {
        "group.status": "active",
        "group.isDeleted": false,
      },
    },
    { $count: "count" },
  ]);

  const groupWisePayouts = await Transaction.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        type: TransactionType.PAYOUT,
        status: TransactionStatus.SUCCESS,
      },
    },
    {
      $group: {
        _id: "$groupId",
        totalAmount: { $sum: amountField },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "groups",
        localField: "_id",
        foreignField: "_id",
        as: "groupInfo",
      },
    },
    { $unwind: "$groupInfo" },
    { $project: { groupName: "$groupInfo.name", totalAmount: 1, count: 1 } },
  ]);

  const turnHistory = await Turn.find({
    userId: new Types.ObjectId(userId),
    status: TurnStatus.PAID,
  })
    .populate("groupId", "name")
    .sort({ paidDate: -1 })
    .lean();

  interface PopulatedTurn extends Omit<typeof turnHistory[0], "groupId"> {
    groupId: { name: string; _id: Types.ObjectId };
  }

  // If user, ensure we only show the final payoutAmount and no internal fields
  const filteredHistory = isUser 
    ? (turnHistory as unknown as PopulatedTurn[]).map(t => ({
        _id: t._id,
        groupName: t.groupId?.name,
        amount: t.payoutAmount,
        date: t.paidDate,
        status: t.status
      }))
    : turnHistory;

  return {
    totalPayout: payoutStats?.totalPayout || 0,
    totalSavings: savingStats?.totalSavings || 0,
    totalActiveGroups: activeGroupCount[0]?.count || 0,
    groupWisePayouts,
    turnHistory: filteredHistory,
    isDetailed: !isUser
  };
};


export const UserServices = {
  createUser,
  getAllUsers,
  getMe,
  updateUser,
  getSingleUser,
  suspendUser,
  deleteUser,
  getMyFinancialStats,
};
