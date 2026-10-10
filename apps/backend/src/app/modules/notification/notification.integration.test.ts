import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { Notification } from "./notification.model";
import { User } from "../user/user.model";

// Mocking models
jest.mock("./notification.model", () => ({
  Notification: {
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));

describe("Notification Integration Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.USER,
    status: "active",
  };

  const mockNotification = {
    _id: "507f191e810c19729de860ea",
    userId: mockUser._id,
    title: "Test Notification",
    message: "This is a test notification",
    isRead: false,
  };

  const accessToken = generateToken(
    { userId: mockUser._id, role: Role.USER },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /api/v1/notifications/", () => {
    it("should return user notifications", async () => {
      const mockResult = [mockNotification];
      const mockQuery: any = {
        find: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockResult),
        getFilter: jest.fn().mockReturnValue({}),
        model: {
          countDocuments: jest.fn().mockResolvedValue(1),
        },
        then: (resolve: any) => resolve(mockResult),
      };

      (Notification.find as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app)
        .get("/api/v1/notifications/")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      // The controller returns the whole result object { data, meta } as 'data' in sendResponse
      expect(response.body.data.data).toBeInstanceOf(Array);
      expect(response.body.data.data[0].title).toBe(mockNotification.title);
    });
  });

  describe("PATCH /api/v1/notifications/:id/read", () => {
    it("should mark notification as read", async () => {
      (Notification.findOneAndUpdate as jest.Mock).mockResolvedValue({
        ...mockNotification,
        isRead: true,
      });

      const response = await request(app)
        .patch(`/api/v1/notifications/${mockNotification._id}/read`)
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
    });
  });
});
