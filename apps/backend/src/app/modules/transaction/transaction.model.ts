import { Types, Document, model, models, Schema } from "mongoose";

export enum TransactionType {
  CONTRIBUTION = "contribution",
  PAYOUT = "payout",
}

export enum TransactionStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  FROZEN = "frozen",
}

export interface ITransaction {
  userId: Types.ObjectId;
  groupId: Types.ObjectId;
  paymentMethodId?: Types.ObjectId; // Optional for payouts if handled differently
  type: TransactionType;
  amount: number;
  fee: number;
  platformFee: number;
  platformFeePercent: number;
  stripeFee: number;
  stripeFeePercent: number;
  netAmount: number;
  status: TransactionStatus;
  referenceId: string; // Stripe PaymentIntent ID or Transfer ID
  isFlagged: boolean;
  flaggedReason?: string;
  creatorFee?: number;
  creatorFeePercent?: number;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  isMock?: boolean;
}

export interface ITransactionDocument extends ITransaction, Document {}

const transactionSchema = new Schema<ITransactionDocument>(
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
    paymentMethodId: { type: Schema.Types.ObjectId, ref: "PaymentMethod" },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    amount: { type: Number, required: true },
    fee: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    platformFeePercent: { type: Number, default: 0 },
    stripeFee: { type: Number, default: 0 },
    stripeFeePercent: { type: Number, default: 0 },
    netAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      index: true,
    },
    referenceId: { type: String, required: true, index: true },
    isFlagged: { type: Boolean, default: false, index: true },
    flaggedReason: { type: String },
    creatorFee: { type: Number, default: 0 },
    creatorFeePercent: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed },
    isMock: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for group transaction history performance
transactionSchema.index({ groupId: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });
// Compound index for webhook idempotency lookups
transactionSchema.index({ referenceId: 1, status: 1 });

export const Transaction =
  models.Transaction ||
  model<ITransactionDocument>("Transaction", transactionSchema);
