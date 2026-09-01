import { Types, Document } from "mongoose";

export enum MemberStatus {
  ACTIVE = "active",
  REMOVED = "removed",
}

export interface IGroupMember {
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  joinMonth: number;
  position: number; // For turn system ordering
  status: MemberStatus;
  noticeStatus: "NONE" | "NOTICE";
  removalNote?: string;
  removedAt?: Date;
  missedPaymentCount: number;
  totalPaidAmount: number;
  missedPayments: number;
  missedAmount: number; // Late join penalty amount
  isMock?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGroupMemberDocument extends IGroupMember, Document {}
