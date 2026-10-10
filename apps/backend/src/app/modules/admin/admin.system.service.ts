import crypto from "crypto";
import httpStatus from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import {
  ActivityLog,
  type IActivityLog,
} from "../activityLog/activityLog.model";
import { Advertisement } from "../advertisement/advertisement.model";
import { AuditLog, type IAuditLog } from "../auditLog/auditLog.model";
import { GroupMember } from "../groupMember/groupMember.model";
import { MemberStatus } from "../groupMember/groupMember.interface";
import { GroupStatus } from "../group/group.interface";
import { Group } from "../group/group.model";
import {
  Notification,
  NotificationType,
} from "../notification/notification.model";
import { Payment, PaymentStatus } from "../payment/payment.model";
import { FeeType, Revenue } from "../revenue/revenue.model";
import { Settings } from "../settings/settings.model";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.model";
import { TurnStatus } from "../turn/turn.interface";
import { Turn } from "../turn/turn.model";
import { KYCStatus, Role, UserStatus } from "../user/user.interface";
import { User } from "../user/user.model";
import { logActivity } from "../../utils/activityLogger";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { sendPushNotification } from "../../utils/notification.utils";
import { withTransaction } from "../../utils/transaction.utils";

const getRecentActivities = async () => {
  return await ActivityLog.find()
    .populate("userId", "firstName lastName email profileImage")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
};

const getActivityLogs = async (query: Record<string, unknown>) => {
  const activityLogQuery = new QueryBuilder(
    ActivityLog.find().populate(
      "userId",
      "firstName lastName email profileImage"
    ),
    query as Record<string, string>
  )
    .sort()
    .paginate()
    .fields();

  const data = (await activityLogQuery
    .build()
    .lean()) as unknown as (IActivityLog & { _id: string })[];
  const meta = await activityLogQuery.getMeta();

  return { data, meta };
};

const getPendingActions = async () => {
  const [pendingKYC, latePayments, suspendedUsers] = await Promise.all([
    User.countDocuments({ kycStatus: KYCStatus.PENDING }),
    Payment.countDocuments({ status: PaymentStatus.LATE }),
    User.countDocuments({ status: UserStatus.SUSPENDED }),
  ]);

  return {
    pendingKYC,
    latePayments,
    suspendedUsers,
  };
};

const getManualReviewActions = async () => {
  const [payments, turns] = await Promise.all([
    Payment.find({ status: PaymentStatus.MANUAL_REVIEW })
      .populate("userId", "firstName lastName email")
      .populate("groupId", "name")
      .lean(),
    Turn.find({ status: TurnStatus.MANUAL_REVIEW })
      .populate("userId", "firstName lastName email")
      .populate("groupId", "name")
      .lean(),
  ]);
  return { payments, turns };
};

const getRecoveryRequiredActions = async () => {
  const [payments, turns] = await Promise.all([
    Payment.find({ status: PaymentStatus.RECOVERY_REQUIRED })
      .populate("userId", "firstName lastName email")
      .populate("groupId", "name")
      .lean(),
    Turn.find({ status: TurnStatus.RECOVERY_REQUIRED })
      .populate("userId", "firstName lastName email")
      .populate("groupId", "name")
      .lean(),
  ]);
  return { payments, turns };
};

const getAuditLogs = async (query: Record<string, unknown>) => {
  const auditLogQuery = new QueryBuilder(
    AuditLog.find(),
    query as Record<string, string>
  )
    .filter()
    .sort()
    .paginate()
    .fields();

  const data = (await auditLogQuery.build().lean()) as unknown as (IAuditLog & {
    _id: string;
  })[];
  const meta = await auditLogQuery.getMeta();

  return { data, meta };
};

const getSettings = () => Settings.findOne().lean();

const updateSettings = async (
  payload: Record<string, unknown>,
  description?: string
) => {
  return await withTransaction(async (session) => {
    const updated = await Settings.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
      session: session || undefined,
    });
    await logActivity(
      updated?._id?.toString() || "SYSTEM",
      "SETTINGS_UPDATED",
      description || "Platform settings updated by Admin.",
      session || undefined
    );
    return updated;
  });
};

const updateGeneralSettings = (payload: Record<string, unknown>) =>
  updateSettings(payload, "General settings updated by Admin.");

const updateFinancialSettings = (payload: Record<string, unknown>) =>
  updateSettings(payload, "Financial settings updated by Admin.");

const updateContributionSettings = (payload: Record<string, unknown>) =>
  updateSettings(payload, "Contribution limit settings updated by Admin.");

const updateAccessAuthSettings = (payload: Record<string, unknown>) =>
  updateSettings(
    payload,
    "Access and authentication settings updated by Admin."
  );

const updateNotificationSettings = (payload: Record<string, unknown>) =>
  updateSettings(payload, "Notification settings updated by Admin.");

const updateContactSettings = (payload: Record<string, unknown>) =>
  updateSettings(payload, "Contact channels updated by Admin.");

