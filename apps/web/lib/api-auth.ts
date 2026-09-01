import axiosInstance from "./axios";

export const login = async (data: any) => {
  const response = await axiosInstance.post("/api/v1/auth/login", {
    ...data,
    isDashboardLogin: true
  });
  return response.data;
};

export const forgotPassword = async (data: { identifier: string }) => {
  const response = await axiosInstance.post("/api/v1/auth/forgot-password", data);
  return response.data;
};

export const resetPassword = async (data: any) => {
  const response = await axiosInstance.post("/api/v1/auth/reset-password", data);
  return response.data;
};

export const refreshToken = async (token: string) => {
  const response = await axiosInstance.post("/api/v1/auth/refresh-token", {
    refreshToken: token,
  });
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

export const getUsers = async (params: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const response = await axiosInstance.get("/api/v1/admin/users", { params });
  return response.data;
};

export const updateUserStatus = async (userId: string, status: string) => {
  const response = await axiosInstance.patch(`/api/v1/admin/users/${userId}/status`, { status });
  return response.data;
};

export const getDashboardSummary = async () => {
  const response = await axiosInstance.get("/api/v1/admin/dashboard/summary");
  return response.data;
};

export const getRecentActivities = async () => {
  const response = await axiosInstance.get("/api/v1/admin/dashboard/recent-activities");
  return response.data;
};

export const getFundsSummary = async () => {
  const response = await axiosInstance.get("/api/v1/admin/funds/summary");
  return response.data;
};

export const getGroupFundDetails = async (params: { page?: number; limit?: number }) => {
  const response = await axiosInstance.get("/api/v1/admin/funds/group-details", { params });
  return response.data;
};

export const getUserGrowth = async () => {
  const response = await axiosInstance.get("/api/v1/admin/dashboard/user-growth");
  return response.data;
};

export const getRevenueChartData = async () => {
  const response = await axiosInstance.get("/api/v1/admin/dashboard/revenue-chart");
  return response.data;
};

export const getRevenueMetrics = async () => {
  const response = await axiosInstance.get("/api/v1/revenue/metrics");
  return response.data;
};

export const getRevenueSummary = async () => {
  const response = await axiosInstance.get("/api/v1/admin/revenue/summary");
  return response.data;
};

export const getAuditLogs = async (params?: { page?: number; limit?: number; action?: string }) => {
  const response = await axiosInstance.get("/api/v1/admin/audit-logs", { params });
  return response.data;
};

export const getTurns = async (params?: { page?: number; limit?: number }) => {
  const response = await axiosInstance.get("/api/v1/admin/turns", { params });
  return response.data;
};

export const getPerformanceAnalytics = async () => {
  const response = await axiosInstance.get("/api/v1/admin/reports/performance");
  return response.data;
};

export const getPerformanceOverview = async () => {
  const response = await axiosInstance.get("/api/v1/admin/reports/performance-overview");
  return response.data;
};

export const getFinancialReport = async () => {
  const response = await axiosInstance.get("/api/v1/admin/reports/financial");
  return response.data;
};

export const getSettings = async () => {
  const response = await axiosInstance.get("/api/v1/admin/settings");
  return response.data;
};

export const updateSettings = async (data: any) => {
  const response = await axiosInstance.patch("/api/v1/admin/settings", data);
  return response.data;
};

export const getTransactions = async (params?: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  search?: string;
}) => {
  const response = await axiosInstance.get("/api/v1/transactions", { params });
  return response.data;
};

export const getGroups = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}) => {
  const response = await axiosInstance.get("/api/v1/admin/groups", { params });
  return response.data;
};

export const createGroup = async (data: any) => {
  const response = await axiosInstance.post("/api/v1/groups", data);
  return response.data;
};

export const getGroupDetails = async (groupId: string) => {
  const response = await axiosInstance.get(`/api/v1/groups/${groupId}`);
  return response.data;
};

export const startGroup = async (groupId: string) => {
  const response = await axiosInstance.post(`/api/v1/groups/${groupId}/start`);
  return response.data;
};

export const getNotifications = async (params?: { page?: number; limit?: number }) => {
  const response = await axiosInstance.get("/api/v1/notifications", { params });
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await axiosInstance.patch("/api/v1/notifications/mark-all-read");
  return response.data;
};

export const markNotificationRead = async (notificationId: string) => {
  const response = await axiosInstance.patch(`/api/v1/notifications/${notificationId}/read`);
  return response.data;
};

export const getAdvertisements = async () => {
  const response = await axiosInstance.get("/api/v1/advertisements");
  return response.data;
};

export const createAdvertisement = async (formData: FormData) => {
  const response = await axiosInstance.post("/api/v1/advertisements", formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const updateAdvertisement = async (adId: string, formData: FormData) => {
  const response = await axiosInstance.patch(`/api/v1/advertisements/${adId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteAdvertisement = async (adId: string) => {
  const response = await axiosInstance.delete(`/api/v1/advertisements/${adId}`);
  return response.data;
};

export const seedMockData = async () => {
  const response = await axiosInstance.post("/api/v1/admin/debug/seed-mock-data");
  return response.data;
};

export const clearMockData = async () => {
  const response = await axiosInstance.delete("/api/v1/admin/debug/clear-mock-data");
  return response.data;
};
