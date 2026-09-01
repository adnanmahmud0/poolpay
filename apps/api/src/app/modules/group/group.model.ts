import { model, models, Schema } from "mongoose";
import { ContributionFrequency, GroupStatus, IGroupDocument } from "./group.interface";

const groupSchema = new Schema<IGroupDocument>(
  {
    name: { type: String, required: true },
    description: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contributionAmount: { type: Number, required: true },
    contributionFrequency: {
      type: String,
      enum: Object.values(ContributionFrequency),
      required: true,
      index: true,
    },
    totalMembers: { type: Number, required: true },
    currentMembers: { type: Number, default: 0 },
    startDate: { type: Date, index: true },
    inviteCode: { type: String, required: true, unique: true, index: true },
    poolAmount: { type: Number, required: true },
    totalCycles: { type: Number, default: 1 },
    status: {
      type: String,
      enum: Object.values(GroupStatus),
      default: GroupStatus.UPCOMING,
      index: true,
    },
    groupPhoto: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    isMock: { type: Boolean, default: false, index: true },
    lastStartReminderSentAt: { type: Date },
    creatorCommissionPercent: { type: Number, default: 0, min: 0, max: 1 },
    isAdminCreated: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Performance indexes
groupSchema.index({ createdBy: 1, isDeleted: 1 });

export const Group = models.Group || model<IGroupDocument>("Group", groupSchema);
