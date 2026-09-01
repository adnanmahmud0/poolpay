import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role, MembershipTier } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { Group } from "./group.model";
import { GroupMember } from "../groupMember/groupMember.model";
import { User } from "../user/user.model";
import { PaymentMethod } from "../paymentMethod/paymentMethod.model";

// Mocking models
jest.mock("./group.model", () => ({
  Group: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock("../groupMember/groupMember.model", () => ({
  GroupMember: {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
    findOne: jest.fn(),
  },
}));
jest.mock("../paymentMethod/paymentMethod.model", () => ({
  PaymentMethod: {
    countDocuments: jest.fn(),
    find: jest.fn(),
  },
}));
jest.mock("../auditLog/auditLog.model");
jest.mock("../notification/notification.model");
jest.mock("../../utils/activityLogger");
jest.mock("../../utils/sendSMS");

describe("Group Integration Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.USER,
    status: "active",
    membershipTier: MembershipTier.REGULAR,
    stripeConnectedAccountId: "acct_123",
    stripeConnectStatus: "verified",
    firstName: "John",
    lastName: "Doe",
    fullName: "John Doe",
  };

  const mockGroup = {
    _id: "507f191e810c19729de860ea",
    name: "Saving Group 1",
    totalMembers: 10,
    currentMembers: 1,
    inviteCode: "ABCDEF",
    status: "upcoming",
    isDeleted: false,
    createdBy: {
      _id: "507f1f77bcf86cd799439011",
      firstName: "John",
      lastName: "Doe",
    },
  };

  const accessToken = generateToken(
    { userId: mockUser._id, role: Role.USER },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    
    // Default mocks for common chains
    (Group.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(mockGroup),
      then: (resolve: any) => resolve(mockGroup),
    });
    
    (GroupMember.find as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([]),
      then: (resolve: any) => resolve([]),
    });
  });

  describe("POST /api/v1/groups", () => {
    it("should create a new group", async () => {
      (Group.countDocuments as jest.Mock).mockResolvedValue(0);
      (Group.create as jest.Mock).mockResolvedValue([mockGroup]);

      const response = await request(app)
        .post("/api/v1/groups")
        .set("Authorization", accessToken)
        .send({
          name: "Saving Group 1",
          description: "A group for saving money",
          contributionAmount: 100,
          contributionFrequency: "monthly",
          totalMembers: 10,
          totalCycles: 1,
        });

      expect(response.status).toBe(httpStatus.CREATED);
    });
  });

  describe("GET /api/v1/groups/:id", () => {
    it("should return group details", async () => {
      const response = await request(app)
        .get(`/api/v1/groups/${mockGroup._id}`)
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data._id).toBe(mockGroup._id);
    });
  });

  describe("POST /api/v1/group-members/join", () => {
    it("should join a group successfully", async () => {
      (Group.findOne as jest.Mock).mockResolvedValue(mockGroup);
      (GroupMember.findOne as jest.Mock).mockResolvedValue(null);
      (GroupMember.create as jest.Mock).mockResolvedValue([{ _id: "memberId" }]);
      (Group.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockGroup);
      (PaymentMethod.countDocuments as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .post("/api/v1/group-members/join")
        .set("Authorization", accessToken)
        .send({ inviteCode: "ABCDEF" });

      expect(response.status).toBe(httpStatus.CREATED);
      expect(response.body.success).toBe(true);
    });
  });
});
