import { Types } from "mongoose";
import { ContributionFrequency } from "../group/group.interface";
import { PaymentStatus } from "../payment/payment.model";

export const getNextTurnDate = (
  baseDate: Date,
  frequency: string,
  steps = 1
): Date => {
  const newDate = new Date(baseDate);
  if (steps === 0) return newDate;

  if (frequency === ContributionFrequency.WEEKLY) {
    newDate.setDate(newDate.getDate() + steps * 7);
  } else if (frequency === ContributionFrequency.MONTHLY) {
    newDate.setMonth(newDate.getMonth() + steps);
  } else if (frequency === ContributionFrequency.YEARLY) {
    newDate.setFullYear(newDate.getFullYear() + steps);
  }
  return newDate;
};

export const calculateTurnFinancials = (
  activeCount: number,
  contributionAmount: number,
  missedAmount: number,
  platformPercent: number,
  creatorPercent: number
) => {
  const grossAmount = activeCount * contributionAmount - missedAmount;
  const feeAmount = (grossAmount * platformPercent) / 100;
  const commissionAmount = (grossAmount * creatorPercent) / 100;
  const netAmount = grossAmount - feeAmount - commissionAmount;

  return { grossAmount, feeAmount, commissionAmount, netAmount };
};

export const getActiveMembersAtDateCount = (
  members: { createdAt?: Date }[],
  turnDate: Date
): number => {
  let count = 0;
  for (const m of members) {
    const joinDate = m.createdAt || new Date(0);
    if (joinDate <= turnDate) count++;
  }
  return count;
};

export const generatePaymentRecords = (
  turns: { scheduledDate: Date }[],
  members: { userId: string | Types.ObjectId }[],
  group: { _id: string | Types.ObjectId; contributionAmount: number },
  feePercent: number
) => {
  const payments = [];
  const fee = (group.contributionAmount * feePercent) / 100;
  const totalAmount = group.contributionAmount + fee;

  for (const turn of turns) {
    for (const m of members) {
      payments.push({
        groupId: group._id,
        userId: m.userId,
        amount: totalAmount,
        fee: fee,
        netAmount: group.contributionAmount,
        dueDate: turn.scheduledDate,
        status: PaymentStatus.PENDING,
      });
    }
  }
  return payments;
};
