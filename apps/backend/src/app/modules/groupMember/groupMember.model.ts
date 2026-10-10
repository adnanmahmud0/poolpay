import { model, models, Schema } from "mongoose";
import { IGroupMemberDocument, MemberStatus } from "./groupMember.interface";

const groupMemberSchema = new Schema<IGroupMemberDocument>(
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
    joinMonth: { type: Number, required: true },
    position: { type: Number, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(MemberStatus),
      default: MemberStatus.ACTIVE,
      index: true,
    },
    noticeStatus: { type: String, default: "NONE", index: true },
    removalNote: { type: String },
    removedAt: { type: Date },
    missedPaymentCount: { type: Number, default: 0 },
    totalPaidAmount: { type: Number, default: 0 },
    missedPayments: { type: Number, default: 0 },
    missedAmount: { type: Number, default: 0 },
    isMock: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Prevent duplicate membership
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export const GroupMember =
  models.GroupMember ||
  model<IGroupMemberDocument>("GroupMember", groupMemberSchema);
