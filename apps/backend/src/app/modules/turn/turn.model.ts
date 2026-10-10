import { model, models, Schema } from "mongoose";
import { ITurnDocument, TurnStatus } from "./turn.interface";

const turnSchema = new Schema<ITurnDocument>(
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
    turnNumber: { type: Number, required: true, index: true },
    payoutAmount: { type: Number, required: true },
    grossAmount: { type: Number, required: true, default: 0 },
    feeAmount: { type: Number, required: true, default: 0 },
    commissionAmount: { type: Number, required: true, default: 0 },
    netAmount: { type: Number, required: true, default: 0 },
    scheduledDate: { type: Date, required: true, index: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(TurnStatus),
      default: TurnStatus.PENDING,
      index: true,
    },
    recoveryAttempts: { type: Number, default: 0 },
    stripeTransferId: { type: String, unique: true, sparse: true, index: true },
    stripeCreatorTransferId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Performance indexes
turnSchema.index({ groupId: 1, status: 1 });
turnSchema.index({ groupId: 1, turnNumber: 1 }, { unique: true });
// Compound index for reconciliation performance
turnSchema.index({ status: 1, updatedAt: 1 });

export const Turn = models.Turn || model<ITurnDocument>("Turn", turnSchema);
