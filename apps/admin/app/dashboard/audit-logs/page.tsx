"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Filter,
  History,
  Loader2,
  Search,
  Shield,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { getAuditLogs } from "@/lib/api-auth";

interface AuditLog {
  _id: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: {
    action?: string;
    channel?: string;
    subscriptionId?: string;
    immediate?: boolean;
    stripeSubscriptionId?: string;
    error?: string;
    signature?: boolean;
    reason?: string;
  };
  createdAt: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0 });
  const [filterAction, setFilterAction] = useState("");

  const actions = [
    { label: "All Actions", value: "" },
    { label: "Admin Action", value: "admin_action" },
    { label: "Subscription Expiry", value: "subscription_expiry" },
    { label: "Membership Cancel", value: "membership_cancel" },
    { label: "Webhook Rejected", value: "webhook_rejected" },
    { label: "Manual Review", value: "manual_review_escalated" }
  ];

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await getAuditLogs({
        page,
        limit: 10,
        action: filterAction || undefined
      });
      if (response.success) {
        setLogs(response.data.data);
        setMeta(response.data.meta);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch audit logs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filterAction]);

  const getActionIcon = (action: string) => {
    if (action.includes("cancel") || action.includes("expiry"))
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    if (action.includes("rejected") || action.includes("failed"))
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (action.includes("admin")) return <Shield className="h-4 w-4 text-indigo-500" />;
    if (action.includes("manual")) return <UserCheck className="h-4 w-4 text-emerald-500" />;
    return <History className="h-4 w-4 text-gray-400" />;
  };

  const renderDetails = (log: AuditLog) => {
    if (log.metadata?.error)
      return <span className="font-medium text-red-500">{log.metadata.error}</span>;
    if (log.metadata?.reason)
      return (
        <span>
          Reason: <span className="font-medium text-gray-700">{log.metadata.reason}</span>
        </span>
      );
    if (log.metadata?.action) {
      return (
        <div className="flex flex-col gap-0.5">
          <span>
            Action: <span className="font-bold text-indigo-600">{log.metadata.action}</span>
          </span>
          {log.metadata.channel && (
            <span className="text-[10px] font-medium text-gray-400">
              Channel: {log.metadata.channel}
            </span>
          )}
        </div>
      );
    }
    if (log.metadata?.stripeSubscriptionId || log.metadata?.subscriptionId)
      return (
        <span>
          Subscription:{" "}
          <span className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">
            {log.metadata.stripeSubscriptionId || log.metadata.subscriptionId}
          </span>
        </span>
      );
    return <span className="text-gray-400 italic">No additional details</span>;
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">System Audit Logs</h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Track and monitor all system-wide events and security actions
          </p>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs sm:rounded-3xl">
        {/* Filters */}
        <div className="flex flex-col items-stretch justify-between gap-3 border-b border-gray-50 bg-gray-50/30 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <Filter className="h-4 w-4 shrink-0 text-gray-400" />
            <select
              className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none sm:w-auto sm:px-4 sm:text-sm"
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
            >
              {actions.map((action) => (
                <option key={action.value} value={action.value}>
                  {action.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right text-xs font-bold tracking-widest text-gray-400 uppercase sm:text-left">
            Total Logs: {meta.total}
          </div>
        </div>

        {/* Table */}
        <div className="relative min-h-[400px] overflow-x-auto">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
              <Loader2 className="h-8 w-8 animate-spin text-[#1A2279]" />
            </div>
          )}

          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Action Type
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Entity Type / ID
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Metadata / Details
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="transition-colors hover:bg-gray-50/30">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-gray-50 p-2">{getActionIcon(log.action)}</div>
                        <span className="text-xs font-bold text-gray-700 capitalize">
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div>
                        <p className="mb-1 inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-indigo-600 uppercase">
                          {log.entityType}
                        </p>
                        <p className="font-mono text-[10px] text-gray-400">{log.entityId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="max-w-md text-xs leading-relaxed text-gray-600">
                        {renderDetails(log)}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-400 italic">
                    No audit logs found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total > meta.limit && (
          <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-50 bg-gray-50/20 p-4 sm:flex-row sm:p-6">
            <p className="order-2 text-center text-xs font-bold text-gray-400 sm:order-1 sm:text-left">
              Showing <span className="text-gray-900">{(page - 1) * meta.limit + 1}</span> to{" "}
              <span className="text-gray-900">{Math.min(page * meta.limit, meta.total)}</span> of{" "}
              <span className="text-gray-900">{meta.total}</span> logs
            </p>
            <div className="order-1 flex items-center gap-1 sm:order-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(Math.ceil(meta.total / meta.limit))].map((_, i) => {
                  const pageNum = i + 1;
                  const totalPages = Math.ceil(meta.total / meta.limit);
                  // Only show current page, first, last, and pages around current
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 1 && pageNum <= page + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-7 w-7 rounded-lg text-xs font-bold transition-all sm:h-8 sm:w-8 ${
                          page === pageNum
                            ? "bg-[#1A2279] text-white shadow-md shadow-indigo-100"
                            : "text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === page - 2 || pageNum === page + 2) {
                    return (
                      <span key={pageNum} className="text-xs text-gray-300">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(Math.ceil(meta.total / meta.limit), p + 1))}
                disabled={page === Math.ceil(meta.total / meta.limit)}
                className="rounded-lg p-2 text-gray-400 transition-all hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
