import { GroupMember } from "../groupMember/groupMember.model";
import { MemberStatus } from "../groupMember/groupMember.interface";
import { type IGroup } from "../group/group.interface";
import { Group } from "../group/group.model";
import { Payment, PaymentStatus } from "../payment/payment.model";
import { Revenue } from "../revenue/revenue.model";
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from "../transaction/transaction.model";
import { Role, UserStatus, type IUser } from "../user/user.interface";
import { User } from "../user/user.model";
import { QueryBuilder } from "../../utils/QueryBuilder";

const getDashboardSummary = async () => {
  const [
    totalUsers,
    totalGroups,
    totalRevenue,
    totalPayouts,
    activeMembers,
    totalPhoneConflicts,
  ] = await Promise.all([
    User.countDocuments(),
    Group.countDocuments({ isDeleted: { $ne: true } }),
    Revenue.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]),
    Transaction.aggregate([
      {
        $match: {
          type: TransactionType.PAYOUT,
          status: TransactionStatus.SUCCESS,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    GroupMember.aggregate([
      { $match: { status: MemberStatus.ACTIVE } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $match: { "userDoc.0": { $exists: true } } },
      { $group: { _id: "$userId" } },
      { $count: "total" },
    ]),
    User.countDocuments({ phoneConflict: true }),
  ]);

  return {
    totalUsers,
    totalGroups,
    totalRevenue: totalRevenue[0]?.total || 0,
    totalPayouts: totalPayouts[0]?.total || 0,
    activeMembers: activeMembers[0]?.total || 0,
    totalPhoneConflicts,
  };
};

const getRevenueChart = async () => {
  const currentYear = new Date().getFullYear();
  const revenueData = await Revenue.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        revenue: { $sum: "$amount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return monthNames.map((month, index) => {
    const found = revenueData.find((d) => d._id === index + 1);
    return {
      month,
      revenue: found ? found.revenue : 0,
    };
  });
};

const getUserGrowth = async () => {
  const currentYear = new Date().getFullYear();
  const [growthData, stats] = await Promise.all([
    User.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const chartData = monthNames.map((month, index) => {
    const found = growthData.find((d) => d._id === index + 1);
    return {
      month,
      userCount: found ? found.count : 0,
    };
  });

  const statusStats = {
    active: stats.find((s) => s._id === UserStatus.ACTIVE)?.count || 0,
    pending: stats.find((s) => s._id === UserStatus.PENDING)?.count || 0,
    blocked:
      (stats.find((s) => s._id === UserStatus.BLOCKED)?.count || 0) +
      (stats.find((s) => s._id === UserStatus.SUSPENDED)?.count || 0),
  };

  return { chartData, stats: statusStats };
};

const getUserStats = async () => {
  return await User.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

const getGroupStats = async () => {
  return await Group.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalPool: { $sum: "$poolAmount" },
      },
    },
  ]);
};

