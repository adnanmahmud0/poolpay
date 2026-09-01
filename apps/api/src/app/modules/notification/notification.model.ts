import { Types, Document, model, models, Schema } from "mongoose";

export enum NotificationType {
  PAYMENT_DUE = "payment_due",
  PAYMENT_SUCCESS = "payment_success",
  PAYMENT_FAILED = "payment_failed",
  TURN_REMINDER = "turn_reminder",
  GROUP_INVITATION = "group_invitation",
  NEW_MESSAGE = "new_message",
  GROUP_DELETED = "group_deleted",
  GROUP_STARTED = "group_started",
  GROUP_COMPLETED = "group_completed",
  PAYOUT_RECEIVED = "payout_received",
}

export interface INotification {
  userId: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isMock?: boolean;
}

export interface INotificationDocument extends INotification, Document {}

const notificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    isRead: { type: Boolean, default: false, index: true },
    isMock: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for user unread notifications performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export const Notification = models.Notification || model<INotificationDocument>("Notification", notificationSchema);
