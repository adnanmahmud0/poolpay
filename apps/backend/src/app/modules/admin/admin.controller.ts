import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminServices } from "./admin.service";
import { JwtPayload } from "jsonwebtoken";

const getDashboardSummary = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getDashboardSummary();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Dashboard summary retrieved successfully",
    data: result,
  });
});

const getRevenueChart = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getRevenueChart();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Revenue chart data retrieved successfully",
    data: result,
  });
});

const getUserGrowth = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getUserGrowth();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User growth data retrieved successfully",
    data: result,
  });
});

const getRecentUsers = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getRecentUsers();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recent users retrieved successfully",
    data: result,
  });
});

const getRecentActivities = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getRecentActivities();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Recent activities retrieved successfully",
    data: result,
  });
});

const getPendingActions = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getPendingActions();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Pending actions retrieved successfully",
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getAllUsers(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Users retrieved successfully",
    data: result,
  });
});

const getUserStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getUserStats();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User stats retrieved successfully",
    data: result,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getUserById(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User details retrieved successfully",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user as JwtPayload;
  const result = await AdminServices.updateUserStatus(
    req.params.id as string,
    req.body.status,
    admin.role
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User status updated successfully",
    data: result,
  });
});

const getAllGroups = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getAllGroups(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Groups retrieved successfully",
    data: result,
  });
});

const getGroupStats = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getGroupStats();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Group stats retrieved successfully",
    data: result,
  });
});

const getGroupById = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getGroupById(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Group details retrieved successfully",
    data: result,
  });
});

const updateGroupStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.updateGroupStatus(
    req.params.id as string,
    req.body.status
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Group status updated successfully",
    data: result,
  });
});

const getFundsSummary = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getFundsSummary();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Funds summary retrieved successfully",
    data: result,
  });
});

const getGroupFundDetails = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getGroupFundDetails(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Group fund details retrieved successfully",
    data: result,
  });
});

const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getAllPayments(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments retrieved successfully",
    data: result,
  });
});

const getFinancialReport = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getFinancialReport();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Financial report retrieved successfully",
    data: result,
  });
});

const getPerformanceAnalytics = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await AdminServices.getPerformanceAnalytics();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Performance analytics retrieved successfully",
      data: result,
    });
  }
);

const getPerformanceReports = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await AdminServices.getPerformanceReports();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Performance reports overview retrieved successfully",
      data: result,
    });
  }
);

const getSettings = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.getSettings();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Settings retrieved successfully",
    data: result,
  });
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.updateSettings(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Settings updated successfully",
    data: result,
  });
});

const updateGeneralSettings = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminServices.updateGeneralSettings(req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "General settings updated successfully",
      data: result,
    });
  }
);

const updateFinancialSettings = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminServices.updateFinancialSettings(req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Financial settings updated successfully",
      data: result,
    });
  }
);

const updateContributionSettings = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminServices.updateContributionSettings(req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Contribution limit settings updated successfully",
      data: result,
    });
  }
);

const updateAccessAuthSettings = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminServices.updateAccessAuthSettings(req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Access & authentication settings updated successfully",
      data: result,
    });
  }
);

const updateNotificationSettings = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminServices.updateNotificationSettings(req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Notification settings updated successfully",
      data: result,
    });
  }
);

const updateContactSettings = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminServices.updateContactSettings(req.body);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Contact settings updated successfully",
      data: result,
    });
  }
);

const getActivityLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getActivityLogs(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Activity logs retrieved successfully",
    data: result,
  });
});

const getAllPayouts = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getAllPayouts(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payouts retrieved successfully",
    data: result,
  });
});

const retryPayout = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.retryPayout(req.params.id as string);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payout retry initiated successfully",
    data: result,
  });
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminServices.getAuditLogs(req.query);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Audit logs retrieved successfully",
    data: result,
  });
});

const getManualReviewActions = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await AdminServices.getManualReviewActions();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Manual review actions retrieved successfully",
      data: result,
    });
  }
);

const getRecoveryRequiredActions = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await AdminServices.getRecoveryRequiredActions();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Recovery required actions retrieved successfully",
      data: result,
    });
  }
);

const resolvePayment = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user as JwtPayload;
  const result = await AdminServices.resolvePayment(
    req.params.id as string,
    admin.userId || admin._id
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment resolved successfully",
    data: result,
  });
});

const resolveTurn = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user as JwtPayload;
  const result = await AdminServices.resolveTurn(
    req.params.id as string,
    admin.userId || admin._id
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Turn resolved successfully",
    data: result,
  });
});

const retryPayment = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user as JwtPayload;
  const result = await AdminServices.retryPayment(
    req.params.id as string,
    admin.userId || admin._id
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment retry initiated successfully",
    data: result,
  });
});

const retryTurn = catchAsync(async (req: Request, res: Response) => {
  const admin = req.user as JwtPayload;
  const result = await AdminServices.retryTurn(
    req.params.id as string,
    admin.userId || admin._id
  );
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Turn retry initiated successfully",
    data: result,
  });
});

const seedMockData = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.seedMockData();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Mock data seeded successfully",
    data: result,
  });
});

const clearMockData = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminServices.clearMockData();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Mock data cleared successfully",
    data: result,
  });
});

const sendTestPushNotification = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await AdminServices.sendTestPushNotification();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Test push notifications sent successfully",
      data: result,
    });
  }
);

const exportUsers = catchAsync(async (req: Request, res: Response) => {
  const workbook = await AdminServices.exportUsersToExcel(
    req.query as Record<string, string>
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=users.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

const exportPayments = catchAsync(async (req: Request, res: Response) => {
  const workbook = await AdminServices.exportPaymentsToExcel(
    req.query as Record<string, string>
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=payments.xlsx");

  await workbook.xlsx.write(res);
  res.end();
});

export const AdminControllers = {
  getDashboardSummary,
  getRevenueChart,
  getUserGrowth,
  getRecentUsers,
  getRecentActivities,
  getPendingActions,
  getAllUsers,
  getUserStats,
  getUserById,
  updateUserStatus,
  getAllGroups,
  getGroupStats,
  getGroupById,
  updateGroupStatus,
  getFundsSummary,
  getGroupFundDetails,
  getAllPayments,
  getFinancialReport,
  getPerformanceAnalytics,
  getPerformanceReports,
  getSettings,
  updateSettings,
  updateGeneralSettings,
  updateFinancialSettings,
  updateContributionSettings,
  updateAccessAuthSettings,
  updateNotificationSettings,
  updateContactSettings,
  getActivityLogs,
  getAllPayouts,
  retryPayout,
  getAuditLogs,
  getManualReviewActions,
  getRecoveryRequiredActions,
  resolvePayment,
  resolveTurn,
  retryPayment,
  retryTurn,
  seedMockData,
  clearMockData,
  sendTestPushNotification,
  exportUsers,
  exportPayments,
};