const sendTestPushNotification = async () => {
  const users = await User.find({
    fcmToken: { $exists: true, $ne: "" },
  }).select("fcmToken firstName lastName email");

  if (users.length === 0) {
    throw new AppError(httpStatus.NOT_FOUND, "No users found with FCM tokens");
  }

  const resultsArray = await Promise.all(
    users.map(async (user) => {
      if (user.fcmToken) {
        const result = await sendPushNotification(
          user.fcmToken,
          "Test Notification",
          `Hello ${user.fullName}, this is a test notification from the admin panel!`,
          {
            route: "/notifications",
          },
          user._id.toString()
        );
        return {
          email: user.email,
          status: result ? "Success" : "Failed",
        };
      }
      return null;
    })
  );

  const results = resultsArray.filter(Boolean);

  return {
    totalAttempted: users.length,
    results,
  };
};

const seedMockData = async () => {
  return await withTransaction(async (session) => {
    const admins = await User.find({
      role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] },
    }).session(session || null);
    if (admins.length === 0) {
      throw new Error(
        "No Admin or Super Admin found. Please create one first."
      );
    }
    const primaryAdmin = admins[0];

    const now = new Date();
    const mockUsersData = Array.from({ length: 20 }).map((_, i) => ({
      firstName: i % 2 === 0 ? "John" : "Jane",
      lastName: `[MOCK] User ${i + 1}`,
      email: `mockuser${i + 1}@poolpay.mock`,
      phone: `+123456789${i}`,
      agreeToTerms: true,
      role: Role.USER,
      status: i % 3 === 0 ? UserStatus.PENDING : UserStatus.ACTIVE,
      isVerified: true,
      isMock: true,
      createdAt:
        i < 10 ? new Date(now.getFullYear(), now.getMonth() - 1, 15) : now,
    }));

    const createdUsers = await User.insertMany(mockUsersData, { session });

    const mockGroupsData = Array.from({ length: 5 }).map((_, i) => ({
      name: `[MOCK] Savings Group ${String.fromCharCode(65 + i)}`,
      description: "This is a mock savings group for testing visuals.",
      createdBy: primaryAdmin._id,
      contributionAmount: (i + 1) * 100,
      contributionFrequency: i % 2 === 0 ? "monthly" : "weekly",
      totalMembers: 10,
      currentMembers: (i + 1) * 2,
      poolAmount: (i + 1) * 1000,
      inviteCode: `MOCK-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      status: i % 2 === 0 ? GroupStatus.UPCOMING : GroupStatus.ACTIVE,
      isMock: true,
      createdAt:
        i < 3 ? new Date(now.getFullYear(), now.getMonth() - 1, 10) : now,
    }));

    const createdGroups = await Group.insertMany(mockGroupsData, { session });

    const mockMembersData = createdUsers.map((user, i) => ({
      userId: user._id,
      groupId: createdGroups[i % createdGroups.length]._id,
      status: MemberStatus.ACTIVE,
      position: i + 1,
      joinMonth: 1,
      isMock: true,
      createdAt: user.createdAt,
    }));

    mockMembersData.push(
      {
        userId: createdUsers[0]._id,
        groupId: createdGroups[1]._id,
        status: MemberStatus.ACTIVE,
        position: 100,
        joinMonth: 1,
        isMock: true,
        createdAt: now,
      },
      {
        userId: createdUsers[1]._id,
        groupId: createdGroups[2]._id,
        status: MemberStatus.ACTIVE,
        position: 101,
        joinMonth: 1,
        isMock: true,
        createdAt: now,
      }
    );

    await GroupMember.insertMany(mockMembersData, { session });

    const mockRevenueData = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
      mockRevenueData.push(
        {
          amount: 50 + Math.random() * 100,
          feeType: FeeType.TRANSACTION_FEE,
          createdAt: monthDate,
          isMock: true,
        },
        {
          amount: 20 + Math.random() * 50,
          feeType: FeeType.LATE_FEE,
          createdAt: monthDate,
          isMock: true,
        }
      );
    }
    await Revenue.insertMany(mockRevenueData, { session });

    const mockTransactionsData = Array.from({ length: 15 }).map((_, i) => ({
      userId: createdUsers[i % createdUsers.length]._id,
      groupId: createdGroups[i % createdGroups.length]._id,
      type: i % 2 === 0 ? TransactionType.CONTRIBUTION : TransactionType.PAYOUT,
      amount: (i + 1) * 100,
      fee: 25,
      platformFee: 15,
      platformFeePercent: 5,
      stripeFee: 10,
      stripeFeePercent: 2.9,
      netAmount: (i + 1) * 100 - 25,
      status: TransactionStatus.SUCCESS,
      referenceId: `MOCK-TRX-${crypto.randomBytes(4).toString("hex")}`,
      isMock: true,
      createdAt:
        i < 5 ? new Date(now.getFullYear(), now.getMonth() - 1, 5) : now,
    }));
    await Transaction.insertMany(mockTransactionsData, { session });

    const mockLogsData = admins.flatMap((admin) =>
      Array.from({ length: 5 }).map((_, i) => ({
        userId: admin._id,
        action: "MOCK_ACTION",
        details: `[MOCK] Activity log entry ${i + 1} for ${admin.role}`,
        createdAt: new Date(Date.now() - i * 3600000),
        isMock: true,
      }))
    );
    await ActivityLog.insertMany(mockLogsData, { session });

    const mockNotificationsData = admins.flatMap((admin) =>
      Array.from({ length: 5 }).map((_, i) => ({
        userId: admin._id,
        title: `[MOCK] Notification ${i + 1}`,
        message: `This is a mock notification message for ${admin.role}.`,
        type: NotificationType.NEW_MESSAGE,
        isRead: i % 2 === 0,
        isMock: true,
      }))
    );
    await Notification.insertMany(mockNotificationsData, { session });

    const mockAdsData = [
      {
        title: "Unlock VIP Status",
        description:
          "Upgrade to VIP now and get unlimited group creation and higher pool limits!",
        bannerImage:
          "https://images.unsplash.com/photo-1579621970795-87faff2f9050?auto=format&fit=crop&q=80&w=1000",
        priority: 10,
        isActive: true,
        createdBy: primaryAdmin._id,
        isMock: true,
      },
      {
        title: "Fast Savings Tips",
        description:
          "Read our latest blog on how to reach your savings goals 20% faster.",
        bannerImage:
          "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000",
        priority: 5,
        isActive: true,
        createdBy: primaryAdmin._id,
        isMock: true,
      },
    ];
    await Advertisement.insertMany(mockAdsData, session ? { session } : {});

    return {
      users: createdUsers.length,
      groups: createdGroups.length,
      revenueRecords: mockRevenueData.length,
      members: mockMembersData.length,
      transactions: mockTransactionsData.length,
      logs: mockLogsData.length,
      notifications: mockNotificationsData.length,
      advertisements: mockAdsData.length,
    };
  });
};

const clearMockData = async () => {
  return await withTransaction(async (session) => {
    const mockNotificationTitles = [
      "Payment Due Reminder",
      "Payment Successful",
      "New Group Invitation",
      "It's Your Turn!",
      "New Group Started",
      "Payment Failure Alert",
      "Group Completion Report",
    ];

    const usersDeleted = await User.deleteMany(
      {
        $or: [
          { isMock: true },
          { lastName: { $regex: /^\[MOCK\]/i } },
          { firstName: { $regex: /^\[MOCK\]/i } },
        ],
      },
      session ? { session } : undefined
    );

    const groupsDeleted = await Group.deleteMany(
      {
        $or: [{ isMock: true }, { name: { $regex: /^\[MOCK\]/i } }],
      },
      session ? { session } : undefined
    );

    const revenueDeleted = await Revenue.deleteMany(
      { isMock: true },
      session ? { session } : undefined
    );
    const logsDeleted = await ActivityLog.deleteMany(
      { isMock: true },
      session ? { session } : undefined
    );
    const notificationsDeleted = await Notification.deleteMany(
      {
        $or: [{ isMock: true }, { title: { $in: mockNotificationTitles } }],
      },
      session ? { session } : undefined
    );

    const paymentsDeleted = await Payment.deleteMany(
      { isMock: true },
      session ? { session } : undefined
    );
    const transactionsDeleted = await Transaction.deleteMany(
      {
        $or: [{ isMock: true }, { description: { $regex: /mock/i } }],
      },
      session ? { session } : undefined
    );
    const membersDeleted = await GroupMember.deleteMany(
      { isMock: true },
      session ? { session } : undefined
    );
    const adsDeleted = await Advertisement.deleteMany(
      { isMock: true },
      session ? { session } : undefined
    );

    return {
      usersDeleted: usersDeleted.deletedCount,
      groupsDeleted: groupsDeleted.deletedCount,
      revenueDeleted: revenueDeleted.deletedCount,
      logsDeleted: logsDeleted.deletedCount,
      notificationsDeleted: notificationsDeleted.deletedCount,
      paymentsDeleted: paymentsDeleted.deletedCount,
      transactionsDeleted: transactionsDeleted.deletedCount,
      membersDeleted: membersDeleted.deletedCount,
      adsDeleted: adsDeleted.deletedCount,
    };
  });
};

export const AdminSystemServices = {
  getRecentActivities,
  getActivityLogs,
  getPendingActions,
  getManualReviewActions,
  getRecoveryRequiredActions,
  getAuditLogs,
  getSettings,
  updateSettings,
  updateGeneralSettings,
  updateFinancialSettings,
  updateContributionSettings,
  updateAccessAuthSettings,
  updateNotificationSettings,
  updateContactSettings,
  sendTestPushNotification,
  seedMockData,
  clearMockData,
};
