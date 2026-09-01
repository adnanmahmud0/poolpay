import { Worker } from "bullmq";
import mongoose from "mongoose";
import { stripe } from "../config/stripe.config";
import { Payment, PaymentStatus } from "../modules/payment/payment.model";
import { Turn } from "../modules/turn/turn.model";
import { TurnStatus } from "../modules/turn/turn.interface";
import { paymentQueue, turnSchedulerQueue } from "../queues/payment.queue";
import { bullMqRedis } from "../config/ioredis.config";
import logger from "../utils/logger";
import { Group } from "../modules/group/group.model";
import { GroupStatus } from "../modules/group/group.interface";
import { GroupMember } from "../modules/groupMember/groupMember.model";
import { MemberStatus } from "../modules/groupMember/groupMember.interface";
import { Settings } from "../modules/settings/settings.model";
import {
  enqueuePushNotification,
  enqueueEmailNotification,
  emitRealTimeNotification,
} from "../utils/notification.utils";
import { GroupMemberServices } from "../modules/groupMember/groupMember.service";
import { IUserDocument, Role, IUser } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import {
  Notification,
  NotificationType,
} from "../modules/notification/notification.model";
import { withLock } from "../utils/lock.utils";
import { AuditLog, AuditAction, EntityType } from "../modules/auditLog/auditLog.model";

/**
 * Shared logic for scheduler jobs
 */
