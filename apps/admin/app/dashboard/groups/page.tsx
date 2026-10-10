"use client";

import { useEffect, useState } from "react";

import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Component,
  Info,
  Loader2,
  Plus,
  Search,
  Users,
  X
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { toast } from "sonner";

import { createGroup, getGroupDetails, getGroups, startGroup } from "@/lib/api-auth";

interface Group {
  _id: string;
  name: string;
  description: string;
  createdBy: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  contributionAmount: number;
  contributionFrequency: string;
  totalMembers: number;
  currentMembers: number;
  startDate?: string;
  inviteCode: string;
  poolAmount: number;
  status: string;
  createdAt: string;
}

export default function GroupsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, limit: 9, total: 0, totalPage: 1 });
  const [stats, setStats] = useState({
    totalGroups: 0,
    activeGroups: 0,
    upcomingGroups: 0,
    totalMembers: 0
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contributionAmount: "1000",
    contributionFrequency: "monthly",
    totalMembers: "5",
    totalCycles: "2",
    startDate: format(new Date(), "yyyy-MM-dd")
  });

  useEffect(() => {
    fetchGroups();
  }, [activeTab, searchQuery, meta.page, meta.limit]);

  const handlePageChange = (newPage: number) => {
    setMeta((prev) => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit: number) => {
    setMeta((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: meta.page,
        limit: meta.limit
      };
      if (activeTab !== "All") params.status = activeTab.toLowerCase();
      if (searchQuery) params.search = searchQuery;

      const response = await getGroups(params);
      if (response.success) {
        setGroups(response.data.data);
        setMeta(response.data.meta);
        setStats({
          totalGroups: response.data.totalGroups,
          activeGroups: response.data.activeGroups,
          upcomingGroups: response.data.upcomingGroups,
          totalMembers: response.data.totalMembers
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch groups");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        contributionAmount: Number(formData.contributionAmount),
        contributionFrequency: formData.contributionFrequency,
        totalMembers: Number(formData.totalMembers),
        totalCycles: Number(formData.totalCycles)
        // startDate: formData.startDate
      };

      const response = await createGroup(payload);
      if (response.success) {
        toast.success("Group created successfully!");
        setIsModalOpen(false);
        setCurrentStep(1);
        setFormData({
          name: "",
          description: "",
          contributionAmount: "1000",
          contributionFrequency: "monthly",
          totalMembers: "5",
          totalCycles: "2",
          startDate: format(new Date(), "yyyy-MM-dd")
        });
        fetchGroups(); // Refresh list
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create group");
    }
  };

  const handleViewDetails = async (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    try {
      const response = await getGroupDetails(groupId);
      if (response.success) {
        setSelectedGroup(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch group details");
      setIsDetailModalOpen(false);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleStartGroup = async (groupId: string) => {
    try {
      const response = await startGroup(groupId);
      if (response.success) {
        toast.success("Group started successfully!");
        setIsDetailModalOpen(false);
        fetchGroups();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to start group");
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Savings Groups</h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Monitor and manage all rotating savings circles
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 self-start rounded-xl bg-[#1A2279] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:bg-indigo-900 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Create Group</span>
        </button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        <StatCard title="Total Groups" value={stats.totalGroups} color="indigo" />
        <StatCard title="Active" value={stats.activeGroups} color="emerald" />
        <StatCard title="Upcoming" value={stats.upcomingGroups} color="orange" />
        <StatCard title="Total Members" value={stats.totalMembers} color="indigo" />
      </div>

      {/* Filter Bar */}
      <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative max-w-lg flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-gray-100 bg-gray-50/50 py-2 pr-4 pl-10 text-sm transition-all focus:border-[#1A2279] focus:ring-2 focus:ring-[#1A2279]/10 focus:outline-none"
            />
          </div>
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1 sm:gap-3 sm:pb-0">
            <select
              value={meta.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="shrink-0 cursor-pointer rounded-xl border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-xs font-medium transition-all focus:border-[#1A2279] focus:ring-2 focus:ring-[#1A2279]/10 focus:outline-none sm:px-3 sm:py-2 sm:text-sm"
            >
              <option value={3}>3 / page</option>
              <option value={6}>6 / page</option>
              <option value={9}>9 / page</option>
              <option value={12}>12 / page</option>
            </select>
            {["All", "Active", "Upcoming", "Completed"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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

      {/* Groups Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100/50 bg-white py-20 shadow-sm">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#1A2279]" />
          <p className="font-medium text-gray-500">Loading groups...</p>
        </div>
      ) : groups.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <GroupCard
                key={group._id}
                group={group}
                onClick={() => handleViewDetails(group._id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPage > 1 && (
            <div className="mt-6 flex items-center justify-end">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, meta.page - 1))}
                  disabled={meta.page === 1 || isLoading}
                  className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, meta.totalPage) }, (_, i) => {
                    let pageNum = i + 1;
                    if (meta.totalPage > 5) {
                      if (meta.page <= 3) {
                        pageNum = i + 1;
                      } else if (meta.page >= meta.totalPage - 2) {
                        pageNum = meta.totalPage - 4 + i;
                      } else {
                        pageNum = meta.page - 2 + i;
                      }
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={isLoading}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all ${
                          meta.page === pageNum
                            ? "bg-[#1A2279] text-white shadow-lg shadow-indigo-100"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum.toString().padStart(2, "0")}
                      </button>
                    );
                  })}
                  {meta.totalPage > 5 && <span className="px-2 text-gray-400">...</span>}
                </div>
                <button
                  onClick={() => handlePageChange(Math.min(meta.totalPage, meta.page + 1))}
                  disabled={meta.page === meta.totalPage || isLoading}
                  className="rounded-lg border border-gray-200 p-2 text-gray-400 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100/50 bg-white py-20 shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
            <Component className="h-8 w-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No groups found</h3>
          <p className="text-sm text-gray-500">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Group Details Modal Overlay */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
          <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-300">
            {isDetailLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#1A2279]" />
                <p className="font-sans font-medium text-gray-500">Loading group details...</p>
              </div>
            ) : selectedGroup ? (
              <>
                <div className="relative shrink-0 bg-gradient-to-r from-[#4F5BDB] to-[#1A2279] p-4 text-white sm:p-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                      {selectedGroup.status}
                    </span>
                    <button
                      onClick={() => setIsDetailModalOpen(false)}
                      className="transition-opacity hover:opacity-80"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <h2 className="mb-1 text-xl font-bold sm:text-2xl">{selectedGroup.name}</h2>
                  <p className="line-clamp-2 text-xs text-indigo-100 sm:text-sm">
                    {selectedGroup.description}
                  </p>
                </div>

                <div className="custom-scrollbar space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                      <p className="mb-1 text-xs font-medium text-gray-500">Contribution</p>
                      <p className="text-lg font-bold text-gray-900 sm:text-xl">
                        ${selectedGroup.contributionAmount}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {selectedGroup.contributionFrequency}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 sm:p-4">
                      <p className="mb-1 text-xs font-medium text-gray-500">Total Pool</p>
                      <p className="text-lg font-bold text-emerald-600 sm:text-xl">
                        ${selectedGroup.poolAmount}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Payout</p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Info className="h-4 w-4 shrink-0 text-[#1A2279]" />
                        <span className="truncate text-xs font-medium text-gray-600 sm:text-sm">
                          Invite Code
                        </span>
                      </div>
                      <span className="shrink-0 rounded-lg border border-indigo-100 bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#1A2279] sm:px-3 sm:text-sm">
                        {selectedGroup.inviteCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Users className="h-4 w-4 shrink-0 text-[#1A2279]" />
                        <span className="truncate text-xs font-medium text-gray-600 sm:text-sm">
                          Current Members
                        </span>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-gray-900 sm:text-sm">
                        {selectedGroup.currentMembers} / {selectedGroup.totalMembers}
                      </span>
                    </div>

                    {selectedGroup.status === "upcoming" &&
                      selectedGroup.currentMembers === selectedGroup.totalMembers && (
                        <button
                          onClick={() => handleStartGroup(selectedGroup._id)}
                          className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 sm:py-4"
                        >
                          Manual Start
                        </button>
                      )}
                  </div>

                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="w-full rounded-2xl bg-gray-100 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-200 sm:py-4"
                  >
                    Close Details
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Create Group Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
          <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl duration-300">
            {/* Modal Header */}
            <div className="relative shrink-0 rounded-b-3xl bg-gradient-to-r from-[#4F5BDB] to-[#1A2279] p-4 text-white">
              <div className="flex items-center justify-center gap-2">
                <ChevronLeft
                  className="absolute left-4 h-5 w-5 cursor-pointer hover:opacity-80"
                  onClick={() =>
                    currentStep > 1 ? setCurrentStep((s) => s - 1) : setIsModalOpen(false)
                  }
                />
                <h2 className="text-base font-semibold sm:text-lg">Create Group</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-1/2 right-4 -translate-y-1/2 hover:opacity-80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex shrink-0 items-center justify-between px-6 py-4 sm:px-10 sm:py-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all sm:h-8 sm:w-8 ${
                      currentStep === step
                        ? "bg-[#1A2279] text-white ring-4 ring-indigo-50"
                        : currentStep > step
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {currentStep > step ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`mx-1 h-0.5 w-8 sm:mx-2 sm:w-12 ${currentStep > step ? "bg-emerald-500" : "bg-gray-100"}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Content */}
            <div className="custom-scrollbar overflow-y-auto px-5 pb-6 sm:px-8 sm:pb-8">
              {currentStep === 1 && (
                <div className="animate-in slide-in-from-right space-y-6 duration-300">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">Group Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Family Savings Circle"
                        className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm transition-all outline-none focus:border-[#1A2279] focus:ring-2 focus:ring-indigo-100"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">Description</label>
                      <textarea
                        placeholder="Describe the purpose of this group..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm transition-all outline-none focus:border-[#1A2279] focus:ring-2 focus:ring-indigo-100"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="animate-in slide-in-from-right space-y-6 duration-300">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">Contribution Settings</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">
                        Contribution Amount ($)
                      </label>
                      <input
                        type="number"
                        placeholder="1000"
                        className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm transition-all outline-none focus:border-[#1A2279] focus:ring-2 focus:ring-indigo-100"
                        value={formData.contributionAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, contributionAmount: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">
                        Contribution Frequency
                      </label>
                      <select
                        className="w-full cursor-pointer rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm transition-all outline-none focus:border-[#1A2279] focus:ring-2 focus:ring-indigo-100"
                        value={formData.contributionFrequency}
                        onChange={(e) =>
                          setFormData({ ...formData, contributionFrequency: e.target.value })
                        }
                      >
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Total Members</label>
                        <input
                          type="number"
                          placeholder="5"
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm transition-all outline-none focus:border-[#1A2279] focus:ring-2 focus:ring-indigo-100"
                          value={formData.totalMembers}
                          onChange={(e) =>
                            setFormData({ ...formData, totalMembers: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Total Cycles</label>
                        <input
                          type="number"
                          placeholder="2"
                          className="w-full rounded-xl border border-gray-100 bg-gray-50 px-4 py-2.5 text-sm transition-all outline-none focus:border-[#1A2279] focus:ring-2 focus:ring-indigo-100"
                          value={formData.totalCycles}
                          onChange={(e) =>
                            setFormData({ ...formData, totalCycles: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    {/* <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-500">Start Date</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-[#1A2279] outline-none transition-all"
                        value={formData.startDate}
                        onChange={e => setFormData({...formData, startDate: e.target.value})}
                      />
                    </div> */}
                  </div>
                  <p className="text-center text-[10px] text-gray-400 italic">
                    Each member will contribute ${formData.contributionAmount}{" "}
                    {formData.contributionFrequency}
                  </p>
                </div>
              )}

              {currentStep === 3 && (
                <div className="animate-in slide-in-from-right space-y-6 duration-300">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900">Review Details</h3>
                  </div>
                  <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-medium text-gray-500">Group Name</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {formData.name || "Latif Circle"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-medium text-gray-500">Description</span>
                      <span className="max-w-[150px] text-right text-xs font-semibold text-gray-900">
                        {formData.description || "We are from Dhaka and we use the platform."}
                      </span>
                    </div>
                    <div className="flex items-start justify-between border-t border-gray-200 pt-4">
                      <span className="text-xs font-medium text-gray-500">Contribution</span>
                      <span className="text-xs font-semibold text-gray-900">
                        ${formData.contributionAmount} / {formData.contributionFrequency}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-medium text-gray-500">Group Size</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {formData.totalMembers} members
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-medium text-gray-500">Total Cycles</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {formData.totalCycles} cycles
                      </span>
                    </div>
                    {/* <div className="flex justify-between items-start">
                      <span className="text-xs font-medium text-gray-500">Start Date</span>
                      <span className="text-xs font-semibold text-gray-900">{formData.startDate}</span>
                    </div> */}
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-medium text-gray-500">Total Payout</span>
                      <span className="text-xs font-bold text-indigo-600">
                        ${Number(formData.contributionAmount) * Number(formData.totalMembers)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                    <p className="text-[10px] leading-relaxed text-indigo-700">
                      💡 As the group admin, you'll be able to manage members and invite others
                      using a unique invite code.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex gap-3">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep((s) => s - 1)}
                    className="flex-1 rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-200"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() =>
                    currentStep < 3 ? setCurrentStep((s) => s + 1) : handleCreateGroup()
                  }
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1A2279] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-100 transition-all hover:bg-indigo-900"
                >
                  {currentStep === 3 ? "Create Group" : "Continue"}
                  {currentStep < 3 && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
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
  color
}: {
  title: string;
  value: number;
  color: "indigo" | "emerald" | "orange";
}) {
  const colors = {
    indigo: "text-indigo-600",
    emerald: "text-emerald-500",
    orange: "text-orange-500"
  };

  return (
    <div className="rounded-2xl border border-gray-100/50 bg-white p-6 shadow-sm">
      <p className="mb-1 text-sm font-medium text-gray-500">{title}</p>
      <h3 className={`text-2xl font-bold ${colors[color]}`}>{value}</h3>
    </div>
  );
}

function GroupCard({ group, onClick }: { group: Group; onClick: () => void }) {
  const progress = Math.round((group.currentMembers / group.totalMembers) * 100);

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-gray-100/50 bg-white p-6 shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
    >
      <div>
        <div className="mb-4 flex items-start justify-between">
          <h3 className="line-clamp-1 font-bold text-gray-900 transition-colors group-hover:text-[#1A2279]">
            {group.name}
          </h3>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${
                group.status === "active"
                  ? "bg-emerald-50 text-emerald-600"
                  : group.status === "upcoming"
                    ? "bg-orange-50 text-orange-600"
                    : "bg-gray-50 text-gray-600"
              }`}
            >
              {group.status}
            </span>
            {group.status === "upcoming" &&
              group.startDate &&
              isPast(new Date(group.startDate)) &&
              !isToday(new Date(group.startDate)) && (
                <span className="rounded-full border border-red-100 bg-red-50 px-2 text-[10px] font-bold text-red-500">
                  Delayed
                </span>
              )}
            {group.status === "upcoming" && group.currentMembers === group.totalMembers && (
              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 text-[10px] font-bold text-emerald-600">
                Ready
              </span>
            )}
          </div>
        </div>
        <p className="mb-6 line-clamp-2 min-h-[40px] text-sm text-gray-400">{group.description}</p>

        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="font-medium">
              {group.currentMembers}/{group.totalMembers} members
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-bold text-gray-400">$</span>
            <span className="font-medium">
              ${group.contributionAmount} / {group.contributionFrequency}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="font-medium">
              Starts:{" "}
              {group.startDate
                ? (() => {
                    const date = new Date(group.startDate);
                    return isNaN(date.getTime()) ? "Invalid Date" : format(date, "MMM dd, yyyy");
                  })()
                : "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-50 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-400">Admin:</span>
          <span className="text-xs font-bold text-gray-700">
            {group.createdBy.firstName && group.createdBy.lastName
              ? `${group.createdBy.firstName} ${group.createdBy.lastName}`
              : group.createdBy.email}
          </span>
        </div>
        <div className="space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#1A2279] transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-[10px] font-bold text-gray-400">{progress}% filled</p>
        </div>
      </div>
    </div>
  );
}
