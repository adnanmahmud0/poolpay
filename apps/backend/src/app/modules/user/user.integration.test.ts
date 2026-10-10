import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "./user.interface";
import httpStatus from "http-status-codes";
import { User } from "./user.model";

// Mocking User model
jest.mock("./user.model", () => {
  const mockModel = {
    findById: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    deleteOne: jest.fn(),
  };
  return {
    User: mockModel,
  };
});

describe("User Integration Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: Role.USER,
    isDeleted: false,
    status: "active",
  };

  const accessToken = generateToken(
    { userId: mockUser._id, role: Role.USER },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  const adminToken = generateToken(
    { userId: "adminId", role: Role.ADMIN },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/v1/user/me", () => {
    it("should return 200 and user profile with valid token", async () => {
      (User.findById as jest.Mock).mockImplementation((id) => {
        if (id === mockUser._id) {
          return {
            select: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue(mockUser),
            // For checkAuth which calls await User.findById(id) without lean()
            then: (resolve: any) => resolve(mockUser),
          };
        }
        return null;
      });

      const response = await request(app)
        .get("/api/v1/user/me")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data.email).toBe(mockUser.email);
    });
  });

  describe("GET /api/v1/user/all-users", () => {
    it("should return 200 for admin", async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        role: Role.ADMIN,
      });

      const mockQuery: any = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([mockUser]),
        getFilter: jest.fn().mockReturnValue({}),
        model: {
          countDocuments: jest.fn().mockResolvedValue(1),
        },
        // Support await result.build()
        then: (resolve: any) => resolve([mockUser]),
      };

      (User.find as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app)
        .get("/api/v1/user/all-users")
        .set("Authorization", adminToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it("should return 403 for regular user", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/v1/user/all-users")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
  });
});
