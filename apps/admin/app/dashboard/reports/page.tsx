"use client";

import { useEffect, useState } from "react";

import {
  BarChart3,
  ChevronDown,
  DollarSign,
  Download,
  Loader2,
  PieChart as PieChartIcon,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toast } from "sonner";

import { getPerformanceOverview, getRevenueMetrics } from "@/lib/api-auth";

export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [overview, setOverview] = useState<any>(null);
  const [revenueSummary, setRevenueSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overviewRes, revenueRes] = await Promise.all([
          getPerformanceOverview(),
          getRevenueMetrics()
        ]);

        if (overviewRes.success) {
          setOverview(overviewRes.data);
        }
        if (revenueRes.success) {
          setRevenueSummary(revenueRes.data);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load report data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#1A2279]" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 pb-16 sm:space-y-6">
      {/* Performance Analytics Section */}
      <div className="min-w-0 space-y-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:space-y-8 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Performance Analytics</h2>
        </div>

        {/* Chart Header */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700 sm:text-sm">Yearly Revenue Trend</h3>
            <div className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-1.5 transition-colors hover:bg-gray-100">
              <span className="text-xs font-medium text-gray-600">{selectedYear}</span>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="relative h-[240px] w-full min-w-0 sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={overview?.revenueTrend?.chartData || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A2279" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#1A2279" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10, fontWeight: 500 }}
                  tickFormatter={(value) =>
                    `$${value >= 1000 ? (value / 1000).toFixed(1) + "K" : value}`
                  }
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="animate-in fade-in zoom-in rounded-xl border border-white/10 bg-[#1A2279] p-3 text-white shadow-xl duration-200">
                          <p className="mb-1 text-[10px] font-medium opacity-60">
                            {overview?.revenueTrend?.percentChange}% Revenue
                          </p>
                          <p className="text-sm font-bold">
                            ${(payload[0].value || 0).toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1A2279"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <GrowthStatCard
            title="New Users (This Month)"
            value={overview?.userGrowth?.newUsers?.count?.toLocaleString() || "0"}
            trend={`${overview?.userGrowth?.newUsers?.percentChange >= 0 ? "↑" : "↓"} ${Math.abs(overview?.userGrowth?.newUsers?.percentChange || 0)}% from last month`}
            bgColor="bg-indigo-50/50"
            textColor="text-indigo-600"
          />
          <GrowthStatCard
            title="Active Users"
            value={overview?.userGrowth?.activeUsers?.count?.toLocaleString() || "0"}
            trend={`${overview?.userGrowth?.activeUsers?.percentChange >= 0 ? "↑" : "↓"} ${Math.abs(overview?.userGrowth?.activeUsers?.percentChange || 0)}% from last month`}
            bgColor="bg-emerald-50/50"
            textColor="text-emerald-500"
          />
          <GrowthStatCard
            title="Retention Rate"
            value={`${overview?.userGrowth?.retentionRate?.rate?.toFixed(1) || 0}%`}
            trend={`${overview?.userGrowth?.retentionRate?.percentChange >= 0 ? "↑" : "↓"} ${Math.abs(overview?.userGrowth?.retentionRate?.percentChange || 0)}% from last month`}
            bgColor="bg-purple-50/50"
            textColor="text-purple-600"
          />
        </div>

        {/* Group Performance Metrics */}
        <div className="space-y-4 border-t border-gray-50 pt-4">
          <h3 className="mb-4 text-sm font-bold text-gray-900 sm:mb-6">
            Group Performance Metrics
          </h3>
          <PerformanceBar
            label="Average Group Completion Rate"
            percentage={Math.round(overview?.groupPerformance?.averageGroupCompletionRate || 0)}
            color="bg-emerald-500"
          />
          <PerformanceBar
            label="On-Time Payment Rate"
            percentage={Math.round(overview?.groupPerformance?.onTimePaymentRate || 0)}
            color="bg-indigo-600"
          />
          <PerformanceBar
            label="Average Group Fill Rate"
            percentage={Math.round(overview?.groupPerformance?.averageGroupFillRate || 0)}
            color="bg-purple-600"
          />
        </div>
      </div>

      {/* Revenue Categorization Section */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-6 lg:p-8">
          <div className="mb-6 flex items-center gap-3 sm:mb-8">
            <PieChartIcon className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900 sm:text-lg">Revenue Categorization</h2>
          </div>

          <div className="mb-4 h-[220px] w-full min-w-0 sm:mb-6 sm:h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Regular Membership", value: revenueSummary?.regularMembership || 0 },
                    { name: "VIP Membership", value: revenueSummary?.vipMembership || 0 },
                    { name: "Platform Fees (1%)", value: revenueSummary?.platformFees || 0 }
                  ]}
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#1A2279" />
                  <Cell fill="#4F5BDB" />
                  <Cell fill="#10B981" />
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "Amount"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <LegendItem label="Regular" color="bg-[#1A2279]" />
            <LegendItem label="VIP" color="bg-[#4F5BDB]" />
            <LegendItem label="Fees" color="bg-[#10B981]" />
          </div>
        </div>

        <div className="flex min-w-0 flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-6 lg:p-8">
          <div className="space-y-6">
            <RevenueItem
              icon={<Zap className="h-4 w-4 text-indigo-600" />}
              label="Regular Membership ($5/yr)"
              value={revenueSummary?.regularMembership || 0}
              bgColor="bg-indigo-50"
            />
            <RevenueItem
              icon={<Star className="h-4 w-4 text-blue-600" />}
              label="VIP Membership ($10/yr)"
              value={revenueSummary?.vipMembership || 0}
              bgColor="bg-blue-50"
            />
            <RevenueItem
              icon={<ShieldCheck className="h-4 w-4 text-emerald-600" />}
              label="Platform Fees (1%)"
              value={revenueSummary?.platformFees || 0}
              bgColor="bg-emerald-50"
            />
          </div>

          <div className="mt-8 border-t border-gray-50 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-400">Total Revenue</span>
              <span className="text-2xl font-black text-gray-900">
                $
                {(
                  (revenueSummary?.regularMembership || 0) +
                  (revenueSummary?.vipMembership || 0) +
                  (revenueSummary?.platformFees || 0)
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Export Button */}
      {/* <div className="flex justify-end mt-8">
        <button className="bg-[#1A2279] text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-100">
          <Download className="w-4 h-4" />
          <span>Export Report</span>
        </button>
      </div> */}
    </div>
  );
}

