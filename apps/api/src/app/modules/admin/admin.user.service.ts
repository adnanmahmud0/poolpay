import mongoose from "mongoose";
import ExcelJS from "exceljs";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { User } from "../user/user.model";
import { Role, UserStatus, type IUser, type IUserDocument } from "../user/user.interface";
import { Notification, NotificationType } from "../notification/notification.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { logActivity } from "../../utils/activityLogger";
import {
  emitRealTimeNotification,
  enqueueEmailNotification,
  enqueuePushNotification,
} from "../../utils/notification.utils";

const getAllUsers = async (query: Record<string, unknown>) => {
  const userQuery = new QueryBuilder(User.find(), query as Record<string, string>)
    .search(["firstName", "lastName", "email"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = await userQuery.build();
  const meta = await userQuery.getMeta();

  const [activeUsers, pendingUsers, suspendedUsers, totalUsers] = await Promise.all([
    User.countDocuments({ status: UserStatus.ACTIVE }),
    User.countDocuments({ status: UserStatus.PENDING }),
    User.countDocuments({ status: UserStatus.SUSPENDED }),
    User.countDocuments() // Unfiltered total users
  ]);

  const usersWithFullName = (data as unknown as IUserDocument[]).map((user) => {
    const userObj = user.toObject ? user.toObject() : user;
    return {
      ...userObj,
      fullName: user.fullName || "Member",
    };
  });

  return {
    data: usersWithFullName,
    meta,
    totalUsers,
    activeUsers,
    pendingUsers,
    suspendedUsers,
  };
};

const getUserById = (id: string) => User.findById(id).lean();

const getRecentUsers = async () => {
  return await User.find()
    .select("firstName lastName email profileImage createdAt status")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
};

const updateUserStatus = async (id: string, status: string, adminRole: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userExist = await User.findById(id).session(session);
    if (!userExist) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (adminRole === Role.ADMIN && userExist.role === Role.SUPER_ADMIN) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Admin cannot update Super Admin status");
    }

    const updated = await User.findByIdAndUpdate(id, { status }, { new: true, session });
    if (updated) {
      await logActivity(id, "USER_STATUS_UPDATED", `User status updated to ${status} by Admin.`, session);

      // Notify User
      const title = status === UserStatus.ACTIVE ? "Account Approved" : "Account Status Updated";
      const body = status === UserStatus.ACTIVE 
        ? "Congratulations! Your account has been approved by the admin. You can now join groups and participate in savings."
        : `Your account status has been updated to ${status}.`;

      // Real-time
      emitRealTimeNotification(id, title, body, { status });

      const notificationPromises: Promise<unknown>[] = [
        enqueueEmailNotification(updated.email, title, "adminAlert", { message: body }),
        Notification.create([{
          userId: id,
          title,
          message: body,
          type: status === UserStatus.ACTIVE ? NotificationType.NEW_MESSAGE : NotificationType.PAYMENT_FAILED
        }], { session })
      ];

      if (updated.fcmToken) {
        notificationPromises.push(
          enqueuePushNotification(id, title, body, { status })
        );
      }

      await Promise.all(notificationPromises);
    }

    await session.commitTransaction();
    return updated;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const exportUsersToExcel = async (query: Record<string, unknown>) => {
  const { data } = await getAllUsers(query);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Users");

  worksheet.columns = [
    { header: "Full Name", key: "fullName", width: 30 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 20 },
    { header: "Status", key: "status", width: 15 },
    { header: "Role", key: "role", width: 15 },
    { header: "Joined Date", key: "createdAt", width: 20 },
  ];

  data.forEach((user: IUser) => {
    worksheet.addRow({
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phone || "N/A",
      status: user.status,
      role: user.role,
      createdAt: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString()
        : "N/A",
    });
  });

  // Style the header
  worksheet.getRow(1).font = { bold: true };

  return workbook;
};

export const AdminUserServices = {
  getAllUsers,
  getUserById,
  getRecentUsers,
  updateUserStatus,
  exportUsersToExcel,
};
