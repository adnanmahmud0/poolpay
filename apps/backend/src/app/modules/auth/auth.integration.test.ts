import request from "supertest";
import app from "../../../app";
import { User } from "../user/user.model";
import { Settings } from "../settings/settings.model";
import { Role, UserStatus } from "../user/user.interface";
import httpStatus from "http-status-codes";
import bcryptjs from "bcryptjs";

// Mocking models and utilities
jest.mock("../user/user.model", () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock("../settings/settings.model", () => ({
  Settings: {
    findOne: jest.fn(),
  },
}));
jest.mock("../../utils/sendEmail", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../utils/sendSMS", () => ({
  sendSMS: jest.fn().mockResolvedValue(true),
}));
jest.mock("../auditLog/auditLog.model");
jest.mock("../../utils/activityLogger");
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashedPassword"),
  compare: jest.fn().mockResolvedValue(true),
}));

describe("Auth Integration Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    password: "hashedPassword",
    role: Role.USER,
    status: UserStatus.ACTIVE,
    isVerified: true,
    toObject: jest.fn().mockReturnThis(),
    save: jest.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Settings.findOne as jest.Mock).mockResolvedValue({
      isUserRegistrationEnabled: true,
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user successfully", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (User.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).post("/api/v1/auth/register").send({
        email: "john@example.com",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        agreeToTerms: true,
      });

      expect(response.status).toBe(httpStatus.CREATED);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(mockUser.email);
    });

    it("should fail if user already exists", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app).post("/api/v1/auth/register").send({
        email: "john@example.com",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
        phone: "1234567890",
        agreeToTerms: true,
      });

      expect(response.status).toBe(httpStatus.CONFLICT);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("should login successfully with correct credentials", async () => {
      const mockUserWithPass: any = {
        ...mockUser,
        select: jest.fn().mockReturnThis(),
        save: jest.fn().mockResolvedValue(true),
        then: (resolve: any) =>
          resolve({ ...mockUser, password: "hashedPassword" }),
      };
      (User.findOne as jest.Mock).mockReturnValue(mockUserWithPass);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app).post("/api/v1/auth/login").send({
        identifier: "john@example.com",
        password: "Password123!",
      });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toHaveProperty("accessToken");
    });

    it("should fail with incorrect password", async () => {
      const mockUserWithPass: any = {
        ...mockUser,
        select: jest.fn().mockReturnThis(),
        then: (resolve: any) =>
          resolve({ ...mockUser, password: "hashedPassword" }),
      };
      (User.findOne as jest.Mock).mockReturnValue(mockUserWithPass);
      (bcryptjs.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app).post("/api/v1/auth/login").send({
        identifier: "john@example.com",
        password: "wrongPassword",
      });

      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe("POST /api/v1/auth/forgot-password", () => {
    it("should generate and send recovery code", async () => {
      const mockUserWithSelect: any = {
        ...mockUser,
        select: jest.fn().mockReturnThis(),
        save: jest.fn().mockResolvedValue(true),
        then: (resolve: any) => resolve(mockUser),
      };
      (User.findOne as jest.Mock).mockReturnValue(mockUserWithSelect);

      const response = await request(app)
        .post("/api/v1/auth/forgot-password")
        .send({ identifier: "john@example.com" });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
    });
  });
});
