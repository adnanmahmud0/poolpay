import { Types } from "mongoose";
import {
  ITransaction,
  Transaction,
  TransactionStatus,
} from "./transaction.model";
import {
  Notification,
  NotificationType,
} from "../notification/notification.model";
import { Group } from "../group/group.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { IUser } from "../user/user.interface";

import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import logger from "../../utils/logger";
import {
  emitRealTimeNotification,
  enqueuePushNotification,
} from "../../utils/notification.utils";

const getAllTransactions = async (query: Record<string, string>) => {
  const transactionQuery = Transaction.find()
    .populate("userId", "firstName lastName email")
    .populate("groupId", "name");

  const queryBuilder = new QueryBuilder(transactionQuery, query);

  // Handle flagged filter
  if (query.flagged === "true") {
    queryBuilder.modelQuery = queryBuilder.modelQuery.find({ isFlagged: true });
  }

  const result = queryBuilder.filter().sort().paginate().fields();

  const data = await result.build();
  const meta = await queryBuilder.getMeta();

  // Reconstruct fullName for frontend compatibility
  const transactionsWithFullName = (
    data as unknown as (ITransaction & { userId: IUser })[]
  ).map((trx) => {
    if (trx.userId && typeof trx.userId === "object") {
      trx.userId.fullName =
        `${trx.userId.firstName || ""} ${trx.userId.lastName || ""}`.trim() ||
        "Member";
    }
    return trx;
  });

  return {
    data: transactionsWithFullName,
    meta,
  };
};

const flagTransaction = async (
  id: string,
  payload: { flaggedReason: string }
) => {
  const transaction = await Transaction.findByIdAndUpdate(
    id,
    { isFlagged: true, flaggedReason: payload.flaggedReason },
    { new: true }
  );

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, "Transaction not found");
  }

  const group = await Group.findById(transaction.groupId);
  const title = "Transaction Flagged";
  const message = `Your transaction of $${transaction.amount} in ${group?.name || "the group"} has been flagged for review. Reason: ${payload.flaggedReason}`;
  await Notification.create({
    userId: transaction.userId,
    title,
    message,
    type: NotificationType.PAYMENT_FAILED,
  });

  emitRealTimeNotification(transaction.userId.toString(), title, message);
  enqueuePushNotification(transaction.userId.toString(), title, message);

  logger.warn(
    `[COMPLIANCE] Transaction ${id} flagged by Admin. Reason: ${payload.flaggedReason}`
  );

  return transaction;
};

const freezeTransaction = async (id: string) => {
  const transaction = await Transaction.findByIdAndUpdate(
    id,
    { status: TransactionStatus.FROZEN },
    { new: true }
  );

  if (!transaction) {
    throw new AppError(httpStatus.NOT_FOUND, "Transaction not found");
  }

  const group = await Group.findById(transaction.groupId);
  const title = "Transaction Frozen";
  const message = `Your transaction of $${transaction.amount} in ${group?.name || "the group"} has been frozen by an administrator.`;
  await Notification.create({
    userId: transaction.userId,
    title,
    message,
    type: NotificationType.PAYMENT_FAILED,
  });

  emitRealTimeNotification(transaction.userId.toString(), title, message);
  enqueuePushNotification(transaction.userId.toString(), title, message);

  logger.warn(`[COMPLIANCE] Transaction ${id} FROZEN by Admin.`);

  return transaction;
};

const getMyTransactions = async (
  userId: string,
  query: Record<string, string>
) => {
  const transactionQuery = Transaction.find({
    userId: new Types.ObjectId(userId),
  }).populate("groupId", "name");

  const queryBuilder = new QueryBuilder(transactionQuery, query);
  const result = queryBuilder.filter().sort().paginate().fields();

  const data = await result.build();
  const meta = await queryBuilder.getMeta();

  return {
    data,
    meta,
  };
};

export const TransactionServices = {
  getAllTransactions,
  flagTransaction,
  freezeTransaction,
  getMyTransactions,
};
