import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { GroupMember } from "./groupMember.model";
import { User } from "../user/user.model";
import { Group } from "../group/group.model";
import { PaymentMethod } from "../paymentMethod/paymentMethod.model";

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
jest.mock("./groupMember.model", () => ({
  GroupMember: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));
jest.mock("../group/group.model", () => ({
  Group: {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));
jest.mock("../paymentMethod/paymentMethod.model", () => ({
  PaymentMethod: {
    countDocuments: jest.fn(),
  },
}));
jest.mock("../turn/turn.service", () => ({
  TurnServices: {
    recalculateTurnsAfterRemoval: jest.fn().mockResolvedValue(true),
  },
}));
jest.mock("../notification/notification.model", () => ({
  Notification: {
    create: jest.fn().mockResolvedValue(true),
  },
  NotificationType: {
    PAYMENT_FAILED: "payment_failed",
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

describe("GroupMember Integration Tests", () => {
  const createMockQuery = (result: any) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    session: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
    save: jest.fn().mockResolvedValue(result),
    then: (resolve: any) => resolve(result),
  });

  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.USER,
    status: "active",
    stripeConnectStatus: "verified",
    stripeConnectedAccountId: "acct_123",
  };

  const mockGroup = {
    _id: "507f1f77bcf86cd799439012",
    name: "Savings Group",
  };

  const mockMember = {
    _id: "507f1f77bcf86cd799439013",
    userId: mockUser._id,
    groupId: mockGroup._id,
    role: "member",
    save: jest.fn().mockResolvedValue(true),
  };

  const accessToken = generateToken(
    { userId: mockUser._id, role: Role.USER },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockReturnValue(createMockQuery(mockUser));
    (PaymentMethod.countDocuments as jest.Mock).mockResolvedValue(1);
  });

  describe("POST /api/v1/group-members/join", () => {
    it("should join a group successfully", async () => {
      (Group.findById as jest.Mock).mockReturnValue(createMockQuery(mockGroup));
      (Group.findOne as jest.Mock).mockReturnValue(createMockQuery(mockGroup));
      (Group.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockGroup);
      (GroupMember.findOne as jest.Mock).mockReturnValue(createMockQuery(null));
      (GroupMember.create as jest.Mock).mockResolvedValue(mockMember);

      const response = await request(app)
        .post("/api/v1/group-members/join")
        .set("Authorization", accessToken)
        .send({ groupId: mockGroup._id, inviteCode: "ABC-123" });

      expect(response.status).toBe(httpStatus.CREATED);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /api/v1/group-members/my-groups", () => {
    it("should return user's joined groups", async () => {
      (GroupMember.aggregate as jest.Mock).mockResolvedValue([mockMember]);
      (GroupMember.find as jest.Mock).mockReturnValue(createMockQuery([mockMember]));

      const response = await request(app)
        .get("/api/v1/group-members/my-groups")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe("PATCH /api/v1/group-members/:id/remove", () => {
    it("should remove a member (Admin only)", async () => {
      const adminToken = generateToken(
        { userId: "507f1f77bcf86cd799439014", role: Role.ADMIN },
        envVars.JWT_ACCESS_SECRET,
        "1h"
      );
      (User.findById as jest.Mock).mockImplementation((id) => {
          if (id === "507f1f77bcf86cd799439014") return createMockQuery({ _id: "507f1f77bcf86cd799439014", role: Role.ADMIN, status: "active" });
          return createMockQuery(mockUser);
      });
      
      (GroupMember.findById as jest.Mock).mockReturnValue(createMockQuery(mockMember));
      (GroupMember.findByIdAndUpdate as jest.Mock).mockResolvedValue({ ...mockMember, status: "removed" });
      (Group.findById as jest.Mock).mockReturnValue(createMockQuery(mockGroup));
      (Group.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockGroup);

      const response = await request(app)
        .patch(`/api/v1/group-members/${mockMember._id}/remove`)
        .set("Authorization", adminToken)
        .send({ removalNote: "Violation", reason: "Violation" });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
    });
  });
});