const getFundsSummary = async () => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  );
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalFunds,
    totalDisbursed,
    totalPending,
    totalPendingCount,
    lastMonthFunds,
    monthlyInflow,
    totalContributions,
    totalGroupsWithMembers,
  ] = await Promise.all([
    // Total successful transactions (volume)
    Transaction.aggregate([
      { $match: { status: TransactionStatus.SUCCESS } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Total successful payouts
    Transaction.aggregate([
      {
        $match: {
          type: TransactionType.PAYOUT,
          status: TransactionStatus.SUCCESS,
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Total pending payments
    Payment.aggregate([
      { $match: { status: PaymentStatus.PENDING } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.countDocuments({ status: PaymentStatus.PENDING }),
    // Last month's successful transactions for percentage change
    Transaction.aggregate([
      {
        $match: {
          status: TransactionStatus.SUCCESS,
          createdAt: { $gte: firstDayOfLastMonth, $lte: lastDayOfLastMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // Current month's successful contributions
    Transaction.aggregate([
      {
        $match: {
          type: TransactionType.CONTRIBUTION,
          status: TransactionStatus.SUCCESS,
          createdAt: { $gte: firstDayOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    // For average contribution rate
    Transaction.countDocuments({
      type: TransactionType.CONTRIBUTION,
      status: TransactionStatus.SUCCESS,
    }),
    Group.countDocuments({ currentMembers: { $gt: 0 } }),
  ]);

  const currentTotalFunds = totalFunds[0]?.total || 0;
  const previousTotalFunds = lastMonthFunds[0]?.total || 0;
  let fundsChangePercent = 0;
  if (previousTotalFunds > 0) {
    fundsChangePercent =
      ((currentTotalFunds - previousTotalFunds) / previousTotalFunds) * 100;
  }

  return {
    totalFunds: currentTotalFunds,
    fundsChangePercent: Number(fundsChangePercent.toFixed(2)),
    totalDisbursed: totalDisbursed[0]?.total || 0,
    totalPending: totalPending[0]?.total || 0,
    totalPendingCount,
    monthlyInflow: monthlyInflow[0]?.total || 0,
    averageContributionRate:
      totalGroupsWithMembers > 0
        ? Number((totalContributions / totalGroupsWithMembers).toFixed(2))
        : 0,
  };
};

const getGroupFundDetails = async (query: Record<string, unknown>) => {
  const groupQuery = new QueryBuilder(
    Group.find({ isDeleted: { $ne: true } }).populate(
      "createdBy",
      "firstName lastName"
    ),
    query as Record<string, string>
  )
    .sort()
    .paginate()
    .fields();

  const groups = (await groupQuery.build().lean()) as unknown as (IGroup & {
    _id: string;
  })[];
  const meta = await groupQuery.getMeta();

  const data = await Promise.all(
    groups.map(async (group) => {
      const [distributed] = await Transaction.aggregate([
        {
          $match: {
            groupId: group._id,
            type: TransactionType.PAYOUT,
            status: TransactionStatus.SUCCESS,
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      return {
        _id: group._id,
        name: group.name,
        adminName: (group.createdBy as unknown as IUser)?.firstName
          ? `${(group.createdBy as unknown as IUser).firstName} ${
              (group.createdBy as unknown as IUser).lastName
            }`
          : "N/A",
        contributionAmount: group.contributionAmount,
        contributionFrequency: group.contributionFrequency,
        currentMembers: group.currentMembers,
        totalMembers: group.totalMembers,
        totalPool: group.poolAmount,
        distributed: distributed?.total || 0,
        status: group.status,
      };
    })
  );

  return { data, meta };
};

const getPerformanceAnalytics = async () => {
  const [
    totalGroups,
    completedGroups,
    onTimePayments,
    totalPayments,
    totalPossibleMembers,
    currentMembers,
  ] = await Promise.all([
    Group.countDocuments({ isDeleted: { $ne: true } }),
    Group.countDocuments({ status: "completed", isDeleted: { $ne: true } }),
    Payment.countDocuments({
      status: PaymentStatus.PAID,
      $expr: { $lte: ["$paidDate", "$dueDate"] },
    }),
    Payment.countDocuments({ status: PaymentStatus.PAID }),
    Group.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$totalMembers" } } },
    ]),
    Group.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: null, total: { $sum: "$currentMembers" } } },
    ]),
  ]);

  // Retention Rate: (Users with > 1 group) / Total Users
  const retentionStats = await GroupMember.aggregate([
    { $group: { _id: "$userId", groupCount: { $sum: 1 } } },
    { $match: { groupCount: { $gt: 1 } } },
    { $count: "retentionCount" },
  ]);
  const totalUsers = await User.countDocuments({ role: Role.USER });

  return {
    averageGroupCompletionRate:
      totalGroups > 0 ? (completedGroups / totalGroups) * 100 : 0,
    onTimePaymentRate:
      totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 0,
    averageGroupFillRate:
      totalPossibleMembers[0]?.total > 0
        ? (currentMembers[0]?.total / totalPossibleMembers[0]?.total) * 100
        : 0,
    retentionRate:
      totalUsers > 0
        ? ((retentionStats[0]?.retentionCount || 0) / totalUsers) * 100
        : 0,
  };
};

const getFinancialReport = async () => {
  return await Transaction.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          type: "$type",
        },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
  ]);
};

const calculatePercentChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const getRetentionRateAtDate = async (date: Date) => {
  const stats = await GroupMember.aggregate([
    { $match: { createdAt: { $lte: date } } },
    { $group: { _id: "$userId", groupCount: { $sum: 1 } } },
    { $match: { groupCount: { $gt: 1 } } },
    { $count: "count" },
  ]);
  const totalUsers = await User.countDocuments({
    role: Role.USER,
    createdAt: { $lte: date },
  });
  return totalUsers > 0 ? ((stats[0]?.count || 0) / totalUsers) * 100 : 0;
};

const getPerformanceReports = async () => {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59
  );

  const [
    revThisMonth,
    revLastMonth,
    usersThisMonth,
    usersLastMonth,
    activeNow,
    activeLastMonth,
    retNow,
    retLastMonth,
    performance,
    chartData,
  ] = await Promise.all([
    Revenue.aggregate([
      { $match: { createdAt: { $gte: startOfCurrentMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Revenue.aggregate([
      {
        $match: { createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    User.countDocuments({
      createdAt: { $gte: startOfCurrentMonth },
      role: Role.USER,
    }),
    User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      role: Role.USER,
    }),
    User.countDocuments({ status: UserStatus.ACTIVE, role: Role.USER }),
    User.countDocuments({
      status: UserStatus.ACTIVE,
      role: Role.USER,
      createdAt: { $lte: endOfLastMonth },
    }),
    getRetentionRateAtDate(now),
    getRetentionRateAtDate(endOfLastMonth),
    getPerformanceAnalytics(),
    getRevenueChart(),
  ]);

  const revTotalThisMonth = revThisMonth[0]?.total || 0;
  const revTotalLastMonth = revLastMonth[0]?.total || 0;
  const revChange = calculatePercentChange(
    revTotalThisMonth,
    revTotalLastMonth
  );

  const usersChange = calculatePercentChange(usersThisMonth, usersLastMonth);
  const activeChange = calculatePercentChange(activeNow, activeLastMonth);
  const retentionChange = calculatePercentChange(retNow, retLastMonth);

  return {
    revenueTrend: {
      totalRevenue: Number(revTotalThisMonth.toFixed(2)),
      percentChange: revChange,
      chartData,
    },
    userGrowth: {
      newUsers: {
        count: usersThisMonth,
        percentChange: usersChange,
      },
      activeUsers: {
        count: activeNow,
        percentChange: activeChange,
      },
      retentionRate: {
        rate: Number(retNow.toFixed(2)),
        percentChange: retentionChange,
      },
    },
    groupPerformance: performance,
  };
};

export const AdminAnalyticsServices = {
  getDashboardSummary,
  getRevenueChart,
  getUserGrowth,
  getUserStats,
  getGroupStats,
  getFundsSummary,
  getGroupFundDetails,
  getPerformanceAnalytics,
  getFinancialReport,
  getPerformanceReports,
};
