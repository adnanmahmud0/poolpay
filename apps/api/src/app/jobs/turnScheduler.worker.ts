import { Worker } from "bullmq";
import mongoose from "mongoose";
import { bullMqRedis } from "../config/ioredis.config";
import { Turn } from "../modules/turn/turn.model";
import { TurnStatus } from "../modules/turn/turn.interface";
import { Transaction, TransactionStatus, TransactionType } from "../modules/transaction/transaction.model";
import { Payout, PayoutStatus } from "../modules/payout/payout.model";
import { User } from "../modules/user/user.model";
import { UserStatus, Role } from "../modules/user/user.interface";
import { stripe } from "../config/stripe.config";
import { Group } from "../modules/group/group.model";
import { GroupMember } from "../modules/groupMember/groupMember.model";
import { Payment, PaymentStatus } from "../modules/payment/payment.model";
import { redistributionQueue } from "../queues/payment.queue";
import logger from "../utils/logger";
import { alertPayoutFailure } from "../utils/alerting";

import { 
  enqueueEmailNotification,
  sendPushNotification,
  emitRealTimeNotification
} from "../utils/notification.utils";
import { Notification, NotificationType } from "../modules/notification/notification.model";
import { Adjustment } from "../modules/payout/adjustment.model";
import { GroupStatus } from "../modules/group/group.interface";
import { MemberStatus } from "../modules/groupMember/groupMember.interface";
import { TurnServices } from "../modules/turn/turn.service";
import { Settings } from "../modules/settings/settings.model";
import { MembershipAction, validateMembershipAction } from "../modules/membership/membership.utils";
import { AuditLog, AuditAction, EntityType } from "../modules/auditLog/auditLog.model";

