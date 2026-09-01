"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  DollarSign,
  ChevronDown,
  TrendingUp,
  Loader2,
  PieChart as PieChartIcon,
  Zap,
  Star,
  ShieldCheck,
  Download
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { getPerformanceOverview, getRevenueMetrics } from "@/lib/api-auth";
import { toast } from "sonner";

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
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1A2279] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Report Type Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ReportSummaryCard 
          title="Financial Report"
          description="Comprehensive overview of all transactions, contributions, and fund distributions"
          icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
          bgColor="bg-indigo-50"
        />
        <ReportSummaryCard 
          title="User Activity Report"
          description="Detailed analysis of user engagement, registrations, and activity patterns"
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          bgColor="bg-emerald-50"
        />
        <ReportSummaryCard 
          title="Fund Distribution Report"
          description="Track fund allocation, distribution cycles, and group performance metrics"
          icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
          bgColor="bg-purple-50"
        />
      </div> */}

      {/* Performance Analytics Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/50 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Performance Analytics</h2>
        </div>

        {/* Chart Header */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Yearly Revenue Trend</h3>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="text-xs font-medium text-gray-600">{selectedYear}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview?.revenueTrend?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                  tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'K' : value}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#1A2279] p-3 rounded-xl shadow-xl border border-white/10 text-white animate-in fade-in zoom-in duration-200">
                          <p className="text-[10px] opacity-60 font-medium mb-1">{overview?.revenueTrend?.percentChange}% Revenue</p>
                          <p className="text-sm font-bold">${(payload[0].value || 0).toLocaleString()}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GrowthStatCard
            title="New Users (This Month)"
            value={overview?.userGrowth?.newUsers?.count?.toLocaleString() || "0"}
            trend={`${overview?.userGrowth?.newUsers?.percentChange >= 0 ? '↑' : '↓'} ${Math.abs(overview?.userGrowth?.newUsers?.percentChange || 0)}% from last month`}
            bgColor="bg-indigo-50/50"
            textColor="text-indigo-600"
          />
          <GrowthStatCard
            title="Active Users"
            value={overview?.userGrowth?.activeUsers?.count?.toLocaleString() || "0"}
            trend={`${overview?.userGrowth?.activeUsers?.percentChange >= 0 ? '↑' : '↓'} ${Math.abs(overview?.userGrowth?.activeUsers?.percentChange || 0)}% from last month`}
            bgColor="bg-emerald-50/50"
            textColor="text-emerald-500"
          />
          <GrowthStatCard
            title="Retention Rate"
            value={`${overview?.userGrowth?.retentionRate?.rate?.toFixed(1) || 0}%`}
            trend={`${overview?.userGrowth?.retentionRate?.percentChange >= 0 ? '↑' : '↓'} ${Math.abs(overview?.userGrowth?.retentionRate?.percentChange || 0)}% from last month`}
            bgColor="bg-purple-50/50"
            textColor="text-purple-600"
          />
        </div>

        {/* Group Performance Metrics */}
        <div className="space-y-4 pt-4 border-t border-gray-50">
          <h3 className="text-sm font-bold text-gray-900 mb-6">Group Performance Metrics</h3>
          <PerformanceBar label="Average Group Completion Rate" percentage={Math.round(overview?.groupPerformance?.averageGroupCompletionRate || 0)} color="bg-emerald-500" />
          <PerformanceBar label="On-Time Payment Rate" percentage={Math.round(overview?.groupPerformance?.onTimePaymentRate || 0)} color="bg-indigo-600" />
          <PerformanceBar label="Average Group Fill Rate" percentage={Math.round(overview?.groupPerformance?.averageGroupFillRate || 0)} color="bg-purple-600" />
        </div>
      </div>

      {/* Revenue Categorization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/50">
          <div className="flex items-center gap-3 mb-8">
            <PieChartIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Revenue Categorization</h2>
          </div>
          
          <div className="h-[250px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Regular Membership', value: revenueSummary?.regularMembership || 0 },
                    { name: 'VIP Membership', value: revenueSummary?.vipMembership || 0 },
                    { name: 'Platform Fees (1%)', value: revenueSummary?.platformFees || 0 },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#1A2279" />
                  <Cell fill="#4F5BDB" />
                  <Cell fill="#10B981" />
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Amount']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
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

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
          <div className="space-y-6">
            <RevenueItem 
              icon={<Zap className="w-4 h-4 text-indigo-600" />}
              label="Regular Membership ($5/yr)"
              value={revenueSummary?.regularMembership || 0}
              bgColor="bg-indigo-50"
            />
            <RevenueItem 
              icon={<Star className="w-4 h-4 text-blue-600" />}
              label="VIP Membership ($10/yr)"
              value={revenueSummary?.vipMembership || 0}
              bgColor="bg-blue-50"
            />
            <RevenueItem 
              icon={<ShieldCheck className="w-4 h-4 text-emerald-600" />}
              label="Platform Fees (1%)"
              value={revenueSummary?.platformFees || 0}
              bgColor="bg-emerald-50"
            />
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-400">Total Revenue</span>
              <span className="text-2xl font-black text-gray-900">${((revenueSummary?.regularMembership || 0) + (revenueSummary?.vipMembership || 0) + (revenueSummary?.platformFees || 0)).toLocaleString()}</span>
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

function ReportSummaryCard({ title, description, icon, bgColor }: { title: string; description: string; icon: React.ReactNode; bgColor: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50 group hover:shadow-md transition-all">
      <div className={`${bgColor} w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{description}</p>
      <button className="text-xs font-bold text-indigo-600 flex items-center gap-1 hover:gap-2 transition-all group-hover:underline">
        Generate Report <Download className="w-3 h-3" />
      </button>
    </div>
  );
}

function GrowthStatCard({ title, value, trend, bgColor, textColor }: { title: string; value: string; trend: string; bgColor: string; textColor: string }) {
  return (
    <div className={`${bgColor} p-6 rounded-2xl border border-gray-100/50`}>
      <p className="text-gray-500 text-[10px] font-medium mb-1 uppercase tracking-wider">{title}</p>
      <h4 className={`text-2xl font-bold ${textColor} mb-1`}>{value}</h4>
      <p className={`text-[10px] ${textColor} opacity-80 font-medium`}>{trend}</p>
    </div>
  );
}

function PerformanceBar({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs font-bold text-gray-900">
        <span className="opacity-70">{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
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
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function RevenueItem({ icon, label, value, bgColor }: { icon: React.ReactNode; label: string; value: number; bgColor: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className={`${bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-gray-900">{label}</p>
          <p className="text-[10px] text-gray-400 font-medium">Accumulated revenue</p>
        </div>
      </div>
      <span className="text-sm font-black text-gray-700">${value.toLocaleString()}</span>
    </div>
  );
}

