"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Clock,
  Component,
  DollarSign,
  Loader2,
  PlayCircle,
  Plus,
  Search,
  UserCheck,
  Users
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { toast } from "sonner";

import {
  getDashboardSummary,
  getRecentActivities,
  getRevenueChartData,
  getUserGrowth,
  getUsers
} from "@/lib/api-auth";

interface User {
  _id: string;
  fullName: string;
  email: string;
  status: string;
}

interface Activity {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    profileImage?: string;
  };
  action: string;
  details: string;
  createdAt: string;
}

interface SummaryData {
  totalUsers: number;
  totalGroups: number;
  totalRevenue: number;
  totalPayouts: number;
  activeMembers: number;
}

interface GrowthStats {
  active: number;
  pending: number;
  blocked: number;
}

interface RevenueData {
  month: string;
  revenue: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [growthStats, setGrowthStats] = useState<GrowthStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, usersRes, activitiesRes, growthRes, revenueRes] = await Promise.all([
          getDashboardSummary(),
          getUsers({ limit: 4 }),
          getRecentActivities(),
          getUserGrowth(),
          getRevenueChartData()
        ]);

        if (summaryRes.success) {
          setSummary(summaryRes.data);
        }
        if (usersRes.success) {
          const rawUsers = Array.isArray(usersRes.data?.data)
            ? usersRes.data.data
            : Array.isArray(usersRes.data)
              ? usersRes.data
              : [];
          const flattenedRecentUsers = rawUsers.map((item: any, idx: number) => {
            const userObj = item._doc || item;
            return {
              ...userObj,
              _id: userObj._id || userObj.id || item._id || item.id || `user-${idx}`,
              fullName:
                item.fullName ||
                userObj.fullName ||
                `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() ||
                userObj.email ||
                "User"
            };
          });
          setRecentUsers(flattenedRecentUsers);
        }
        if (activitiesRes.success) {
          setActivities(activitiesRes.data.slice(0, 4));
        }
        if (growthRes.success) {
          setGrowthStats(growthRes.data.stats);
        }
        if (revenueRes.success) {
          setRevenueData(revenueRes.data);
        }
      } catch (error: any) {
        console.error("Dashboard data fetch error:", error);
        toast.error(error.response?.data?.message || "Failed to load dashboard data");
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
    <div className="mx-auto w-full min-w-0 space-y-4 sm:space-y-6">
      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        {/* Card 1: Users */}
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-xl bg-indigo-50 p-2.5">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500 sm:text-sm">Total Users</p>
            <h3 className="mb-1 text-xl font-semibold text-gray-900 sm:mb-2 sm:text-2xl">
              {summary?.totalUsers || 0}
            </h3>
            <p className="text-xs text-gray-400">{summary?.activeMembers || 0} active members</p>
          </div>
        </div>

        {/* Card 2: Groups */}
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <Component className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500 sm:text-sm">Total Groups</p>
            <h3 className="mb-1 text-xl font-semibold text-gray-900 sm:mb-2 sm:text-2xl">
              {summary?.totalGroups || 0}
            </h3>
            <p className="text-xs text-gray-400">Manage all groups</p>
          </div>
        </div>

        {/* Card 3: Revenue */}
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-xl bg-blue-50 p-2.5">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500 sm:text-sm">Total Revenue</p>
            <h3 className="mb-1 text-xl font-semibold text-gray-900 sm:mb-2 sm:text-2xl">
              ${summary?.totalRevenue?.toLocaleString() || 0}
            </h3>
            <p className="text-xs text-gray-400">Total earnings</p>
          </div>
        </div>

        {/* Card 4: Payouts */}
        <div className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-5">
          <div className="mb-4 flex items-start justify-between">
            <div className="rounded-xl bg-orange-50 p-2.5">
              <Clock className="h-5 w-5 text-orange-500" />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500 sm:text-sm">Total Payouts</p>
            <h3 className="mb-1 text-xl font-semibold text-gray-900 sm:mb-2 sm:text-2xl">
              ${summary?.totalPayouts?.toLocaleString() || 0}
            </h3>
            <p className="text-xs text-gray-400">Total distributions</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid (Charts & Lists) */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Monthly Revenue Chart */}
        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-6 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between sm:mb-6">
            <div>
              <p className="mb-1 text-xs font-medium text-gray-500 sm:text-sm">Monthly Revenue</p>
            </div>
          </div>

          <div className="h-[220px] w-full min-w-0 sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A227F" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1A227F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                  labelStyle={{ display: "none" }}
                  itemStyle={{ color: "#111827", fontWeight: 600 }}
                  formatter={(value: any) => [`$${value?.toLocaleString()}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1A227F"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Growth Column */}
        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-6">
          <div className="mb-6 flex items-center justify-between sm:mb-8">
            <h3 className="text-sm font-semibold text-gray-900 sm:text-base">User Growth</h3>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="mb-2 flex justify-between text-xs sm:text-sm">
                <span className="font-medium text-gray-500">Active Users</span>
                <span className="font-semibold text-gray-900">{growthStats?.active || 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${summary?.totalUsers ? ((growthStats?.active || 0) / summary.totalUsers) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs sm:text-sm">
                <span className="font-medium text-gray-500">Pending Users</span>
                <span className="font-semibold text-gray-900">{growthStats?.pending || 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-orange-400 transition-all duration-500"
                  style={{
                    width: `${summary?.totalUsers ? ((growthStats?.pending || 0) / summary.totalUsers) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs sm:text-sm">
                <span className="font-medium text-gray-500">Suspended Users</span>
                <span className="font-semibold text-gray-900">{growthStats?.blocked || 0}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-red-500 transition-all duration-500"
                  style={{
                    width: `${summary?.totalUsers ? ((growthStats?.blocked || 0) / summary.totalUsers) * 100 : 0}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Users List */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-50 p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-900 sm:text-base">Recent Users</h3>
            <Link
              href="/dashboard/users"
              className="text-xs font-medium text-[#1A227F] hover:underline sm:text-sm"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.length > 0 ? (
              recentUsers.map((user, idx) => (
                <div
                  key={user._id || `user-${idx}`}
                  className="flex items-center justify-between gap-2 p-3 px-4 transition-colors hover:bg-gray-50/50 sm:p-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-900 sm:text-sm">
                      {user.fullName}
                    </p>
                    <p className="truncate text-[11px] text-gray-500 sm:text-xs">{user.email}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize sm:px-2.5 sm:py-1 ${
                      user.status === "active"
                        ? "bg-emerald-50 text-emerald-600"
                        : user.status === "suspended"
                          ? "bg-red-50 text-red-600"
                          : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-gray-500 sm:text-sm">
                No recent users found
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities List */}
        <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs lg:col-span-2">
          <div className="border-b border-gray-50 p-4 sm:p-6">
            <h3 className="text-sm font-semibold text-gray-900 sm:text-base">Recent Activities</h3>
          </div>
          <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div
                  key={activity._id || `activity-${idx}`}
                  className="flex min-w-0 items-start gap-3 sm:gap-4"
                >
                  <div
                    className={`shrink-0 rounded-full p-2 ${
                      activity.action.includes("LOGIN")
                        ? "bg-indigo-50"
                        : activity.action.includes("STATUS")
                          ? "bg-emerald-50"
                          : "bg-purple-50"
                    }`}
                  >
                    {activity.action.includes("LOGIN") ? (
                      <UserCheck
                        className={`h-4 w-4 ${activity.action.includes("LOGIN") ? "text-indigo-600" : ""}`}
                      />
                    ) : activity.action.includes("STATUS") ? (
                      <Component className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <PlayCircle className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs break-words text-gray-900 sm:text-sm">
                      <span className="font-medium text-gray-600">
                        {activity.userId?.fullName || "System"}:{" "}
                      </span>
                      {activity.details}
                    </p>
                    <p className="mt-1 text-[11px] text-gray-400 sm:text-xs">
                      {activity.createdAt
                        ? (() => {
                            const date = new Date(activity.createdAt);
                            return isNaN(date.getTime())
                              ? "Invalid date"
                              : formatDistanceToNow(date, { addSuffix: true });
                          })()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-xs text-gray-500 sm:text-sm">
                No recent activities found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
