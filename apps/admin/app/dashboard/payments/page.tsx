"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { getTransactions } from "@/lib/api-auth";

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
          search: searchQuery || undefined
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
    <div className="min-w-0 space-y-4 pb-12 sm:space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        <StatCard title="Total Payments" value={meta.total.toString()} color="indigo" />
        <StatCard
          title="Completed"
          value={transactions.filter((t) => t.status === "success").length.toString()}
          color="emerald"
        />
        <StatCard
          title="Pending"
          value={transactions.filter((t) => t.status === "pending").length.toString()}
          color="orange"
        />
        <StatCard
          title="Failed"
          value={transactions.filter((t) => t.status === "failed").length.toString()}
          color="red"
        />
      </div>

      {/* Filter Bar */}
      <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative max-w-lg flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by user, group or reference..."
              className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2 pr-4 pl-10 text-sm transition-all focus:border-[#1A2279] focus:ring-2 focus:ring-[#1A2279]/10 focus:outline-none"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 sm:gap-2 sm:pb-0">
            {["All", "Completed", "Pending", "Failed"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all sm:px-4 sm:py-2 sm:text-sm ${
                  activeTab === tab
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
      <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-6">
        <div className="relative min-h-[400px] overflow-x-auto rounded-xl border border-gray-100">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-[#1A2279]" />
            </div>
          )}
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Group
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Platform Fee
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Stripe Fee
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Ref ID
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.length > 0
                ? transactions.map((tx) => (
                    <tr key={tx._id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <div>
                          <p className="text-xs font-bold text-gray-900">{tx.userId?.fullName}</p>
                          <p className="text-[10px] text-gray-400">{tx.userId?.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-xs whitespace-nowrap text-gray-700">
                        {tx.groupId?.name}
                      </td>
                      <td className="px-6 py-5 text-center text-xs font-semibold whitespace-nowrap text-gray-900">
                        ${tx.amount}
                      </td>
                      <td className="px-6 py-5 text-center text-xs whitespace-nowrap text-gray-500">
                        ${tx.platformFee || 0}
                      </td>
                      <td className="px-6 py-5 text-center text-xs whitespace-nowrap text-red-500">
                        ${tx.stripeFee || 0}
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] whitespace-nowrap text-gray-500">
                        {tx.referenceId}
                      </td>
                      <td className="px-6 py-5 text-center text-[10px] whitespace-nowrap text-gray-500">
                        {tx.createdAt
                          ? format(new Date(tx.createdAt), "MMM dd, yyyy HH:mm")
                          : "N/A"}
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold capitalize ${
                            tx.status === "success"
                              ? "bg-emerald-50 text-emerald-600"
                              : tx.status === "pending"
                                ? "bg-orange-50 text-orange-600"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                : !isLoading && (
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
          <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-gray-50 px-3 py-4 sm:flex-row sm:px-6 sm:py-6">
            <div className="order-2 text-xs text-gray-400 sm:order-1">
              Page {page} of {meta.totalPage}
            </div>
            <div className="order-1 flex items-center gap-2 sm:order-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: meta.totalPage }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all sm:h-9 sm:w-9 sm:text-sm ${
                      page === p
                        ? "bg-[#1A2279] text-white shadow-lg shadow-indigo-100"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {p.toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
                disabled={page === meta.totalPage}
                className="p-2 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Disputes Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-yellow-100 bg-yellow-50 p-4 sm:p-6">
        <div className="relative z-10 flex gap-3 sm:gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-sm sm:h-10 sm:w-10">
            <AlertCircle className="h-5 w-5 text-orange-500 sm:h-6 sm:w-6" />
          </div>
          <div className="space-y-1 sm:space-y-2">
            <h3 className="text-base font-bold text-gray-900 sm:text-lg">Payment Disputes</h3>
            <p className="text-xs text-gray-500 sm:text-sm">
              Currently, there are no active payment disputes. Monitor this section for any issues
              that require attention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color
}: {
  title: string;
  value: string;
  color: "indigo" | "emerald" | "orange" | "red";
}) {
  const colors = {
    indigo: "text-gray-900",
    emerald: "text-emerald-500",
    orange: "text-orange-500",
    red: "text-red-500"
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-5">
      <p className="mb-1 text-xs font-medium text-gray-500">{title}</p>
      <h3 className={`text-xl font-bold sm:text-2xl ${colors[color]}`}>{value}</h3>
    </div>
  );
}
