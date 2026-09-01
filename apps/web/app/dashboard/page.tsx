"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Users,
  Search,
  Bell,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  UserCheck,
  Component,
  PlayCircle,
  Loader2
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardSummary, getUsers, getRecentActivities, getUserGrowth, getRevenueChartData } from "@/lib/api-auth";
import { toast } from "sonner";

import { formatDistanceToNow } from 'date-fns';
import Link from "next/link";

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
              fullName: item.fullName || userObj.fullName || `${userObj.firstName || ""} ${userObj.lastName || ""}`.trim() || userObj.email || "User",
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
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#1A2279] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-auto">

      {/* Top Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* Card 1: Users */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-50 p-2.5 rounded-xl">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Users</p>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">{summary?.totalUsers || 0}</h3>
            <p className="text-xs text-gray-400">{summary?.activeMembers || 0} active members</p>
          </div>
        </div>

        {/* Card 2: Groups */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 p-2.5 rounded-xl">
              <Component className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Groups</p>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">{summary?.totalGroups || 0}</h3>
            <p className="text-xs text-gray-400">Manage all groups</p>
          </div>
        </div>

        {/* Card 3: Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-2.5 rounded-xl">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Revenue</p>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">${summary?.totalRevenue?.toLocaleString() || 0}</h3>
            <p className="text-xs text-gray-400">Total earnings</p>
          </div>
        </div>

        {/* Card 4: Payouts */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100/50 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-orange-50 p-2.5 rounded-xl">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Payouts</p>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">${summary?.totalPayouts?.toLocaleString() || 0}</h3>
            <p className="text-xs text-gray-400">Total distributions</p>
          </div>
        </div>

      </div>

      {/* Main Content Grid (Charts & Lists) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">Monthly Revenue</p>
              {/* <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-gray-900">${summary?.totalRevenue?.toLocaleString() || 0}</h3>
                <span className="text-xs font-medium text-emerald-500">↑ 1.3%</span>
              </div> */}
            </div>
            {/* <select className="bg-gray-50 border-none text-xs font-medium text-gray-500 rounded-lg px-3 py-1.5 focus:ring-0 cursor-pointer">
              <option>October</option>
              <option>November</option>
              <option>December</option>
            </select> */}
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
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
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ display: 'none' }}
                  itemStyle={{ color: '#111827', fontWeight: 600 }}
                  formatter={(value: any) => [`$${value?.toLocaleString()}`, 'Revenue']}
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
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-semibold text-gray-900">User Growth</h3>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 font-medium">Active Users</span>
                <span className="text-gray-900 font-semibold">{growthStats?.active || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${summary?.totalUsers ? (growthStats?.active || 0) / summary.totalUsers * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 font-medium">Pending Users</span>
                <span className="text-gray-900 font-semibold">{growthStats?.pending || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-orange-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${summary?.totalUsers ? (growthStats?.pending || 0) / summary.totalUsers * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 font-medium">Suspended Users</span>
                <span className="text-gray-900 font-semibold">{growthStats?.blocked || 0}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${summary?.totalUsers ? (growthStats?.blocked || 0) / summary.totalUsers * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Users List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
          <div className="flex justify-between items-center p-6 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Recent Users</h3>
            <Link href="/dashboard/users" className="text-[#1A227F] text-sm font-medium hover:underline">View All</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.length > 0 ? (
              recentUsers.map((user, idx) => (
                <div key={user._id || `user-${idx}`} className="p-4 px-6 flex justify-between items-center hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full capitalize ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                    user.status === 'suspended' ? 'bg-red-50 text-red-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                    {user.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-gray-500 text-sm">
                No recent users found
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden mt-6 lg:mt-0">
          <div className="p-6 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="p-6 space-y-6">
            {activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div key={activity._id || `activity-${idx}`} className="flex gap-4 items-start">
                  <div className={`p-2 rounded-full shrink-0 ${activity.action.includes('LOGIN') ? 'bg-indigo-50' :
                    activity.action.includes('STATUS') ? 'bg-emerald-50' :
                      'bg-purple-50'
                    }`}>
                    {activity.action.includes('LOGIN') ? (
                      <UserCheck className={`w-4 h-4 ${activity.action.includes('LOGIN') ? 'text-indigo-600' : ''}`} />
                    ) : activity.action.includes('STATUS') ? (
                      <Component className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <PlayCircle className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium text-gray-600">{activity.userId?.fullName || 'System'}: </span>
                      {activity.details}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {activity.createdAt ? (() => {
                        const date = new Date(activity.createdAt);
                        return isNaN(date.getTime()) ? 'Invalid date' : formatDistanceToNow(date, { addSuffix: true });
                      })() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 text-sm py-4">
                No recent activities found
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
