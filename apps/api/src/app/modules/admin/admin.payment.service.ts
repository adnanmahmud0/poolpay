import ExcelJS from "exceljs";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { Payment, PaymentStatus, type IPayment } from "../payment/payment.model";
import { Payout, PayoutStatus, type IPayout } from "../payout/payout.model";
import { Turn } from "../turn/turn.model";
import { TurnStatus } from "../turn/turn.interface";
import { Group } from "../group/group.model";
import { User } from "../user/user.model";
import { AuditLog, AuditAction, EntityType } from "../auditLog/auditLog.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { logActivity } from "../../utils/activityLogger";
import { paymentQueue, turnSchedulerQueue } from "../../queues/payment.queue";
import { stripe } from "../../config/stripe.config";
import { withTransaction } from "../../utils/transaction.utils";

const getAllPayments = async (query: Record<string, unknown>) => {
  const { status, search } = query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  if (search) {
    const [groups, users] = await Promise.all([
      Group.find({ name: { $regex: search, $options: "i" } }).select("_id"),
      User.find({
        $or: [
          { firstName: { $regex: search, $options: "i" } },
          { lastName: { $regex: search, $options: "i" } },
        ],
      }).select("_id"),
    ]);

    filter.$or = [
      { groupId: { $in: groups.map((g) => g._id) } },
      { userId: { $in: users.map((u) => u._id) } },
      { stripePaymentIntentId: { $regex: search, $options: "i" } },
    ];
  }

  const paymentQuery = new QueryBuilder(
    Payment.find(filter).populate("userId", "firstName lastName email").populate("groupId", "name"),
    query as Record<string, string>
  )
    .sort()
    .paginate()
    .fields();

  const data = (await paymentQuery.build().lean()) as unknown as (IPayment & { _id: string })[];
  const meta = await paymentQuery.getMeta();

  const stats = await Payment.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
      },
    },
  ]);

  const summary = {
    totalPayments: meta.total,
    completedAmount: stats.find((s) => s._id === PaymentStatus.PAID)?.totalAmount || 0,
    pendingAmount: stats.find((s) => s._id === PaymentStatus.PENDING)?.totalAmount || 0,
    failedCount: stats.find((s) => s._id === PaymentStatus.FAILED)?.count || 0,
  };

  return { data, meta, summary };
};

const getPaymentById = (id: string) =>
  Payment.findById(id)
    .populate("userId", "firstName lastName email")
    .populate("groupId", "name")
    .lean();

interface IPopulatedPayment extends Omit<IPayment, "userId" | "groupId"> {
  userId?: { firstName: string; lastName: string; email: string };
  groupId?: { name: string };
}

