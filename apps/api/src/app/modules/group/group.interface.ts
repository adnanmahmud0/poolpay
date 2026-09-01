import { Types, Document } from "mongoose";

export enum ContributionFrequency {
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export enum GroupStatus {
  UPCOMING = "upcoming",
  ACTIVE = "active",
  INACTIVE = "inactive",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface IGroup {
  name: string;
  description?: string;
  createdBy: Types.ObjectId; // User ID
  contributionAmount: number;
  contributionFrequency: ContributionFrequency;
  totalMembers: number; // Max members allowed
  currentMembers: number;
  startDate?: Date; // Optional until started
  inviteCode: string;
  poolAmount: number; // contributionAmount * totalMembers
  totalCycles: number; // Number of rounds to repeat (default 1)
  status: GroupStatus;
  groupPhoto?: string;
  isDeleted: boolean;
  isMock: boolean;
  lastStartReminderSentAt?: Date;
  creatorCommissionPercent: number;
  isAdminCreated?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGroupDocument extends IGroup, Document {}
