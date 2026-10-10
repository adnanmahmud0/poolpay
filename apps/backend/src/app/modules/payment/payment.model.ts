import { Types, Document, model, models, Schema } from "mongoose";

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PAID = "paid",
  FAILED = "failed",
  LATE = "late",
  MANUAL_REVIEW = "manual_review",
  RECOVERY_REQUIRED = "recovery_required",
}

export interface IPayment {
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  fee: number;
  netAmount: number;
  dueDate: Date;
  paidDate?: Date;
  status: PaymentStatus;
  retryCount: number;
  recoveryAttempts: number;
  lateFee: number;
  lateFeeApplied: boolean;
  gracePeriodEndsAt: Date;
  removalDeadlineAt: Date;
  removalWarningSent: boolean;
  lastReminderSentAt?: Date;
  stripePaymentIntentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isMock?: boolean;
}

export interface IPaymentDocument extends IPayment, Document {}

const paymentSchema = new Schema<IPaymentDocument>(
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
    amount: { type: Number, required: true },
    fee: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true, index: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    retryCount: { type: Number, default: 0 },
    recoveryAttempts: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    lateFeeApplied: { type: Boolean, default: false, index: true },
    gracePeriodEndsAt: { type: Date },
    removalDeadlineAt: { type: Date, index: true },
    removalWarningSent: { type: Boolean, default: false },
    lastReminderSentAt: { type: Date },
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    isMock: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for daily audit performance
paymentSchema.index({ status: 1, dueDate: 1 });
// Compound index for reconciliation performance
paymentSchema.index({ status: 1, updatedAt: 1 });

export const Payment =
  models.Payment || model<IPaymentDocument>("Payment", paymentSchema);
