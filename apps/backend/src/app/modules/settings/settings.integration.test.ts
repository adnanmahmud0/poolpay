import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { Settings } from "./settings.model";
import { User } from "../user/user.model";

// Mocking Settings model
jest.mock("./settings.model", () => ({
  Settings: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));

describe("Settings Integration Tests", () => {
  const mockSettings = {
    key: "global",
    platformName: "PoolPay",
    transactionFeePercent: 5,
    supportEmail: "support@poolpay.com",
  };

  const adminToken = generateToken(
    { userId: "adminId", role: Role.ADMIN },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  const userToken = generateToken(
    { userId: "userId", role: Role.USER },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/settings", () => {
    it("should return settings for admin", async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: "adminId",
        role: Role.ADMIN,
        status: "active",
      });
      (Settings.findOne as jest.Mock).mockResolvedValue(mockSettings);

      const response = await request(app)
        .get("/api/v1/settings")
        .set("Authorization", adminToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data.platformName).toBe(mockSettings.platformName);
    });

    it("should return 403 for regular user", async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: "userId",
        role: Role.USER,
        status: "active",
      });
      const response = await request(app)
        .get("/api/v1/settings")
        .set("Authorization", userToken);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
  });

  describe("PATCH /api/v1/settings/update", () => {
    it("should update settings successfully", async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: "adminId",
        role: Role.ADMIN,
        status: "active",
      });
      (Settings.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...mockSettings,
        platformName: "NewName",
      });

      const response = await request(app)
        .patch("/api/v1/settings/update")
        .set("Authorization", adminToken)
        .send({ platformName: "NewName" });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data.platformName).toBe("NewName");
    });
  });
});