export const turnSchedulerWorker = new Worker(
  "turnSchedulerQueue",
  async (job) => {
    const { turnId } = job.data;
    
    const turn = await Turn.findById(turnId);
    // Security: Only process if status is PROCESSING (set by cron)
    if (!turn || turn.status !== TurnStatus.PROCESSING) {
      logger.warn(`Turn ${turnId} is not in PROCESSING state. Skipping.`);
      return;
    }

    const group = await Group.findById(turn.groupId);
    if (!group || group.isDeleted || group.status !== "active") {
      logger.error(`Group ${turn.groupId} is inactive or deleted. Payout blocked.`);
      await Turn.findByIdAndUpdate(turnId, { status: TurnStatus.FAILED });
      return;
    }

    const user = await User.findById(turn.userId);
    if (user?.status === UserStatus.SUSPENDED) {
      logger.warn(`User ${user.email} is suspended. Payout for turn ${turn._id} blocked.`);
      await Turn.findByIdAndUpdate(turnId, { status: TurnStatus.FAILED });
      return;
    }

    // KYC GATING: Ensure user's Stripe Connect status is VERIFIED before payout
    if (user?.stripeConnectStatus !== "verified") {
      logger.warn(`User ${user?.email} Stripe Connect is ${user?.stripeConnectStatus}. Payout for turn ${turn._id} moved to MANUAL_REVIEW.`);
      await Turn.findByIdAndUpdate(turnId, { status: TurnStatus.MANUAL_REVIEW });
      
      await AuditLog.create({
        entityType: EntityType.USER,
        entityId: user?._id,
        action: AuditAction.RECOVERY_REQUIRED,
        metadata: { turnId: turn._id, reason: "STRIPE_CONNECT_NOT_VERIFIED" }
      });
      return;
    }

    // Security: Contribution Validation - Ensure all required payments are PAID
    const unpaidContributions = await Payment.find({
      groupId: turn.groupId,
      userId: turn.userId,
      status: { $ne: PaymentStatus.PAID },
      dueDate: { $lte: new Date() } // Check contributions due up to now
    });

    if (unpaidContributions.length > 0) {
      logger.error(`User ${user?.email} has ${unpaidContributions.length} unpaid contributions. Payout blocked.`);
      // Move back to pending for manual review or automatic retry later
      await Turn.findByIdAndUpdate(turnId, { status: TurnStatus.PENDING }); 
      throw new Error(`Unpaid contributions found for user ${user?.email}`);
    }

    // Operational Safety: Stripe Balance Pre-check
    try {
      const balance = await stripe.balance.retrieve();
      const availableBalance = balance.available.find(b => b.currency === "usd")?.amount || 0;
      const payoutAmountCents = Math.round(turn.payoutAmount * 100);

      if (availableBalance < payoutAmountCents) {
        logger.error(`⚠️ Insufficient Stripe balance to process payout for Turn ${turn._id}. Available: ${availableBalance}, Required: ${payoutAmountCents}`);
        
        // 1. Mark payout as INSUFFICIENT_BALANCE
        await Payout.create({
          groupId: turn.groupId,
          userId: turn.userId,
          turnId: turn._id,
          amount: turn.payoutAmount,
          status: PayoutStatus.INSUFFICIENT_BALANCE,
        });

        // 2. Revert Turn to PENDING for manual/auto retry
        await Turn.findByIdAndUpdate(turnId, { status: TurnStatus.PENDING });

        // 3. Notify Admin (Once per day)
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        
        // Atomically check if we've already alerted today and update if not
        const updatedSettings = await Settings.findOneAndUpdate(
          {
            $or: [
              { lastLowBalanceAlertSentAt: { $lt: startOfDay } },
              { lastLowBalanceAlertSentAt: { $exists: false } },
              { lastLowBalanceAlertSentAt: null }
            ]
          },
          { $set: { lastLowBalanceAlertSentAt: new Date() } },
          { new: true }
        );

        if (updatedSettings) {
          const admins = await User.find({ role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } });
          
          for (const admin of admins) {
            await enqueueEmailNotification(admin.email, "⚠️ URGENT: Insufficient Stripe Balance", "adminAlert", {
              message: `Platform Stripe balance is insufficient to process payout for Turn ${turn._id}. Required: $${turn.payoutAmount}. Please top up the platform balance immediately.`,
            });
            
            await Notification.create({
              userId: admin._id,
              title: "Insufficient Stripe Balance",
              message: `Platform Stripe balance is insufficient to process payout for Turn ${turn._id}.`,
              type: NotificationType.PAYMENT_FAILED,
            });
          }
          logger.info(`[STRIPE_MONITOR] Admins alerted about insufficient balance for Turn ${turn._id}`);
        } else {
          logger.info(`[STRIPE_MONITOR] Insufficient balance for Turn ${turn._id}, but admin alert already sent today.`);
        }

        return; // Stop execution
      }
    } catch (balanceError) {
      logger.error("Failed to check Stripe balance:", balanceError);
      // If we can't check balance, it's safer to throw and retry later
      throw balanceError;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Fetch Creator and check eligibility
      const creator = await User.findById(group.createdBy);
      const isCreatorEligible = creator ? await validateMembershipAction(creator._id.toString(), MembershipAction.RECEIVE_COMMISSION) : false;
      
      // 2. Use Pre-calculated Amounts from Turn (Transparency)
      // Note: If fields are missing (old turns), fallback to 0
      const grossAmountCents = Math.round((turn.grossAmount || turn.payoutAmount) * 100);
      const platformAmountCents = Math.round((turn.feeAmount || 0) * 100);
      const creatorAmountCents = isCreatorEligible ? Math.round((turn.commissionAmount || 0) * 100) : 0;
      const memberAmountCents = grossAmountCents - platformAmountCents - creatorAmountCents;

      let memberTransferId = "";
      let creatorTransferId = "";
      
      // 3. Real Stripe Payout Implementation
      if (user?.stripeConnectedAccountId) {
        try {
          // A. Member Transfer
          const memberTransfer = await stripe.transfers.create({
            amount: memberAmountCents,
            currency: "usd",
            destination: user.stripeConnectedAccountId,
            description: `Payout (Turn ${turn.turnNumber}) in group ${turn.groupId}`,
            metadata: {
              turnId: turn._id.toString(),
              groupId: turn.groupId.toString(),
              type: "member_payout"
            },
          }, {
            idempotencyKey: `member_payout_${turn._id.toString()}`,
          });
          memberTransferId = memberTransfer.id;
          
          // Persistent update for reconciliation
          await Turn.findByIdAndUpdate(turn._id, { stripeTransferId: memberTransfer.id });
          logger.info(`✅ Member Transfer initiated: ${memberTransferId}`);

          // B. Creator Transfer (If eligible and onboarded)
          if (creatorAmountCents > 0 && creator?.stripeConnectedAccountId && creator.stripeConnectStatus === "verified") {
            try {
              const creatorTransfer = await stripe.transfers.create({
                amount: creatorAmountCents,
                currency: "usd",
                destination: creator.stripeConnectedAccountId,
                description: `Creator Commission (Turn ${turn.turnNumber}) for group ${turn.groupId}`,
                metadata: {
                  turnId: turn._id.toString(),
                  groupId: turn.groupId.toString(),
                  type: "creator_commission"
                },
              }, {
                idempotencyKey: `creator_comm_${turn._id.toString()}`,
              });
              creatorTransferId = creatorTransfer.id;
              
              // Persistent update for creator commission recovery
              await Turn.findByIdAndUpdate(turn._id, { stripeCreatorTransferId: creatorTransfer.id });
              logger.info(`✅ Creator Commission Transfer initiated: ${creatorTransferId}`);
            } catch (creatorErr) {
              logger.error(`⚠️ Creator Commission failed for ${creator.email}:`, (creatorErr as Error).message);
              // We don't fail the entire payout if commission fails, but we should log it
              await AuditLog.create({
                entityType: EntityType.USER,
                entityId: creator._id,
                action: AuditAction.RECOVERY_REQUIRED, // Custom action for manual commission recovery
                metadata: { turnId: turn._id, error: (creatorErr as Error).message }
              });
            }
          }
        } catch (stripeError) {
          const error = stripeError as Error;
          logger.error(`❌ Member Transfer failed for ${user.email}:`, error.message);
          throw error;
        }
      } else {
        throw new Error(`User ${user?.email} does not have a verified Stripe Connected Account. Payout aborted.`);
      }

      // 4. Database updates
      const transaction = await Transaction.create(
        [
          {
            userId: turn.userId,
            groupId: turn.groupId,
            type: TransactionType.PAYOUT,
            amount: turn.grossAmount || turn.payoutAmount,
            fee: 0,
            platformFee: platformAmountCents / 100,
            platformFeePercent: (turn.feeAmount / turn.grossAmount) * 100 || 1,
            creatorFee: creatorAmountCents / 100,
            creatorFeePercent: (turn.commissionAmount / turn.grossAmount) * 100 || 0,
            stripeFee: 0.25, 
            netAmount: memberAmountCents / 100,
            status: TransactionStatus.SUCCESS,
            referenceId: memberTransferId,
            metadata: { creatorTransferId }
          },
        ],
        { session }
      );

      await Payout.create(
        [
          {
            groupId: turn.groupId,
            userId: turn.userId,
            turnId: turn._id,
            amount: turn.payoutAmount,
            payoutDate: new Date(),
            status: PayoutStatus.COMPLETED,
            transactionId: transaction[0]._id,
          },
        ],
        { session }
      );

      turn.status = TurnStatus.PAID;
      turn.paidDate = new Date();
      turn.recoveryAttempts = 0;
      await turn.save({ session });

      await session.commitTransaction();
      logger.info(`✅ Payout successfully completed for turn ${turn._id}`);

      // Notify User
      const payoutTitle = "Payout Received! 💰";
      const payoutBody = `Your payout of $${turn.payoutAmount} for turn ${turn.turnNumber} in "${group.name}" has been processed and sent to your bank account.`;
      
      // Real-time
      emitRealTimeNotification(turn.userId.toString(), payoutTitle, payoutBody, { turnId: turn._id, amount: turn.payoutAmount });

      // Push
      if (user?.fcmToken) {
        await sendPushNotification(user.fcmToken, payoutTitle, payoutBody, { turnId: turn._id.toString() }, user._id.toString());
      }

      // Email
      await enqueueEmailNotification(user?.email || "", payoutTitle, "adminAlert", { message: payoutBody });

      // Internal Record
      await Notification.create([{
        userId: turn.userId,
        title: payoutTitle,
        message: payoutBody,
        type: NotificationType.PAYOUT_RECEIVED
      }]);

      // NEW: Decoupled Redistribution Logic (Jobs are added to a rate-limited queue)
      const groupMemberDoc = await GroupMember.findOne({ groupId: turn.groupId, userId: turn.userId });
      if (groupMemberDoc && groupMemberDoc.missedAmount > 0) {
        const surplusAmount = groupMemberDoc.missedAmount;
        
        const previousWinners = await Turn.find({
          groupId: turn.groupId,
          turnNumber: { $lt: turn.turnNumber },
          scheduledDate: { $lt: groupMemberDoc.createdAt || new Date() }
        });

        if (previousWinners.length > 0) {
          const bonusPerWinner = Math.floor((surplusAmount / previousWinners.length) * 100) / 100;
          
          for (const winnerTurn of previousWinners) {
            // 1. Create Adjustment Record (Tracked but pending)
            const adjustment = await Adjustment.create({
              userId: winnerTurn.userId,
              groupId: turn.groupId,
              turnId: winnerTurn._id,
              amount: bonusPerWinner,
              reason: `Surplus redistribution from late joiner (Turn ${turn.turnNumber})`,
              status: "pending",
            });

            // 2. Queue Bonus Job (Rate limited in redistributionWorker)
            await redistributionQueue.add("processBonus", {
              adjustmentId: adjustment._id,
            }, {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 1000,
              },
            });
            
            logger.info(`[SURPLUS] Bonus job queued for Winner ${winnerTurn.userId} (Turn ${winnerTurn.turnNumber})`);
          }
        }
      }

      // 3. Lifecycle Check: Should we start next cycle or complete group?
      const remainingTurns = await Turn.countDocuments({ 
        groupId: turn.groupId, 
        status: { $ne: TurnStatus.PAID } 
      });

      if (remainingTurns === 0) {
        const group = await Group.findById(turn.groupId);
        const totalGeneratedTurns = await Turn.countDocuments({ groupId: turn.groupId });
        
        // If we've generated fewer turns than (actual members * totalCycles), start next round
        if (group && totalGeneratedTurns < group.currentMembers * group.totalCycles) {
          logger.info(`[LIFECYCLE] All turns for current cycle completed. Starting next cycle for group ${group.name}...`);
          await TurnServices.generateTurnsForGroup(group._id.toString());
        } else {
          logger.info(`[LIFECYCLE] All cycles completed for group ${group?.name}. Marking as COMPLETED.`);
          if (group) {
            group.status = GroupStatus.COMPLETED;
            await group.save();
            
            // Notify all members
            const members = await GroupMember.find({ groupId: group._id, status: MemberStatus.ACTIVE });
            await Notification.insertMany(members.map(m => ({
              userId: m.userId,
              title: "Group Completed",
              message: `The savings round for "${group.name}" has been completed successfully after ${group.totalCycles} cycles.`,
              type: NotificationType.GROUP_COMPLETED
            })));

            // Real-time for all members
            for (const member of members) {
              emitRealTimeNotification(
                member.userId.toString(), 
                "Group Completed 🎉", 
                `The savings round for "${group.name}" has been completed successfully!`
              );
            }
          }
        }
      }
    } catch (error) {
      await session.abortTransaction();
      logger.error(`[PAYOUT_ERROR] Payout failed for turn ${turn._id}:`, error);
      throw error; // Let BullMQ handle retry
    } finally {
      session.endSession();
    }
  },
  { 
    connection: bullMqRedis,
    concurrency: 1,
    limiter: {
      max: 20,
      duration: 1000,
    },
    stalledInterval: 600000,
    lockDuration: 600000,
    drainDelay: 300000,
  }
);

turnSchedulerWorker.on("completed", (job) => {
  logger.info(`✅ Turn scheduler job ${job.id} completed`);
});
turnSchedulerWorker.on("failed", (job, err) => {
  logger.error(`❌ Turn scheduler job ${job?.id} failed with error: ${err.message}`);
  if (job?.data?.turnId) {
    alertPayoutFailure(job.data.turnId, err.message);
  }
});
