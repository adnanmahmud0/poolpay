"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react";
import { getUsers, updateUserStatus } from "@/lib/api-auth";
import { toast } from "sonner";

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  role: string;
  profileImage?: string;
  failedLoginAttempts: number;
  lockoutUntil?: string;
}

interface Meta {
  page: number;
  limit: number;
  total: number;
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 10, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, suspended: 0 });

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: meta.page,
        limit: meta.limit,
        status: activeTab === "All" ? undefined : activeTab.toLowerCase(),
        search: searchQuery || undefined,
      };
      const response = await getUsers(params);
      if (response.success) {
        const flattenedUsers = response.data.data.map((item: any) => ({
          ...item,
          fullName: item.fullName || `${item.firstName} ${item.lastName}`,
        }));
        setUsers(flattenedUsers);
        setMeta(response.data.meta);

        // Stats calculation from flattened users
        setStats({
          total: response.data.totalUsers,
          active: response.data.activeUsers,
          pending: response.data.pendingUsers,
          suspended: response.data.suspendedUsers,
        });
      }
    } catch (error: any) {
      console.error("Fetch users error:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.limit, activeTab, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handlePageChange = (newPage: number) => {
    setMeta(prev => ({ ...prev, page: newPage }));
  };

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      const response = await updateUserStatus(userId, newStatus);
      if (response.success) {
        toast.success(response.message || `User status updated to ${newStatus}`);
        setOpenMenuId(null);
        fetchUsers(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Status update error:", error);
      toast.error(error.response?.data?.message || "Something went wrong while updating status");
    }
  };

  const handleResetLockout = async (userId: string) => {
    try {
      // According to api.txt, clearing failed attempts is done via status endpoint
      const response = await updateUserStatus(userId, "active"); 
      if (response.success) {
        toast.success("User lockout reset successfully");
        setOpenMenuId(null);
        fetchUsers();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reset lockout");
    }
  };

  const totalPages = Math.ceil(meta.total / meta.limit);

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.total} color="indigo" />
        <StatCard title="Active" value={stats.active} color="emerald" />
        <StatCard title="Pending" value={stats.pending} color="orange" />
        <StatCard title="Suspended" value={stats.suspended} color="red" />
      </div>

      {/* Main Unified Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2279]/10 focus:border-[#1A2279] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            {["All", "Active", "Pending", "Suspended"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                    ? "bg-[#1A2279] text-white shadow-md shadow-indigo-100"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
              >
                {tab}
              </button>
            ))}

          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-gray-100 rounded-xl min-h-[400px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#1A2279] animate-spin" />
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Contact</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Security</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {!isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-left">
                      <div className="flex items-center gap-3">
                        {user.profileImage ? (
                          <img 
                            src={user.profileImage} 
                            alt={user.fullName} 
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#1A2279] flex items-center justify-center text-white font-bold text-sm">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                          <p className="text-[10px] text-gray-400">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-left">
                      <div>
                        <p className="text-xs text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.phone || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-left">
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Attempts: {user.failedLoginAttempts || 0}</p>
                        {user.lockoutUntil && (
                          <p className="text-[10px] text-red-500 mt-1">
                            Locked until: {new Date(user.lockoutUntil).toLocaleString()}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-1 capitalize">{user.role}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-left">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${user.status === "active" ? "bg-emerald-50 text-emerald-600" :
                          user.status === "suspended" ? "bg-red-50 text-red-600" :
                            "bg-orange-50 text-orange-600"
                        }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-left relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                      {openMenuId === user._id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          ></div>
                          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-in fade-in zoom-in duration-200">
                            {user.failedLoginAttempts > 0 && (
                              <button
                                className="w-full px-4 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"
                                onClick={() => handleResetLockout(user._id)}
                              >
                                Reset Lockout
                              </button>
                            )}
                            {user.status === "active" && (
                              <button
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors capitalize"
                                onClick={() => handleStatusUpdate(user._id, "suspended")}
                              >
                                Suspend
                              </button>
                            )}
                            {user.status === "suspended" && (
                              <button
                                className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 transition-colors capitalize"
                                onClick={() => handleStatusUpdate(user._id, "active")}
                              >
                                Active
                              </button>
                            )}
                            {user.status === "pending" && (
                              <>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 font-bold transition-colors capitalize"
                                  onClick={() => handleStatusUpdate(user._id, "active")}
                                >
                                  Approve
                                </button>
                                <button
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors capitalize"
                                  onClick={() => handleStatusUpdate(user._id, "suspended")}
                                >
                                  Suspend
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                )
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end px-6 py-6 border-t border-gray-50 mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, meta.page - 1))}
              disabled={meta.page === 1 || isLoading}
              className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Simple pagination logic for first 5 pages
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${meta.page === pageNum
                        ? "bg-[#1A2279] text-white shadow-lg shadow-indigo-100 scale-110"
                        : "text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    {pageNum.toString().padStart(2, "0")}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-2 text-gray-400">...</span>}
            </div>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, meta.page + 1))}
              disabled={meta.page === totalPages || isLoading}
              className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: "indigo" | "emerald" | "orange" | "red" }) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50/50",
    emerald: "text-emerald-500 bg-emerald-50/50",
    orange: "text-orange-500 bg-orange-50/50",
    red: "text-red-500 bg-red-50/50",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
      <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
      <h3 className={`text-2xl font-bold ${colors[color].split(' ')[0]}`}>{value}</h3>
    </div>
  );
}
