"use client";

import { useState, useEffect } from "react";
import { 
  History, 
  Search, 
  Filter, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Shield,
  UserCheck,
  CreditCard,
  AlertCircle,
  Download
} from "lucide-react";
import { getAuditLogs } from "@/lib/api-auth";
import { toast } from "sonner";
import { format } from "date-fns";

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
    { label: "Manual Review", value: "manual_review_escalated" },
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
    if (action.includes("cancel") || action.includes("expiry")) return <AlertCircle className="w-4 h-4 text-orange-500" />;
    if (action.includes("rejected") || action.includes("failed")) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (action.includes("admin")) return <Shield className="w-4 h-4 text-indigo-500" />;
    if (action.includes("manual")) return <UserCheck className="w-4 h-4 text-emerald-500" />;
    return <History className="w-4 h-4 text-gray-400" />;
  };

  const renderDetails = (log: AuditLog) => {
    if (log.metadata?.error) return <span className="text-red-500 font-medium">{log.metadata.error}</span>;
    if (log.metadata?.reason) return <span>Reason: <span className="font-medium text-gray-700">{log.metadata.reason}</span></span>;
    if (log.metadata?.action) {
      return (
        <div className="flex flex-col gap-0.5">
          <span>Action: <span className="font-bold text-indigo-600">{log.metadata.action}</span></span>
          {log.metadata.channel && <span className="text-[10px] text-gray-400 font-medium">Channel: {log.metadata.channel}</span>}
        </div>
      );
    }
    if (log.metadata?.stripeSubscriptionId || log.metadata?.subscriptionId) 
      return <span>Subscription: <span className="font-mono text-[10px] bg-gray-100 px-1 py-0.5 rounded">{log.metadata.stripeSubscriptionId || log.metadata.subscriptionId}</span></span>;
    return <span className="text-gray-400 italic">No additional details</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
          <p className="text-sm text-gray-500">Track and monitor all system-wide events and security actions</p>
        </div>
        
      </div>

      <div className="bg-white rounded-3xl border border-gray-100/50 shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/30">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
            >
              {actions.map(action => (
                <option key={action.value} value={action.value}>{action.label}</option>
              ))}
            </select>
          </div>
          
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Total Logs: {meta.total}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#1A2279] animate-spin" />
            </div>
          )}
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Entity Type / ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Metadata / Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          {getActionIcon(log.action)}
                        </div>
                        <span className="text-xs font-bold text-gray-700 capitalize">{log.action.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block uppercase tracking-wider mb-1">
                          {log.entityType}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">{log.entityId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-xs text-gray-600 leading-relaxed max-w-md">
                        {renderDetails(log)}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
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
          <div className="p-6 border-t border-gray-50 flex items-center justify-between bg-gray-50/20">
            <p className="text-xs font-bold text-gray-400">
              Showing <span className="text-gray-900">{(page - 1) * meta.limit + 1}</span> to <span className="text-gray-900">{Math.min(page * meta.limit, meta.total)}</span> of <span className="text-gray-900">{meta.total}</span> logs
            </p>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-indigo-50 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
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
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          page === pageNum 
                            ? "bg-[#1A2279] text-white shadow-md shadow-indigo-100" 
                            : "text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (
                    pageNum === page - 2 || 
                    pageNum === page + 2
                  ) {
                    return <span key={pageNum} className="text-gray-300">...</span>;
                  }
                  return null;
                })}
              </div>

              <button 
                onClick={() => setPage(p => Math.min(Math.ceil(meta.total / meta.limit), p + 1))}
                disabled={page === Math.ceil(meta.total / meta.limit)}
                className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-indigo-50 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