function ReportSummaryCard({
  title,
  description,
  icon,
  bgColor
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <div className="group rounded-2xl border border-gray-100/50 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div
        className={`${bgColor} mb-4 flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110`}
      >
        {icon}
      </div>
      <h3 className="mb-2 font-bold text-gray-900">{title}</h3>
      <p className="mb-4 text-xs leading-relaxed text-gray-500">{description}</p>
      <button className="flex items-center gap-1 text-xs font-bold text-indigo-600 transition-all group-hover:underline hover:gap-2">
        Generate Report <Download className="h-3 w-3" />
      </button>
    </div>
  );
}

function GrowthStatCard({
  title,
  value,
  trend,
  bgColor,
  textColor
}: {
  title: string;
  value: string;
  trend: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-2xl border border-gray-100/50 p-6`}>
      <p className="mb-1 text-[10px] font-medium tracking-wider text-gray-500 uppercase">{title}</p>
      <h4 className={`text-2xl font-bold ${textColor} mb-1`}>{value}</h4>
      <p className={`text-[10px] ${textColor} font-medium opacity-80`}>{trend}</p>
    </div>
  );
}

function PerformanceBar({
  label,
  percentage,
  color
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-gray-900">
        <span className="opacity-70">{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`${color} h-full rounded-full transition-all duration-1000`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function LegendItem({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">{label}</span>
    </div>
  );
}

function RevenueItem({
  icon,
  label,
  value,
  bgColor
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgColor: string;
}) {
  return (
    <div className="group flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`${bgColor} rounded-xl p-3 transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">{label}</p>
          <p className="text-[10px] font-medium text-gray-400">Accumulated revenue</p>
        </div>
      </div>
      <span className="text-sm font-black text-gray-700">${value.toLocaleString()}</span>
    </div>
  );
}
