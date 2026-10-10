import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { User } from "../user/user.model";
import { Adjustment } from "./adjustment.model";

// Mocking models
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));
jest.mock("./adjustment.model", () => ({
  Adjustment: {
    find: jest.fn(),
    findById: jest.fn(),
  },
}));
jest.mock("../../queues/payment.queue", () => ({
  redistributionQueue: {
    add: jest.fn().mockResolvedValue({ id: "job_123" }),
  },
}));

describe("Adjustment Integration Tests", () => {
  const mockAdmin = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.ADMIN,
    status: "active",
  };

  const mockAdjustment = {
    _id: "507f1f77bcf86cd799439017",
    status: "failed",
    amount: 100,
  };

  const adminToken = generateToken(
    { userId: mockAdmin._id, role: Role.ADMIN },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockResolvedValue(mockAdmin);
  });

  describe("GET /api/v1/admin/adjustments", () => {
    it("should return all adjustments for admin", async () => {
      const mockResult = [mockAdjustment];
      const mockQuery: any = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        then: (resolve: any) => resolve(mockResult),
      };
      (Adjustment.find as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app)
        .get("/api/v1/admin/adjustments")
        .set("Authorization", adminToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/v1/admin/adjustments/:id/retry", () => {
    it("should retry a failed adjustment", async () => {
      const mockAdj: any = {
        ...mockAdjustment,
        save: jest.fn().mockResolvedValue(true),
      };
      (Adjustment.findById as jest.Mock).mockResolvedValue(mockAdj);

      const response = await request(app)
        .post(`/api/v1/admin/adjustments/${mockAdjustment._id}/retry`)
        .set("Authorization", adminToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
    });
  });
});
