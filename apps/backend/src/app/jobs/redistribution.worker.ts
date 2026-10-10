import { Worker } from "bullmq";
import { bullMqRedis } from "../config/ioredis.config";
import { stripe } from "../config/stripe.config";
import {
  Adjustment,
  IAdjustmentDocument,
} from "../modules/payout/adjustment.model";
import { IUserDocument } from "../modules/user/user.interface";
import { IGroupDocument } from "../modules/group/group.interface";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../modules/transaction/transaction.model";
import logger from "../utils/logger";
import { enqueuePushNotification } from "../utils/notification.utils";

export const redistributionWorker = new Worker(
  "redistributionQueue",
  async (job) => {
    const { adjustmentId } = job.data;

    interface PopulatedAdjustment extends Omit<
      IAdjustmentDocument,
      "userId" | "groupId"
    > {
      userId: IUserDocument;
      groupId: IGroupDocument;
    }

    const adjustment = (await Adjustment.findById(adjustmentId)
      .populate("userId")
      .populate("groupId")) as unknown as PopulatedAdjustment | null;

    if (!adjustment || adjustment.status === "completed") {
      return;
    }

    const winner = adjustment.userId;
    const group = adjustment.groupId;

    if (winner && winner.stripeConnectedAccountId) {
      try {
        await stripe.transfers.create(
          {
            amount: Math.round(adjustment.amount * 100),
            currency: "usd",
            destination: winner.stripeConnectedAccountId,
            description: `Surplus bonus for group ${group.name}`,
            metadata: {
              adjustmentId: adjustment._id.toString(),
              turnId: adjustment.turnId.toString(),
            },
          },
          {
            idempotencyKey: `bonus_${adjustment._id.toString()}`,
          }
        );

        adjustment.status = "completed";

        // Create actual transaction record for the bonus
        const transaction = await Transaction.create({
          userId: winner._id,
          groupId: group._id,
          type: TransactionType.PAYOUT,
          amount: adjustment.amount,
          fee: 0,
          platformFee: 0,
          platformFeePercent: 0,
          stripeFee: 0.25,
          stripeFeePercent: 0,
          netAmount: adjustment.amount,
          status: TransactionStatus.SUCCESS,
          referenceId: `bonus_${adjustment._id.toString()}`,
        });

        adjustment.transactionId = transaction._id;
        await adjustment.save();

        // Notify Winner
        await enqueuePushNotification(
          winner._id.toString(),
          "Surplus Bonus Received! 💰",
          `You've received a bonus of $${adjustment.amount} from ${group.name} due to a late joiner redistribution.`
        );

        logger.info(
          `[SURPLUS_WORKER] Bonus $${adjustment.amount} paid to ${winner.email}`
        );
      } catch (stripeError) {
        logger.error(
          `[SURPLUS_WORKER] Failed to pay bonus to ${winner.email}:`,
          stripeError
        );
        adjustment.status = "failed";
        await adjustment.save();
        throw stripeError; // BullMQ will retry based on queue settings (3 attempts)
      }
    }
  },
  {
    connection: bullMqRedis,
    limiter: {
      max: 20,
      duration: 1000,
    },
    stalledInterval: 600000,
    lockDuration: 600000,
    drainDelay: 300000,
  }
);
