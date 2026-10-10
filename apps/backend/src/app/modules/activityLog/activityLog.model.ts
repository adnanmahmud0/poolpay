import { Types, Document, model, models, Schema } from "mongoose";

export interface IActivityLog {
  userId: Types.ObjectId;
  action: string;
  details: string;
  ipAddress?: string;
  device?: string;
  createdAt?: Date;
  isMock?: boolean;
}

export interface IActivityLogDocument extends IActivityLog, Document {}

const activityLogSchema = new Schema<IActivityLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
    device: { type: String },
    isMock: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

activityLogSchema.index({ createdAt: -1 });

export const ActivityLog =
  models.ActivityLog ||
  model<IActivityLogDocument>("ActivityLog", activityLogSchema);
