import { Router } from "express";
import { AdminControllers } from "./admin.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";

import { AdminValidation } from "./admin.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

// Dashboard
router.get(
  "/dashboard/summary",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getDashboardSummary
);
router.get(
  "/dashboard/revenue-chart",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getRevenueChart
);
router.get(
  "/dashboard/user-growth",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getUserGrowth
);
router.get(
  "/dashboard/recent-users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getRecentUsers
);
router.get(
  "/dashboard/recent-activities",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getRecentActivities
);
router.get(
  "/pending-actions",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getPendingActions
);

// Users
router.get(
  "/users",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getAllUsers
);
router.get(
  "/users/export",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.exportUsers
);
router.get(
  "/users/stats",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getUserStats
);
router.get(
  "/users/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getUserById
);
router.patch(
  "/users/:id/status",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateUserStatusSchema),
  AdminControllers.updateUserStatus
);

// Groups
router.get(
  "/groups",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getAllGroups
);
router.get(
  "/groups/stats",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getGroupStats
);
router.get(
  "/groups/:id",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getGroupById
);
router.patch(
  "/groups/:id/status",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateGroupStatusSchema),
  AdminControllers.updateGroupStatus
);

// Funds
router.get(
  "/funds/summary",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getFundsSummary
);
router.get(
  "/funds/group-details",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getGroupFundDetails
);

// Payments
router.get(
  "/payments",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getAllPayments
);
router.get(
  "/payments/export",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.exportPayments
);

// Payouts
router.get(
  "/payouts",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getAllPayouts
);
router.post(
  "/payouts/:id/retry",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN), // Allow both Admin and Super Admin
  AdminControllers.retryPayout
);

// Reports
router.get(
  "/reports/financial",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getFinancialReport
);
router.get(
  "/reports/performance-overview",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getPerformanceReports
);
router.get(
  "/reports/performance",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getPerformanceAnalytics
);

// Settings
router.get(
  "/settings",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getSettings
);
router.patch(
  "/settings",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateSettingsSchema),
  AdminControllers.updateSettings
);
router.patch(
  "/settings/general",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateGeneralSettingsSchema),
  AdminControllers.updateGeneralSettings
);
router.patch(
  "/settings/financial",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateFinancialSettingsSchema),
  AdminControllers.updateFinancialSettings
);
router.patch(
  "/settings/contributions",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateContributionSettingsSchema),
  AdminControllers.updateContributionSettings
);
router.patch(
  "/settings/access-auth",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateAccessAuthSettingsSchema),
  AdminControllers.updateAccessAuthSettings
);
router.patch(
  "/settings/notifications",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateNotificationSettingsSchema),
  AdminControllers.updateNotificationSettings
);
router.patch(
  "/settings/contact",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  validateRequest(AdminValidation.updateContactSettingsSchema),
  AdminControllers.updateContactSettings
);

// Activity Logs
router.get(
  "/activity-logs",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getActivityLogs
);

router.get(
  "/audit-logs",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getAuditLogs
);

// Manual Review & Recovery Actions
router.get(
  "/manual-review",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getManualReviewActions
);

router.get(
  "/recovery-required",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.getRecoveryRequiredActions
);

// Resolution & Retry
router.post(
  "/payments/:id/resolve",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.resolvePayment
);

router.post(
  "/turns/:id/resolve",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.resolveTurn
);

router.post(
  "/payments/:id/retry",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.retryPayment
);

router.post(
  "/turns/:id/retry",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.retryTurn
);

// Debug/Mock Data
router.post(
  "/debug/seed-mock-data",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.seedMockData
);
router.delete(
  "/debug/clear-mock-data",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.clearMockData
);

router.post(
  "/debug/test-push-notification",
  checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
  AdminControllers.sendTestPushNotification
);

export const AdminRoutes = router;
