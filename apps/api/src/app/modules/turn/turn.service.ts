import { Types, ClientSession } from "mongoose";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Turn } from "./turn.model";
import { Group } from "../group/group.model";
import { GroupMember } from "../groupMember/groupMember.model";

import { TurnStatus } from "./turn.interface";
import { MemberStatus } from "../groupMember/groupMember.interface";
import logger from "../../utils/logger";
import { Payment, PaymentStatus } from "../payment/payment.model";
import { Settings } from "../settings/settings.model";

import {
  getNextTurnDate,
  calculateTurnFinancials,
  getActiveMembersAtDateCount,
  generatePaymentRecords,
} from "./turn.utils";

// --- MAIN SERVICES ---

const generateTurnsForGroup = async (
  groupId: string,
  session: ClientSession | null = null
) => {
  const group = await Group.findById(groupId).session(session);
  if (!group) throw new AppError(httpStatus.NOT_FOUND, "Group not found");

  if (!group.startDate) {
    throw new AppError(httpStatus.BAD_REQUEST, "Group has not started yet. Admin must start the group first.");
  }

  const members = await GroupMember.find({ groupId }).sort({ position: 1 }).session(session);
  const lastTurn = await Turn.findOne({ groupId }).sort({ turnNumber: -1 }).session(session);
  const settings = await Settings.findOne().session(session);

  const currentDate = lastTurn ? getNextTurnDate(new Date(lastTurn.scheduledDate), group.contributionFrequency, 1) : new Date(group.startDate as Date);
  const startTurnNumber = lastTurn ? lastTurn.turnNumber + 1 : 1;

  const turns = [];
  const platformCommissionPercent = settings?.platformCommissionPercent || 1;
  const creatorCommissionPercent = group.creatorCommissionPercent || 0;

  for (let i = 0; i < members.length; i++) {
    const member = members[i];
    const turnNumber = startTurnNumber + i;
    const turnDate = getNextTurnDate(currentDate, group.contributionFrequency, i);
    const activeMembersCount = getActiveMembersAtDateCount(members, turnDate);

    const financials = calculateTurnFinancials(
      activeMembersCount,
      group.contributionAmount,
      member.missedAmount,
      platformCommissionPercent,
      creatorCommissionPercent
    );

    turns.push({
      groupId: group._id,
      userId: member.userId,
      turnNumber: turnNumber,
      payoutAmount: financials.netAmount,
      ...financials,
      scheduledDate: turnDate,
    });

    logger.info(`[TURN_GEN] Cycle Turn ${turnNumber}: Gross ${financials.grossAmount}, Fee ${financials.feeAmount}, Comm ${financials.commissionAmount}, Net ${financials.netAmount}`);
  }

  const createdTurns = await Turn.insertMany(turns, { session: session || undefined });
  const feePercent = settings?.transactionFeePercent || 5;
  const payments = generatePaymentRecords(turns, members, group, feePercent);

  if (payments.length > 0) {
    await Payment.insertMany(payments, { session: session || undefined });
    logger.info(`[PAYMENT_GEN] Generated ${payments.length} payment records for group ${groupId}`);
  }

  return createdTurns;
};

const getGroupTurns = async (groupId: string) => {
  return await Turn.find({ groupId })
    .populate("userId", "firstName lastName email profileImage")
    .sort({ turnNumber: 1 });
};

const recalculateTurnsAfterRemoval = async (
  groupId: string,
  session: ClientSession | null = null
) => {
  const group = await Group.findById(groupId).session(session);
  if (!group) return;

  if (!group.startDate) throw new AppError(httpStatus.BAD_REQUEST, "Group has not started yet.");

  const members = await GroupMember.find({ groupId, status: MemberStatus.ACTIVE }).sort({ position: 1 }).session(session);
  
  // 1. Delete all non-paid turns
  await Turn.deleteMany({ groupId: new Types.ObjectId(groupId), status: { $ne: TurnStatus.PAID } }, { session: session || undefined });

  // 2. Find the last paid turn to determine where to resume
  const lastTurn = await Turn.findOne({ groupId: new Types.ObjectId(groupId), status: TurnStatus.PAID }).sort({ turnNumber: -1 }).session(session);

  const currentDate = lastTurn ? getNextTurnDate(new Date(lastTurn.scheduledDate), group.contributionFrequency, 1) : new Date(group.startDate as Date);
  const startTurnNumber = lastTurn ? lastTurn.turnNumber + 1 : 1;

  // Find members who haven't had a paid turn yet
  const successfulUserIds = await Turn.find({ groupId: new Types.ObjectId(groupId), status: TurnStatus.PAID }).distinct("userId").session(session);
  const successfulUserIdSet = new Set(successfulUserIds.map((id) => id.toString())); // O(1) lookup map
  
  const remainingMembers = members.filter((m) => !successfulUserIdSet.has(m.userId.toString()));
  const settings = await Settings.findOne().session(session);

  const newTurns = [];
  const platformCommissionPercent = settings?.platformCommissionPercent || 1;
  const creatorCommissionPercent = group.creatorCommissionPercent || 0;

  for (let i = 0; i < remainingMembers.length; i++) {
    const member = remainingMembers[i];
    const turnDate = getNextTurnDate(currentDate, group.contributionFrequency, i);
    const activeMembersCount = getActiveMembersAtDateCount(members, turnDate);

    const financials = calculateTurnFinancials(
      activeMembersCount,
      group.contributionAmount,
      member.missedAmount,
      platformCommissionPercent,
      creatorCommissionPercent
    );

    newTurns.push({
      groupId: group._id,
      userId: member.userId,
      turnNumber: startTurnNumber + i,
      payoutAmount: financials.netAmount,
      ...financials,
      scheduledDate: turnDate,
    });
  }

  if (newTurns.length > 0) {
    const createdTurns = await Turn.insertMany(newTurns, { session: session || undefined });

    // 3. Generate new payments for the new turns
    const feePercent = settings?.transactionFeePercent || 5;

    // First delete old unpaid payments for future turns to avoid duplicates
    await Payment.deleteMany({ groupId: new Types.ObjectId(groupId), status: { $ne: PaymentStatus.PAID } }, { session: session || undefined });

    const newPayments = generatePaymentRecords(createdTurns, members, group, feePercent);

    if (newPayments.length > 0) {
      await Payment.insertMany(newPayments, { session: session || undefined });
      logger.info(`[PAYMENT_GEN] Regenerated ${newPayments.length} payment records for group ${groupId} after member removal`);
    }
  }

  logger.info(`[PAYMENT_FLOW] Turns recalculated for group ${groupId}. ${newTurns.length} new turns scheduled.`);
};

export const TurnServices = {
  generateTurnsForGroup,
  getGroupTurns,
  recalculateTurnsAfterRemoval,
};
