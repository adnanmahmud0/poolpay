import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { User } from "../user/user.model";
import { Group } from "../group/group.model";
import { Payment } from "../payment/payment.model";
import { Settings } from "../settings/settings.model";
import { Revenue } from "../revenue/revenue.model";
import { Transaction } from "../transaction/transaction.model";
import { GroupMember } from "../groupMember/groupMember.model";

// Mocking mongoose session
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    startSession: jest.fn().mockResolvedValue({
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    }),
  };
});

// Mocking models
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock("../group/group.model", () => ({
  Group: {
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock("../payment/payment.model", () => ({
  Payment: {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock("../revenue/revenue.model", () => ({
  Revenue: {
    aggregate: jest.fn(),
  },
}));
jest.mock("../transaction/transaction.model", () => ({
  Transaction: {
    aggregate: jest.fn(),
  },
  TransactionType: {
    PAYOUT: "payout",
    CONTRIBUTION: "contribution",
  },
  TransactionStatus: {
    SUCCESS: "success",
  },
}));
jest.mock("../groupMember/groupMember.model", () => ({
  GroupMember: {
    countDocuments: jest.fn(),
  },
}));
jest.mock("../settings/settings.model", () => ({
  Settings: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

// Mocking utils to prevent timeouts
jest.mock("../../utils/activityLogger", () => ({
  logActivity: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../utils/notification.utils", () => ({
  sendPushNotification: jest.fn().mockResolvedValue(true),
  sendEmailNotification: jest.fn().mockResolvedValue(true),
}));

describe("Admin Integration Tests", () => {
  const createMockQuery = (result: any) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
    getFilter: jest.fn().mockReturnValue({}),
    model: {
      countDocuments: jest.fn().mockResolvedValue(1),
    },
    then: (resolve: any) => resolve(result),
  });

  const mockAdmin = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.ADMIN,
    status: "active",
  };

  const adminToken = generateToken(
    { userId: mockAdmin._id, role: Role.ADMIN },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockReturnValue(createMockQuery(mockAdmin));
  });

  describe("GET /api/v1/admin/dashboard/summary", () => {
    it("should return dashboard summary for admin", async () => {
      (User.countDocuments as jest.Mock).mockResolvedValue(100);
      (Group.countDocuments as jest.Mock).mockResolvedValue(10);
      (Payment.aggregate as jest.Mock).mockResolvedValue([
        { totalRevenue: 1000 },
      ]);
      (Revenue.aggregate as jest.Mock).mockResolvedValue([{ total: 500 }]);
      (Transaction.aggregate as jest.Mock).mockResolvedValue([
        { total: 10000 },
      ]);
      (GroupMember.countDocuments as jest.Mock).mockResolvedValue(50);

      const response = await request(app)
        .get("/api/v1/admin/dashboard/summary")
        .set("Authorization", adminToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toHaveProperty("totalUsers");
    });
  });

  describe("GET /api/v1/admin/users", () => {
    it("should return all users for admin", async () => {
      const mockUsers = [mockAdmin];
      (User.find as jest.Mock).mockReturnValue(createMockQuery(mockUsers));

      const response = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", adminToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data.data).toBeInstanceOf(Array);
    });
  });

  describe("PATCH /api/v1/admin/users/:id/status", () => {
    it("should update user status", async () => {
      const targetUserId = "507f1f77bcf86cd799439099";
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        _id: targetUserId,
        status: "suspended",
      });

      (User.findById as jest.Mock).mockImplementation((id) => {
        if (id === mockAdmin._id) return createMockQuery(mockAdmin);
        return createMockQuery({ _id: targetUserId, status: "active" });
      });

      const response = await request(app)
        .patch(`/api/v1/admin/users/${targetUserId}/status`)
        .set("Authorization", adminToken)
        .send({ status: "suspended" });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/v1/admin/settings", () => {
    it("should return global settings", async () => {
      const mockSettings = { isUserRegistrationEnabled: true };
      (Settings.findOne as jest.Mock).mockReturnValue(
        createMockQuery(mockSettings)
      );

      const response = await request(app)
        .get("/api/v1/admin/settings")
        .set("Authorization", adminToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data.isUserRegistrationEnabled).toBe(true);
    });
  });
});
