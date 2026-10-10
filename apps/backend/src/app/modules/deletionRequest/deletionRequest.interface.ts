import { Types, Document } from "mongoose";

export enum DeletionRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface IDeletionRequest {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  userEmail: string;
  userName: string;
  userPhone?: string;
  reason?: string;
  status: DeletionRequestStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  adminNote?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IDeletionRequestDocument
  extends Omit<IDeletionRequest, "_id">, Document {}
