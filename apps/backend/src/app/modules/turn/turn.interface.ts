import { Types, Document } from "mongoose";

export enum TurnStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  PAID = "paid",
  FAILED = "failed",
  MANUAL_REVIEW = "manual_review",
  RECOVERY_REQUIRED = "recovery_required",
}

export interface ITurn {
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  turnNumber: number;
  payoutAmount: number; // For backward compatibility, same as netAmount
  grossAmount: number;
  feeAmount: number;
  commissionAmount: number;
  netAmount: number;
  scheduledDate: Date;
  paidDate?: Date;
  status: TurnStatus;
  recoveryAttempts?: number;
  stripeTransferId?: string;
  stripeCreatorTransferId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ITurnDocument extends ITurn, Document {}