export const processSchedulerJobs = async (jobName: string) => {
  if (jobName === "daily-checks") {
    await withLock("daily-checks", 3600, async () => {
      logger.info("⏰ Running daily scheduler checks...");
      const today = new Date();

      // 1. Cleanup Unverified Users (older than 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const unverifiedUsers = await User.deleteMany({
        isVerified: false,
        createdAt: { $lte: oneDayAgo },
      });
      if (unverifiedUsers.deletedCount > 0) {
        logger.info(`🧹 Cleaned up ${unverifiedUsers.deletedCount} unverified users older than 24 hours.`);
      }

      // 2. Cleanup Old Notifications
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const usersWithManyNotifications = await Notification.aggregate([
        { $group: { _id: "$userId", count: { $sum: 1 } } },
        { $match: { count: { $gt: 100 } } },
      ]);

      if (usersWithManyNotifications.length > 0) {
        const userIds = usersWithManyNotifications.map((u) => u._id);
        const deletedNotifications = await Notification.deleteMany({
          userId: { $in: userIds },
          createdAt: { $lte: sixMonthsAgo },
        });
        logger.info(`🧹 Cleaned up ${deletedNotifications.deletedCount} old notifications for users with > 100 records.`);
      }

      // 3. Trigger AutoPay for Due Payments
      const duePaymentsCursor = Payment.find({
        status: PaymentStatus.PENDING,
        dueDate: { $lte: today },
      }).cursor();

      for await (const payment of duePaymentsCursor) {
        logger.info(`[PAYMENT_FLOW] Queuing payment ${payment._id} for user ${payment.userId} due on ${payment.dueDate}`);
        await paymentQueue.add(
          "processPayment",
          { paymentId: payment._id },
          { 
            jobId: `autopay_${payment._id}_${today.toISOString().split('T')[0]}`,
            attempts: 5,
            backoff: { type: "exponential", delay: 60000 },
          }
        );
      }

      // 4. Process Turns (Payouts)
      const dueTurnsCursor = Turn.find({
        status: TurnStatus.PENDING,
        scheduledDate: { $lte: today },
      }).cursor();

      for await (const turn of dueTurnsCursor) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          const updatedTurn = await Turn.findOneAndUpdate(
            { _id: turn._id, status: TurnStatus.PENDING },
            { status: TurnStatus.PROCESSING },
            { session, new: true }
          );

          if (updatedTurn) {
            await turnSchedulerQueue.add(
              "processPayout",
              { turnId: turn._id },
              {
                jobId: `payout_${turn._id}`,
                attempts: 3,
                backoff: { type: "exponential", delay: 1000 },
              }
            );
            await session.commitTransaction();
            logger.info(`[PAYMENT_FLOW] Turn ${turn._id} marked as PROCESSING and queued.`);
          } else {
            await session.abortTransaction();
          }
        } catch (error) {
          await session.abortTransaction();
          logger.error(`[CRON_ERROR] Failed to queue payout for turn ${turn._id}:`, error);
        } finally {
          session.endSession();
        }
      }

      // 5. Daily Compliance & Failure Checks
      const unpaidPaymentsCursor = Payment.find({
        status: { $in: [PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.LATE] },
      }).populate("userId", "firstName lastName email fcmToken").cursor();

      for await (const payment of unpaidPaymentsCursor) {
        const user: IUserDocument = payment.userId as unknown as IUserDocument;
        const group = await Group.findById(payment.groupId);
        if (!group) continue;

        const diffTime = today.getTime() - payment.dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const groupMember = await GroupMember.findOne({ groupId: group._id, userId: user._id });
        if (!groupMember || groupMember.status === MemberStatus.REMOVED) continue;

        if (diffDays > 3 && !payment.lateFeeApplied) {
          const session = await mongoose.startSession();
          session.startTransaction();
          try {
            payment.lateFeeApplied = true;
            const settings = await Settings.findOne().session(session);
            const lateFeePercent = settings?.lateFeePercent || 5;
            payment.lateFee = (payment.amount * lateFeePercent) / 100;
            payment.status = PaymentStatus.LATE;
            await payment.save({ session });

            await GroupMember.findOneAndUpdate(
              { groupId: group._id, userId: user._id },
              { $inc: { missedPaymentCount: 1 } },
              { session }
            );

            await session.commitTransaction();
            
            const notification = await Notification.create({
              userId: user._id,
              title: "Late Fee Applied",
              message: `A late fee of $${payment.lateFee} has been applied to your payment for ${group.name}.`,
              type: NotificationType.PAYMENT_FAILED,
            });

            await enqueueEmailNotification(user.email, "Late Fee Applied", "lateFeeEmail", {
              name: `${user.firstName} ${user.lastName}`.trim(),
              amount: payment.amount.toString(),
              lateFee: payment.lateFee.toString(),
              groupName: group.name,
            });

            if (user.fcmToken) {
              await enqueuePushNotification(user._id.toString(), "Late Fee Applied", `A late fee has been applied to your missed payment for ${group.name}.`, {
                route: "/notifications",
                notificationId: notification._id.toString(),
              });
            }
            emitRealTimeNotification(user._id.toString(), "Late Fee Applied", `A late fee has been applied to your missed payment for ${group.name}.`);
          } catch (error) {
            await session.abortTransaction();
            logger.error(`[CRON_ERROR] Late fee failed for ${payment._id}:`, error);
          } finally {
            session.endSession();
          }
        }

        if (diffDays === 6 && !payment.removalWarningSent && groupMember.noticeStatus === "NONE") {
          payment.removalWarningSent = true;
          await payment.save();

          const notification = await Notification.create({
            userId: user._id,
            title: "Final Warning: Account Removal",
            message: `You will be removed from ${group.name} in 24 hours due to non-payment.`,
            type: NotificationType.PAYMENT_DUE,
          });

          await enqueueEmailNotification(user.email, "FINAL WARNING: Removal in 24 Hours", "removalWarningEmail", {
            name: `${user.firstName} ${user.lastName}`.trim(),
            groupName: group.name,
            deadline: new Date(today.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString(),
          });

          if (user.fcmToken) {
            await enqueuePushNotification(user._id.toString(), "Final Warning: Account Removal", `You will be removed from ${group.name} in 24 hours if payment is not completed.`, {
              route: "/notifications",
              notificationId: notification._id.toString(),
            });
          }
          emitRealTimeNotification(user._id.toString(), "Final Warning: Account Removal", `You will be removed from ${group.name} in 24 hours if payment is not completed.`);
        }

        if (diffDays >= 7 && groupMember.noticeStatus === "NONE") {
          await GroupMemberServices.removeMember(groupMember._id.toString(), "Automatic removal due to non-payment for 7 days", group.createdBy.toString());
        }

        const alreadySentToday = payment.lastReminderSentAt && payment.lastReminderSentAt.toDateString() === today.toDateString();
        const dueDateTime = payment.dueDate.getHours() * 60 + payment.dueDate.getMinutes();
        const currentTime = today.getHours() * 60 + today.getMinutes();
        const isTimeReached = currentTime >= dueDateTime;

        if (!alreadySentToday && isTimeReached && [0, 3, 5].includes(diffDays)) {
          const notification = await Notification.create({
            userId: user._id,
            title: "Payment Reminder",
            message: `Don't forget to pay $${payment.amount} for ${group.name} by ${payment.dueDate.toLocaleDateString()}.`,
            type: NotificationType.PAYMENT_DUE,
          });

          await enqueueEmailNotification(user.email, "Payment Reminder", "paymentReminderEmail", {
            name: `${user.firstName} ${user.lastName}`.trim(),
            amount: payment.amount.toString(),
            groupName: group.name,
            deadline: payment.dueDate.toLocaleDateString(),
          });

          if (user.fcmToken) {
            await enqueuePushNotification(user._id.toString(), "Payment Reminder", `Don't forget to complete your contribution for ${group.name}.`, {
              route: "/notifications",
              notificationId: notification._id.toString(),
            });
          }
          emitRealTimeNotification(user._id.toString(), "Payment Reminder", `Don't forget to complete your contribution for ${group.name}.`);

          payment.lastReminderSentAt = today;
          await payment.save();
        }
      }

      // 6. Group Start Date Monitoring
      const pendingGroupsCursor = Group.find({
        status: GroupStatus.UPCOMING,
        startDate: { $lte: today },
        isDeleted: false,
        lastStartReminderSentAt: { $exists: false }
      }).populate("createdBy", "firstName lastName email fcmToken").cursor();

      for await (const group of pendingGroupsCursor) {
        if (group.currentMembers < group.totalMembers) {
          const creator = group.createdBy as unknown as IUser;
          if (creator._id) {
            const creatorId = creator._id.toString();
            const members = await GroupMember.find({ groupId: group._id }).populate("userId", "firstName lastName email fcmToken");
            const admins = await User.find({ role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } });

            const message = `The group "${group.name}" was scheduled to start on ${group.startDate?.toLocaleDateString()}, but it has not reached the required member count (${group.currentMembers}/${group.totalMembers}). Please invite more members or start it manually when ready.`;

            await Notification.create({ userId: creator._id, title: "Group Start Delayed", message, type: NotificationType.PAYMENT_DUE });
            await enqueueEmailNotification(creator.email, "Action Required: Group Start Delayed", "adminAlert", { message });
            
            if (creator.fcmToken) {
              await enqueuePushNotification(creatorId, "Group Start Delayed", message, { route: "/groups", groupId: group._id.toString() });
            }
            emitRealTimeNotification(creatorId, "Group Start Delayed", message);

            for (const admin of admins) {
              if (admin._id.toString() !== creatorId) {
                await Notification.create({ userId: admin._id, title: "Incomplete Group Alert", message, type: NotificationType.PAYMENT_FAILED });
                await enqueueEmailNotification(admin.email, "System Alert: Incomplete Group Start Date", "adminAlert", { message });
                if (admin.fcmToken) {
                  await enqueuePushNotification(admin._id.toString(), "Incomplete Group Alert", message, { route: "/groups", groupId: group._id.toString() });
                }
                emitRealTimeNotification(admin._id.toString(), "Incomplete Group Alert", message);
              }
            }

            for (const member of members) {
              const memberUser = member.userId as unknown as IUserDocument;
              if (memberUser._id.toString() !== creatorId) {
                const memberMsg = `The group "${group.name}" start date has arrived, but more members are needed to begin. The creator has been notified.`;
                await Notification.create({ userId: memberUser._id, title: "Group Start Update", message: memberMsg, type: NotificationType.PAYMENT_DUE });
                if (memberUser.fcmToken) {
                  await enqueuePushNotification(memberUser._id.toString(), "Group Start Update", memberMsg, { route: "/groups", groupId: group._id.toString() });
                }
                emitRealTimeNotification(memberUser._id.toString(), "Group Start Update", memberMsg);
              }
            }
          }
          group.lastStartReminderSentAt = today;
          await group.save();
        }
      }

      // 7. Expired Mobile Membership Downgrades
      logger.info("⏰ Running automatic expired mobile membership checks...");
      const expiredMobileUsers = await User.find({
        membershipProvider: { $in: ["google_play", "apple_store"] },
        subscriptionExpiry: { $lte: today },
        membershipTier: { $ne: "guest" },
      });

      if (expiredMobileUsers.length > 0) {
        logger.info(`🔄 Found ${expiredMobileUsers.length} expired mobile memberships to downgrade.`);
        for (const user of expiredMobileUsers) {
          const session = await mongoose.startSession();
          session.startTransaction();
          try {
            const oldTier = user.membershipTier;
            user.membershipTier = "guest";
            user.subscriptionStatus = "expired";
            user.autoRenewEnabled = false;
            await user.save({ session });

            await AuditLog.create([{
              entityType: EntityType.USER,
              entityId: user._id,
              action: AuditAction.MEMBERSHIP_CANCEL,
              metadata: { reason: "Expired (Daily Scheduler)", provider: user.membershipProvider }
            }], { session });

            await session.commitTransaction();

            // Notifications
            const title = "Membership Expired";
            const body = `Your ${oldTier.toUpperCase()} membership has expired. Your account has been returned to GUEST status.`;

            try {
              const { emitRealTimeNotification, sendPushNotification, enqueueEmailNotification } = await import("../utils/notification.utils");
              emitRealTimeNotification(user._id.toString(), title, body);
              if (user.fcmToken) {
                await sendPushNotification(user.fcmToken, title, body, { type: "membership_expired" }, user._id.toString());
              }
              await enqueueEmailNotification(user.email, title, "adminAlert", { message: body });
              
              await Notification.create([{
                userId: user._id,
                title,
                message: body,
                type: NotificationType.PAYMENT_FAILED
              }]);
            } catch (notifyErr) {
              logger.error(`❌ Failed to send notifications for user ${user._id}:`, notifyErr);
            }
          } catch (err) {
            await session.abortTransaction();
            logger.error(`❌ Failed to downgrade expired mobile membership for user ${user._id}:`, err);
          } finally {
            session.endSession();
          }
        }
      }

      logger.info(`✅ Daily checks completed.`);
    });
  }

  if (jobName === "stripe-monitoring") {
    await withLock("stripe-monitoring", 3600, async () => {
      try {
        const balance = await stripe.balance.retrieve();
        const availableBalance = balance.available.find((b) => b.currency === "usd")?.amount || 0;
        const systemSettings = await Settings.findOne();
        const thresholdCents = (systemSettings?.minimumStripeBalance || 500) * 100;

        if (availableBalance < thresholdCents) {
          const today = new Date();
          const startOfDay = new Date(today.setHours(0, 0, 0, 0));
          const updatedSettings = await Settings.findOneAndUpdate(
            { $or: [{ lastLowBalanceAlertSentAt: { $lt: startOfDay } }, { lastLowBalanceAlertSentAt: { $exists: false } }, { lastLowBalanceAlertSentAt: null }] },
            { $set: { lastLowBalanceAlertSentAt: new Date() } },
            { new: true }
          );

          if (updatedSettings) {
            const admins = await User.find({ role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } });
            for (const admin of admins) {
              await enqueueEmailNotification(admin.email, "⚠️ ACTION REQUIRED: Low Stripe Balance", "adminAlert", { message: `Balance: $${availableBalance / 100}` });
              await Notification.create({ userId: admin._id, title: "Low Stripe Balance", message: `Balance: $${availableBalance / 100}`, type: NotificationType.PAYMENT_FAILED });
              
              if (admin.fcmToken) {
                await enqueuePushNotification(admin._id.toString(), "Low Stripe Balance", `Balance: $${availableBalance / 100}`);
              }
              emitRealTimeNotification(admin._id.toString(), "Low Stripe Balance", `Balance: $${availableBalance / 100}`);
            }
          }
        }
      } catch (error) {
        logger.error("❌ Stripe monitoring failed:", error);
      }
    });
  }
};

export const schedulerWorker = new Worker(
  "schedulerQueue",
  async (job) => {
    await processSchedulerJobs(job.name);
  },
  { 
    connection: bullMqRedis, 
    concurrency: 5,
    stalledInterval: 600000,
    lockDuration: 600000,
    drainDelay: 60000,
  }
);

schedulerWorker.on("completed", (job) => {
  logger.info(`✅ Scheduler job ${job.name} (${job.id}) completed successfully.`);
});

schedulerWorker.on("failed", (job, err) => {
  logger.error(`❌ Scheduler job ${job?.name} (${job?.id}) failed with error: ${err.message}`);
});
