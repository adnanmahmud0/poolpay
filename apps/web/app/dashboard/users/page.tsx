"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Trash2,
  AlertTriangle,
  XCircle,
  X,
  UserX,
  ShieldAlert
} from "lucide-react";
import {
  getUsers,
  updateUserStatus,
  getSettings,
  updateSettings,
  getDeletionRequests,
  confirmDeletionRequest,
  rejectDeletionRequest
} from "@/lib/api-auth";
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

interface DeletionRequestItem {
  _id: string;
  userId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImage?: string;
    status?: string;
  };
  userName: string;
  userEmail: string;
  userPhone?: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  reviewedAt?: string;
  adminNote?: string;
  createdAt: string;
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
  const [isAutoApprove, setIsAutoApprove] = useState<boolean>(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(true);
  const [isUpdatingToggle, setIsUpdatingToggle] = useState<boolean>(false);

  // Deletion Requests State
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequestItem[]>([]);
  const [deletionMeta, setDeletionMeta] = useState<Meta>({ page: 1, limit: 10, total: 0 });
  const [deletionCounts, setDeletionCounts] = useState({ totalPending: 0, totalApproved: 0, totalRejected: 0 });
  const [confirmModalData, setConfirmModalData] = useState<DeletionRequestItem | null>(null);
  const [rejectModalData, setRejectModalData] = useState<DeletionRequestItem | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getSettings()
      .then((response) => {
        if (isMounted && response?.success && response?.data) {
          setIsAutoApprove(response.data.isUserAutoApprovalEnabled ?? true);
        }
      })
      .catch((error: unknown) => {
        console.error("Fetch settings error:", error);
      })
      .finally(() => {
        if (isMounted) {
          setIsSettingsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleApprovalMode = async () => {
    const nextValue = !isAutoApprove;
    setIsUpdatingToggle(true);
    try {
      const response = await updateSettings({ isUserAutoApprovalEnabled: nextValue });
      if (response.success) {
        setIsAutoApprove(nextValue);
        toast.success(
          nextValue
            ? "Auto-Approve Enabled: New users can log in immediately upon registration."
            : "Manual Approval Enabled: New users require admin approval before logging in."
        );
      } else {
        toast.error(response.message || "Failed to update approval mode");
      }
    } catch (error: unknown) {
      console.error("Toggle approval mode error:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to update approval mode");
    } finally {
      setIsUpdatingToggle(false);
    }
  };

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
        interface RawUserItem extends Partial<User> {
          firstName?: string;
          lastName?: string;
        }
        const flattenedUsers = (response.data.data as RawUserItem[]).map((item) => ({
          ...item,
          fullName: item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim(),
        })) as User[];
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
    } catch (error: unknown) {
      console.error("Fetch users error:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.limit, activeTab, searchQuery]);

  const fetchDeletionList = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: deletionMeta.page,
        limit: deletionMeta.limit,
        search: searchQuery || undefined,
      };
      const response = await getDeletionRequests(params);
      if (response.success) {
        setDeletionRequests(response.data || []);
        if (response.meta) {
          setDeletionMeta({
            page: response.meta.page,
            limit: response.meta.limit,
            total: response.meta.total,
          });
          setDeletionCounts({
            totalPending: response.meta.totalPending || 0,
            totalApproved: response.meta.totalApproved || 0,
            totalRejected: response.meta.totalRejected || 0,
          });
        }
      }
    } catch (error: unknown) {
      console.error("Fetch deletion requests error:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to fetch deletion requests");
    } finally {
      setIsLoading(false);
    }
  }, [deletionMeta.page, deletionMeta.limit, searchQuery]);

  // Initial fetch for deletion counts so the badge always appears accurately
  useEffect(() => {
    getDeletionRequests({ page: 1, limit: 1 })
      .then((res) => {
        if (res.success && res.meta) {
          setDeletionCounts({
            totalPending: res.meta.totalPending || 0,
            totalApproved: res.meta.totalApproved || 0,
            totalRejected: res.meta.totalRejected || 0,
          });
        }
      })
      .catch((err) => console.warn("Initial deletion count fetch error:", err));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "Deletion Requests") {
        fetchDeletionList();
      } else {
        fetchUsers();
      }
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchUsers, fetchDeletionList, activeTab]);

  const handlePageChange = (newPage: number) => {
    if (activeTab === "Deletion Requests") {
      setDeletionMeta((prev) => ({ ...prev, page: newPage }));
    } else {
      setMeta((prev) => ({ ...prev, page: newPage }));
    }
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
    } catch (error: unknown) {
      console.error("Status update error:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Something went wrong while updating status");
    }
  };

  const handleResetLockout = async (userId: string) => {
    try {
      const response = await updateUserStatus(userId, "active");
      if (response.success) {
        toast.success("User lockout reset successfully");
        setOpenMenuId(null);
        fetchUsers();
      }
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to reset lockout");
    }
  };

  // Confirm Deletion Execution
  const handleConfirmDelete = async () => {
    if (!confirmModalData) return;
    setIsActionLoading(true);
    try {
      const response = await confirmDeletionRequest(confirmModalData._id);
      if (response.success) {
        toast.success(
          `Account for ${confirmModalData.userName} (${confirmModalData.userEmail}) has been permanently deleted.`
        );
        setConfirmModalData(null);
        fetchDeletionList();
        fetchUsers();
      } else {
        toast.error(response.message || "Failed to confirm account deletion");
      }
    } catch (error: unknown) {
      console.error("Confirm deletion error:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to confirm deletion request");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Reject Deletion Request
  const handleRejectDelete = async () => {
    if (!rejectModalData) return;
    setIsActionLoading(true);
    try {
      const response = await rejectDeletionRequest(rejectModalData._id, rejectNote);
      if (response.success) {
        toast.success(`Deletion request for ${rejectModalData.userName} rejected.`);
        setRejectModalData(null);
        setRejectNote("");
        fetchDeletionList();
      } else {
        toast.error(response.message || "Failed to reject deletion request");
      }
    } catch (error: unknown) {
      console.error("Reject deletion error:", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to reject deletion request");
    } finally {
      setIsActionLoading(false);
    }
  };

  const currentMeta = activeTab === "Deletion Requests" ? deletionMeta : meta;
  const totalPages = Math.ceil(currentMeta.total / currentMeta.limit);

  return (
    <div className="space-y-6">
      {/* Registration Approval Mode Toggle Banner */}
      <div className="bg-gradient-to-r from-white via-indigo-50/20 to-blue-50/10 p-4 sm:p-6 rounded-2xl border border-indigo-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`p-3 rounded-xl flex items-center justify-center transition-colors shadow-xs ${
              isAutoApprove
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                : "bg-amber-50 text-amber-600 border border-amber-100"
            }`}
          >
            {isAutoApprove ? (
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                User Registration Approval Mode
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  isAutoApprove
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAutoApprove ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                {isAutoApprove ? "Auto-Approve Enabled" : "Manual Admin Approval"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              {isAutoApprove
                ? "New users will be automatically approved upon account creation and can log in immediately after verifying their email."
                : "New users will remain in Pending status upon account creation. An administrator must manually approve their account before they can log in."}
            </p>
          </div>
        </div>

        {/* Interactive Switch */}
        <div className="flex items-center gap-3 self-end md:self-center bg-white p-2 sm:px-4 sm:py-2 rounded-xl border border-gray-200 shadow-xs">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-gray-800 block">
              {isAutoApprove ? "Auto-Approve" : "Manual Review"}
            </span>
            <span className="text-[11px] text-gray-400 block">
              {isAutoApprove ? "Immediate login" : "Requires approval"}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isAutoApprove}
            disabled={isSettingsLoading || isUpdatingToggle}
            onClick={handleToggleApprovalMode}
            className={`relative inline-flex h-7 w-14 sm:h-8 sm:w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1A2279]/30 disabled:opacity-50 disabled:cursor-not-allowed ${
              isAutoApprove ? "bg-[#1A2279]" : "bg-gray-300"
            }`}
            title={
              isAutoApprove
                ? "Click to switch to Manual Approval mode"
                : "Click to switch to Auto-Approve mode"
            }
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 sm:h-7 sm:w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                isAutoApprove ? "translate-x-7 sm:translate-x-8" : "translate-x-0"
              }`}
            >
              {isUpdatingToggle ? (
                <Loader2 className="w-3.5 h-3.5 text-[#1A2279] animate-spin" />
              ) : isAutoApprove ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1A2279]" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-gray-500" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-6">
        <StatCard title="Total Users" value={stats.total} color="indigo" />
        <StatCard title="Active" value={stats.active} color="emerald" />
        <StatCard title="Pending" value={stats.pending} color="orange" />
        <StatCard title="Suspended" value={stats.suspended} color="red" />
        <div
          onClick={() => setActiveTab("Deletion Requests")}
          className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <StatCard
            title="Deletion Requests"
            value={deletionCounts.totalPending}
            subtitle={`${deletionCounts.totalApproved} approved`}
            color="rose"
          />
        </div>
      </div>

      {/* Main Unified Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-gray-100 min-w-0">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={
                activeTab === "Deletion Requests"
                  ? "Search deletion requests by name or email..."
                  : "Search users..."
              }
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2279]/10 focus:border-[#1A2279] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {["All", "Active", "Pending", "Suspended", "Deletion Requests"].map((tab) => {
              const isTabActive = activeTab === tab;
              const hasPendingBadge =
                tab === "Deletion Requests" && deletionCounts.totalPending > 0;

              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSearchQuery("");
                  }}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isTabActive
                      ? tab === "Deletion Requests"
                        ? "bg-rose-600 text-white shadow-md shadow-rose-100"
                        : "bg-[#1A2279] text-white shadow-md shadow-indigo-100"
                      : tab === "Deletion Requests" && hasPendingBadge
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  {tab === "Deletion Requests" && (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>{tab}</span>
                  {hasPendingBadge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isTabActive
                          ? "bg-white text-rose-600"
                          : "bg-rose-600 text-white"
                      }`}
                    >
                      {deletionCounts.totalPending}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Table: Deletion Requests View OR Users View */}
        {activeTab === "Deletion Requests" ? (
          /* Deletion Requests Table */
          <div className="overflow-x-auto border border-gray-100 rounded-xl min-h-[400px] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
              </div>
            )}
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-y border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    Reason
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    Requested At
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left">
                    Admin Review & Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {!isLoading && deletionRequests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <span className="font-semibold text-gray-700">No Deletion Requests</span>
                        <span className="text-xs text-gray-400 max-w-sm">
                          There are currently no active account deletion requests submitted by users.
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deletionRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap text-left">
                        <div className="flex items-center gap-3">
                          {req.userId?.profileImage ? (
                            <img
                              src={req.userId.profileImage}
                              alt={req.userName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-700 font-bold text-sm">
                              {req.userName?.charAt(0) || "U"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{req.userName}</p>
                            <p className="text-xs text-gray-400">{req.userEmail}</p>
                            {req.userPhone && (
                              <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                {req.userPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-left max-w-xs">
                        <p className="text-xs text-gray-700 font-medium break-words">
                          {req.reason || "No explanation provided"}
                        </p>
                        {req.adminNote && (
                          <div className="mt-1.5 p-2 bg-amber-50/60 rounded-md border border-amber-100">
                            <span className="text-[11px] font-semibold text-amber-800 block">
                              Admin Note:
                            </span>
                            <span className="text-[11px] text-amber-700">{req.adminNote}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap text-left text-xs text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap text-left">
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize inline-flex items-center gap-1 ${
                            req.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : req.status === "approved"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200"
                          }`}
                        >
                          {req.status === "pending" && (
                            <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                          )}
                          {req.status === "approved" && (
                            <UserX className="w-3 h-3 text-rose-600" />
                          )}
                          {req.status === "rejected" && (
                            <XCircle className="w-3 h-3 text-gray-500" />
                          )}
                          {req.status === "approved" ? "Approved & Deleted" : req.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 whitespace-nowrap text-left">
                        {req.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setConfirmModalData(req)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 hover:scale-105 active:scale-95"
                              title="Review and confirm permanent account deletion"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Review & Delete
                            </button>
                            <button
                              onClick={() => {
                                setRejectModalData(req);
                                setRejectNote("");
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
                              title="Reject deletion request"
                            >
                              <X className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">
                            <span>
                              Reviewed{" "}
                              {req.reviewedAt
                                ? new Date(req.reviewedAt).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "recently"}
                            </span>
                            {req.reviewedBy && (
                              <p className="text-[11px] text-gray-400">
                                by {req.reviewedBy.email || "Admin"}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Standard Users Table */
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
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                              {user.fullName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-left text-sm text-gray-600">
                        {user.phone || "N/A"}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-left">
                        <div className="flex flex-col gap-1">
                          {user.failedLoginAttempts > 0 ? (
                            <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                              {user.failedLoginAttempts} failed login{user.failedLoginAttempts > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Clean</span>
                          )}
                          {user.lockoutUntil && new Date(user.lockoutUntil) > new Date() && (
                            <span className="text-[11px] px-2 py-0.5 bg-red-50 text-red-600 rounded-md font-semibold w-fit border border-red-100">
                              Locked out
                            </span>
                          )}
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
                        <div className="flex items-center gap-2">
                          {user.status === "pending" && (
                            <button
                              onClick={() => handleStatusUpdate(user._id, "active")}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center gap-1 hover:scale-105 active:scale-95"
                              title="Approve User Account"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Approve
                            </button>
                          )}
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user._id ? null : user._id)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                        </div>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-3 sm:px-6 py-4 sm:py-6 border-t border-gray-50 mt-4">
          <div className="text-xs text-gray-400 order-2 sm:order-1">
            Showing Page {currentMeta.page} of {totalPages || 1} ({currentMeta.total} {activeTab === "Deletion Requests" ? "requests" : "users"})
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentMeta.page - 1))}
              disabled={currentMeta.page === 1 || isLoading}
              className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      currentMeta.page === pageNum
                        ? "bg-[#1A2279] text-white shadow-lg shadow-indigo-100 scale-105"
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
              onClick={() => handlePageChange(Math.min(totalPages, currentMeta.page + 1))}
              disabled={currentMeta.page === totalPages || isLoading}
              className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Permanent Account Deletion */}
      {confirmModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-100">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Confirm Account Deletion</h3>
              </div>
              <button
                onClick={() => setConfirmModalData(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-gray-600">
                Are you sure you want to review and permanently delete the account for:
              </p>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                <p className="text-sm font-bold text-gray-900">{confirmModalData.userName}</p>
                <p className="text-xs text-gray-500">{confirmModalData.userEmail}</p>
                {confirmModalData.userPhone && (
                  <p className="text-xs text-gray-500 font-mono">{confirmModalData.userPhone}</p>
                )}
                {confirmModalData.reason && (
                  <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200/60">
                    <span className="font-semibold text-gray-700">Reason: </span>
                    {confirmModalData.reason}
                  </p>
                )}
              </div>

              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/70 text-xs text-rose-800 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Irreversible Action Warning:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Approving this request will permanently erase the user record from the database.
                  Their credentials will be wiped and they will no longer be able to log in.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setConfirmModalData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Permanent Deletion
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Deletion Modal */}
      {rejectModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-gray-800">
                <div className="p-2 bg-gray-100 rounded-xl">
                  <XCircle className="w-5 h-5 text-gray-600" />
                </div>
                <h3 className="font-bold text-base text-gray-900">Reject Deletion Request</h3>
              </div>
              <button
                onClick={() => setRejectModalData(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-gray-600">
                Provide an optional reason for rejecting the deletion request for{" "}
                <span className="font-semibold text-gray-900">{rejectModalData.userName}</span>:
              </p>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Reason for Rejection (sent to user)
                </label>
                <textarea
                  rows={3}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g., Active pool cycle in progress, outstanding financial obligations..."
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-400 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => setRejectModalData(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleRejectDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-900 text-white shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isActionLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    Reject Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle?: string;
  color: "indigo" | "emerald" | "orange" | "red" | "rose";
}) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50/50",
    emerald: "text-emerald-500 bg-emerald-50/50",
    orange: "text-orange-500 bg-orange-50/50",
    red: "text-red-500 bg-red-50/50",
    rose: "text-rose-600 bg-rose-50/50 border border-rose-100",
  };

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
      <div>
        <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">{title}</p>
        <h3 className={`text-xl sm:text-2xl font-bold ${colors[color].split(" ")[0]}`}>
          {value}
        </h3>
      </div>
      {subtitle && <p className="text-[11px] text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}