const exportPaymentsToExcel = async (query: Record<string, unknown>) => {
  const result = await getAllPayments(query);
  const data = result.data as unknown as IPopulatedPayment[];

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Payments");

  worksheet.columns = [
    { header: "User", key: "user", width: 30 },
    { header: "Group", key: "group", width: 30 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Status", key: "status", width: 15 },
    { header: "Due Date", key: "dueDate", width: 20 },
    { header: "Paid Date", key: "paidDate", width: 20 },
    { header: "Transaction ID", key: "transactionId", width: 35 },
  ];

  data.forEach((payment: IPopulatedPayment) => {
    worksheet.addRow({
      user: payment.userId?.firstName ? `${payment.userId.firstName} ${payment.userId.lastName}` : "N/A",
      group: payment.groupId?.name || "N/A",
      amount: payment.amount,
      status: payment.status,
      dueDate: payment.dueDate
        ? new Date(payment.dueDate).toLocaleDateString()
        : "N/A",
      paidDate: payment.paidDate
        ? new Date(payment.paidDate).toLocaleDateString()
        : "N/A",
      transactionId: payment.stripePaymentIntentId || "N/A",
    });
  });

  // Style the header
  worksheet.getRow(1).font = { bold: true };

  return workbook;
};

const getAllPayouts = async (query: Record<string, unknown>) => {
  const payoutQuery = new QueryBuilder(
    Payout.find().populate("userId", "firstName lastName email").populate("groupId", "name").populate("turnId", "turnNumber"),
    query as Record<string, string>
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = (await payoutQuery.build().lean()) as unknown as (IPayout & { _id: string })[];
  const meta = await payoutQuery.getMeta();

  return { data, meta };
};

const resolvePayment = async (paymentId: string, adminId: string) => {
  return await withTransaction(async (session) => {
    const payment = await Payment.findById(paymentId).session(session || null);
    if (!payment) throw new AppError(httpStatus.NOT_FOUND, "Payment not found");

    if (payment.status !== PaymentStatus.MANUAL_REVIEW && payment.status !== PaymentStatus.RECOVERY_REQUIRED) {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment is not in a state that requires resolution");
    }

    if (payment.stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
      if (pi.status === "succeeded") {
        payment.status = PaymentStatus.PAID;
        payment.paidDate = new Date();
      } else {
        payment.status = PaymentStatus.FAILED;
      }
    } else {
      payment.status = PaymentStatus.FAILED;
    }

    await payment.save(session ? { session } : undefined);

    await AuditLog.create([{
      entityType: EntityType.PAYMENT,
      entityId: paymentId,
      action: AuditAction.ADMIN_ACTION,
      metadata: { 
        adminId, 
        action: "RESOLVE_PAYMENT", 
        finalStatus: payment.status,
        stripeStatus: payment.stripePaymentIntentId ? "verified" : "unknown"
      }
    }], session ? { session } : undefined);

    return payment;
  });
};

const resolveTurn = async (turnId: string, adminId: string) => {
  return await withTransaction(async (session) => {
    const turn = await Turn.findById(turnId).session(session || null);
    if (!turn) throw new AppError(httpStatus.NOT_FOUND, "Turn not found");

    if (turn.status !== TurnStatus.MANUAL_REVIEW && turn.status !== TurnStatus.RECOVERY_REQUIRED) {
      throw new AppError(httpStatus.BAD_REQUEST, "Turn is not in a state that requires resolution");
    }

    if (turn.stripeTransferId) {
      const transfer = await stripe.transfers.retrieve(turn.stripeTransferId);
      if (transfer) {
        turn.status = TurnStatus.PAID;
        turn.paidDate = new Date();
      }
    } else {
      turn.status = TurnStatus.FAILED;
    }

    await turn.save(session ? { session } : undefined);

    await AuditLog.create([{
      entityType: EntityType.TURN,
      entityId: turnId,
      action: AuditAction.ADMIN_ACTION,
      metadata: { 
        adminId, 
        action: "RESOLVE_TURN", 
        finalStatus: turn.status,
        stripeStatus: turn.stripeTransferId ? "verified" : "unknown"
      }
    }], session ? { session } : undefined);

    return turn;
  });
};

const retryPayment = async (paymentId: string, adminId: string) => {
  return await withTransaction(async (session) => {
    const payment = await Payment.findById(paymentId).session(session || null);
    if (!payment) throw new AppError(httpStatus.NOT_FOUND, "Payment not found");

    if (payment.status !== PaymentStatus.FAILED && payment.status !== PaymentStatus.LATE) {
      throw new AppError(httpStatus.BAD_REQUEST, "Only failed or late payments can be retried");
    }

    await paymentQueue.add(
      "processPayment",
      { paymentId: payment._id },
      {
        jobId: `payment_retry_${payment._id}_${Date.now()}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      }
    );

    payment.status = PaymentStatus.PROCESSING;
    await payment.save(session ? { session } : undefined);

    await AuditLog.create([{
      entityType: EntityType.PAYMENT,
      entityId: paymentId,
      action: AuditAction.PAYMENT_RETRY,
      metadata: { adminId }
    }], session ? { session } : undefined);

    return payment;
  });
};

const retryTurn = async (turnId: string, adminId: string) => {
  return await withTransaction(async (session) => {
    const turn = await Turn.findById(turnId).session(session || null);
    if (!turn) throw new AppError(httpStatus.NOT_FOUND, "Turn not found");

    if (turn.status !== TurnStatus.FAILED && turn.status !== TurnStatus.RECOVERY_REQUIRED) {
      throw new AppError(httpStatus.BAD_REQUEST, "Only failed or recovery-required turns can be retried");
    }

    await turnSchedulerQueue.add(
      "processPayout",
      { turnId: turn._id },
      {
        jobId: `payout_retry_${turn._id}_${Date.now()}`,
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
      }
    );

    turn.status = TurnStatus.PROCESSING;
    await turn.save(session ? { session } : undefined);

    await AuditLog.create([{
      entityType: EntityType.TURN,
      entityId: turnId,
      action: AuditAction.PAYOUT_RETRY,
      metadata: { adminId }
    }], session ? { session } : undefined);

    return turn;
  });
};

const retryPayout = async (payoutId: string) => {
  const payout = await Payout.findById(payoutId);
  if (!payout) {
    throw new AppError(httpStatus.NOT_FOUND, "Payout not found");
  }

  if (
    payout.status !== PayoutStatus.FAILED &&
    payout.status !== PayoutStatus.INSUFFICIENT_BALANCE
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only failed or insufficient balance payouts can be retried"
    );
  }

  const turn = await Turn.findById(payout.turnId);
  if (!turn) {
    throw new AppError(httpStatus.NOT_FOUND, "Associated turn not found");
  }

  // Atomically update turn to PROCESSING
  await Turn.findByIdAndUpdate(turn._id, { status: TurnStatus.PROCESSING });

  // Re-queue the job
  await turnSchedulerQueue.add(
    "processPayout",
    { turnId: turn._id },
    {
      jobId: `payout_retry_${turn._id}_${Date.now()}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
    }
  );

  // Update payout status to PROCESSING
  payout.status = PayoutStatus.PROCESSING;
  await payout.save();

  await logActivity(
    payout.userId.toString(),
    "PAYOUT_RETRY_INITIATED",
    `Payout retry initiated for turn ${turn.turnNumber} by Admin.`
  );

  return payout;
};

export const AdminPaymentServices = {
  getAllPayments,
  getPaymentById,
  exportPaymentsToExcel,
  getAllPayouts,
  resolvePayment,
  resolveTurn,
  retryPayment,
  retryTurn,
  retryPayout,
};
