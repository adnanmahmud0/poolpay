import { Revenue, FeeType } from "./revenue.model";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { Transaction, TransactionType, TransactionStatus } from "../transaction/transaction.model";
import { Adjustment } from "../payout/adjustment.model";

const getRevenueStats = async (query: Record<string, string>) => {
  const revenueQuery = Revenue.find().populate("transactionId");
  const queryBuilder = new QueryBuilder(revenueQuery, query);
  
  const result = queryBuilder.filter().sort().paginate().fields();
  const data = await result.build();
  const meta = await queryBuilder.getMeta();

  // Aggregate total revenue
  const totalRevenue = await Revenue.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  // Aggregate monthly revenue (current year)
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = await Revenue.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: "$createdAt" },
        total: { $sum: "$amount" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  return {
    data,
    meta,
    stats: {
      total: totalRevenue[0]?.total || 0,
      monthly: monthlyRevenue
    }
  };
};

const getRevenueMetrics = async () => {
  const [contributionStats] = await Transaction.aggregate([
    { $match: { type: TransactionType.CONTRIBUTION, status: TransactionStatus.SUCCESS } },
    {
      $group: {
        _id: null,
        totalContribution: { $sum: "$amount" },
        platformCommission: { $sum: "$fee" },
      },
    },
  ]);

  const [payoutStats] = await Transaction.aggregate([
    { $match: { type: TransactionType.PAYOUT, status: TransactionStatus.SUCCESS } },
    { $group: { _id: null, totalPayout: { $sum: "$amount" } } },
  ]);

  const [lateFeeStats] = await Revenue.aggregate([
    { $match: { feeType: FeeType.LATE_FEE } },
    { $group: { _id: null, totalLateFees: { $sum: "$amount" } } },
  ]);

  const [redistributionStats] = await Adjustment.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, totalRedistributed: { $sum: "$amount" } } },
  ]);

  const commission = contributionStats?.platformCommission || 0;
  const lateFees = lateFeeStats?.totalLateFees || 0;
  const redistributed = redistributionStats?.totalRedistributed || 0;

  return {
    totalContribution: contributionStats?.totalContribution || 0,
    platformCommission: commission,
    lateFees: lateFees,
    redistributionAmount: redistributed,
    netPayout: payoutStats?.totalPayout || 0,
    totalRevenue: commission + (lateFees - redistributed),
  };
};

export const RevenueServices = {
  getRevenueStats,
  getRevenueMetrics,
};
