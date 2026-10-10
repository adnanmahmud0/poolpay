import { Notification } from "./notification.model";
import { Types } from "mongoose";

import { QueryBuilder } from "../../utils/QueryBuilder";

const getMyNotifications = async (
  userId: string,
  query: Record<string, string>
) => {
  const notificationQuery = Notification.find({ userId });

  const queryBuilder = new QueryBuilder(notificationQuery, query);

  const result = await queryBuilder.sort().paginate().fields().build();

  const meta = await queryBuilder.getMeta();

  return {
    data: result,
    meta,
  };
};

const markAsRead = async (
  notificationId: string,
  userId: string | Types.ObjectId
) => {
  const result = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { new: true }
  );
  return result;
};

const markAllAsRead = async (userId: string | Types.ObjectId) => {
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  return { message: "All notifications marked as read" };
};

export const NotificationServices = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
