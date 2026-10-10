import { Types, Document, model, models, Schema } from "mongoose";

export interface IAdjustment {
  userId: Types.ObjectId;
  groupId: Types.ObjectId;
  turnId: Types.ObjectId;
  amount: number;
  reason: string;
  status: "pending" | "completed" | "failed";
  transactionId?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IAdjustmentDocument extends IAdjustment, Document {}

const adjustmentSchema = new Schema<IAdjustmentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    turnId: {
      type: Schema.Types.ObjectId,
      ref: "Turn",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const Adjustment =
  models.Adjustment ||
  model<IAdjustmentDocument>("Adjustment", adjustmentSchema);
