import { Types, Document, model, models, Schema } from "mongoose";

export enum PayoutStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  INSUFFICIENT_BALANCE = "insufficient_balance",
}

export interface IPayout {
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  turnId: Types.ObjectId;
  amount: number;
  payoutDate?: Date;
  status: PayoutStatus;
  transactionId?: Types.ObjectId; // Reference to the Transaction
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPayoutDocument extends IPayout, Document {}

const payoutSchema = new Schema<IPayoutDocument>(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
    payoutDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING,
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

export const Payout =
  models.Payout || model<IPayoutDocument>("Payout", payoutSchema);
