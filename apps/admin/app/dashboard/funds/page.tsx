"use client";

import { useEffect, useState } from "react";

import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
  Search,
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { getFundsSummary, getGroupFundDetails, getTurns } from "@/lib/api-auth";

export default function FundsPage() {
  const [activeTab, setActiveTab] = useState("Group Funds");
  const [summary, setSummary] = useState<any>(null);
  const [groupFunds, setGroupFunds] = useState<any[]>([]);
  const [turns, setTurns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({ total: 0, totalPage: 1 });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await getFundsSummary();
        if (response.success) {
          setSummary(response.data);
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load funds summary");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsTableLoading(true);
      try {
        if (activeTab === "Group Funds") {
          const response = await getGroupFundDetails({ page, limit: 10 });
          if (response.success) {
            setGroupFunds(response.data.data);
            setMeta(response.data.meta);
          }
        } else {
          const response = await getTurns({ page, limit: 10 });
          if (response.success) {
            setTurns(response.data.data);
            setMeta(response.data.meta);
          }
        }
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to load data");
      } finally {
        setIsTableLoading(false);
      }
    };

    fetchData();
  }, [page, activeTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#1A2279]" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        <StatCard
          title="Total Funds"
          value={`$${summary?.totalFunds?.toLocaleString() || 0}`}
          icon={<DollarSign className="h-5 w-5 text-emerald-600" />}
          color="emerald"
        />
        <StatCard
          title="Pending Funds"
          value={`$${summary?.totalPending?.toLocaleString() || 0}`}
          icon={<Clock className="h-5 w-5 text-orange-500" />}
          color="orange"
        />
        <StatCard
          title="Monthly Inflow"
          value={`$${summary?.monthlyInflow?.toLocaleString() || 0}`}
          icon={<TrendingUp className="h-5 w-5 text-indigo-600" />}
          color="indigo"
        />
      </div>

      {/* Main Unified Card */}
      <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:p-6">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 p-1">
            {["Group Funds"].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`rounded-lg px-6 py-2 text-sm font-bold transition-all ${
                  activeTab === tab
                    ? "bg-[#1A2279] text-white shadow-md shadow-indigo-100"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        <div className="relative min-h-[400px] overflow-x-auto rounded-2xl border border-gray-100">
          {isTableLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-[#1A2279]" />
            </div>
          )}

          {activeTab === "Group Funds" ? (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Group
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Contribution
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Members
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Total Pool
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Distributed
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {groupFunds.length > 0 ? (
                  groupFunds.map((item) => (
                    <tr key={item._id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.name}</p>
                          <p className="text-[10px] font-medium text-gray-400">
                            Admin: {item.adminName}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            ${item.contributionAmount}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">
                            {item.contributionFrequency}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-sm font-bold whitespace-nowrap text-gray-500">
                        {item.currentMembers}/{item.totalMembers}
                      </td>
                      <td className="px-6 py-5 text-center text-sm font-bold whitespace-nowrap text-gray-900">
                        ${item.totalPool?.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-center text-sm font-bold whitespace-nowrap text-emerald-600">
                        ${item.distributed?.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold capitalize ${
                            item.status === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : item.status === "upcoming"
                                ? "bg-orange-50 text-orange-600"
                                : "bg-red-50 text-red-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-20 text-center font-medium text-gray-400 italic"
                    >
                      No group fund details found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4 text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Turn / Member
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Gross Amount
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Fees (1%+1%)
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Net Payout
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold tracking-wider text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {turns.length > 0 ? (
                  turns.map((turn) => (
                    <tr key={turn._id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-[#1A2279]">
                            #{turn.turnNumber}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {turn.userId?.fullName || "Unassigned"}
                            </p>
                            <p className="text-[10px] font-medium text-gray-400">
                              {turn.groupId?.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center text-sm font-bold whitespace-nowrap text-gray-900">
                        ${turn.grossAmount?.toLocaleString()}
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <div className="text-[10px] font-medium text-gray-500">
                          <p>
                            Platform:{" "}
                            <span className="text-red-400">
                              -${turn.platformFee?.toLocaleString()}
                            </span>
                          </p>
                          <p>
                            Creator:{" "}
                            <span className="text-red-400">
                              -${turn.creatorCommission?.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        <div className="text-sm font-black text-[#1A2279]">
                          ${turn.netPayout?.toLocaleString()}
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-1 text-[8px] font-bold text-gray-400 uppercase">
                          <ShieldCheck className="h-2.5 w-2.5" /> Stripe Payout
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center whitespace-nowrap">
                        {turn.status === "MANUAL_REVIEW" ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-[10px] font-black tracking-tighter text-red-600 uppercase">
                              <AlertCircle className="h-3 w-3" /> Manual Review
                            </span>
                            <span className="text-[8px] font-bold text-red-400">KYC/Flagged</span>
                          </div>
                        ) : (
                          <span
                            className={`rounded-full px-3 py-1 text-[10px] font-bold capitalize ${
                              turn.status === "PAID"
                                ? "bg-emerald-50 text-emerald-600"
                                : turn.status === "PENDING"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-gray-50 text-gray-600"
                            }`}
                          >
                            {turn.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-20 text-center font-medium text-gray-400 italic"
                    >
                      No turn records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "emerald" | "orange" | "indigo";
}) {
  const bgColors = {
    emerald: "bg-emerald-50",
    orange: "bg-orange-50",
    indigo: "bg-indigo-50"
  };

  return (
    <div className="flex min-h-[96px] flex-col justify-center rounded-2xl border border-gray-100 bg-white p-4 shadow-xs sm:h-32 sm:p-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`${bgColors[color]} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="mb-0.5 truncate text-xs font-medium text-gray-500 sm:mb-1 sm:text-sm">
            {title}
          </p>
          <h3 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">{value}</h3>
        </div>
      </div>
    </div>
  );
}
