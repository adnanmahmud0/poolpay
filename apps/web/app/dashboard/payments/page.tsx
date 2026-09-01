"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Loader2
} from "lucide-react";
import { getTransactions } from "@/lib/api-auth";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({ total: 0, totalPage: 1 });

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const params: any = {
          page,
          limit: 10,
          search: searchQuery || undefined,
        };
        
        if (activeTab !== "All") {
          params.status = activeTab === "Completed" ? "success" : activeTab.toLowerCase();
        }

        const response = await getTransactions(params);
        if (response.success) {
          setTransactions(response.data);
          setMeta(response.meta);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchTransactions, searchQuery ? 500 : 0);
    return () => clearTimeout(timeoutId);
  }, [page, activeTab, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Payments" value={meta.total.toString()} color="indigo" />
        <StatCard title="Completed" value={transactions.filter(t => t.status === 'success').length.toString()} color="emerald" />
        <StatCard title="Pending" value={transactions.filter(t => t.status === 'pending').length.toString()} color="orange" />
        <StatCard title="Failed" value={transactions.filter(t => t.status === 'failed').length.toString()} color="red" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, group or reference..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50/50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A2279]/10 focus:border-[#1A2279] transition-all"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {["All", "Completed", "Pending", "Failed"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
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
      </div>

      {/* Main Unified Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
        <div className="overflow-x-auto border border-gray-100 rounded-xl relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#1A2279] animate-spin" />
            </div>
          )}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Group</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Amount</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Platform Fee</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Stripe Fee</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Ref ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <div>
                        <p className="text-xs font-bold text-gray-900">{tx.userId?.fullName}</p>
                        <p className="text-[10px] text-gray-400">{tx.userId?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-xs text-gray-700 text-center">
                      {tx.groupId?.name}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-xs font-semibold text-gray-900 text-center">
                      ${tx.amount}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-xs text-gray-500 text-center">
                      ${tx.platformFee || 0}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-xs text-red-500 text-center">
                      ${tx.stripeFee || 0}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-[10px] text-gray-500 text-center">
                      {tx.referenceId}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-[10px] text-gray-500 text-center">
                      {tx.createdAt ? format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full capitalize ${tx.status === "success" ? "bg-emerald-50 text-emerald-600" :
                          tx.status === "pending" ? "bg-orange-50 text-orange-600" :
                            "bg-red-50 text-red-600"
                        }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : !isLoading && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500 italic">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.totalPage > 1 && (
          <div className="flex items-center justify-end px-6 py-6 border-t border-gray-50 mt-4">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: meta.totalPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${page === p
                        ? "bg-[#1A2279] text-white shadow-lg shadow-indigo-100"
                        : "text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    {p.toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(meta.totalPage, p + 1))}
                disabled={page === meta.totalPage}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Disputes Banner */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex gap-4 relative z-10">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm">
            <AlertCircle className="w-6 h-6 text-orange-500" />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Payment Disputes</h3>
              <p className="text-sm text-gray-500">
                Currently, there are no active payment disputes. Monitor this section for any issues that require attention.
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: "indigo" | "emerald" | "orange" | "red" }) {
  const colors = {
    indigo: "text-gray-900",
    emerald: "text-emerald-500",
    orange: "text-orange-500",
    red: "text-red-500",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100/50">
      <p className="text-gray-500 text-xs font-medium mb-1">{title}</p>
      <h3 className={`text-2xl font-bold ${colors[color]}`}>{value}</h3>
    </div>
  );
}
