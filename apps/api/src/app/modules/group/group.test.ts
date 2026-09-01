import { GroupServices } from "./group.service";
import { Group } from "./group.model";
import { GroupMember } from "../groupMember/groupMember.model";
import { GroupMemberServices } from "../groupMember/groupMember.service";
import { User } from "../user/user.model";
import { PaymentMethod } from "../paymentMethod/paymentMethod.model";
import { ContributionFrequency } from "./group.interface";
import AppError from "../../errorHelpers/AppError";
import mongoose from "mongoose";

jest.mock("./group.model");
jest.mock("../groupMember/groupMember.model");
jest.mock("../user/user.model");
jest.mock("../paymentMethod/paymentMethod.model");
jest.mock("mongoose", () => {
  const actualMongoose = jest.requireActual("mongoose");
  return {
    ...actualMongoose,
    startSession: jest.fn(),
  };
});

describe("GroupServices", () => {
  let mockSession: {
    startTransaction: jest.Mock;
    commitTransaction: jest.Mock;
    abortTransaction: jest.Mock;
    endSession: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };
    (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe("createGroup", () => {
    beforeEach(() => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: "mockUserId",
        role: "user",
        stripeConnectedAccountId: "acct_123",
        stripeConnectStatus: "verified",
      });
      (PaymentMethod.countDocuments as jest.Mock).mockResolvedValue(1);
    });

    it("should throw an error if missing contributionAmount or totalMembers", async () => {
      await expect(
        GroupServices.createGroup("mockUserId", { name: "Test Group" })
      ).rejects.toThrow(AppError);
    });

    it("should create a group successfully and generate an invite code", async () => {
      (Group.findOne as jest.Mock).mockResolvedValueOnce(null);
      (Group.create as jest.Mock).mockResolvedValue([{
        _id: "mockGroupId",
        name: "Test Group",
        inviteCode: "ABCDEF",
      }]);
      (GroupMember.create as jest.Mock).mockResolvedValue([{
        _id: "507f1f77bcf86cd799439011",
      }]);

      const payload = {
        name: "Test Group",
        contributionAmount: 100,
        totalMembers: 5,
        contributionFrequency: ContributionFrequency.MONTHLY,
        startDate: new Date(),
      };

      const result = await GroupServices.createGroup("60f7a3f8c8d3b320c4e1b5a9", payload);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(Group.create).toHaveBeenCalled();
      expect(GroupMember.create).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
      expect(result).toHaveProperty("inviteCode", "ABCDEF");
    });
  });

  describe("joinGroup", () => {
    beforeEach(() => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: "mockUserId",
        role: "user",
        stripeConnectedAccountId: "acct_123",
        stripeConnectStatus: "verified",
      });
      (PaymentMethod.countDocuments as jest.Mock).mockResolvedValue(1);
    });

    it("should throw error if invite code is invalid", async () => {
      (Group.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        GroupMemberServices.joinGroup("507f1f77bcf86cd799439011", "INVALID")
      ).rejects.toThrow(AppError);
    });

    it("should throw error if group is full", async () => {
      (Group.findOne as jest.Mock).mockResolvedValue({
        currentMembers: 5,
        totalMembers: 5,
        status: "upcoming",
      });

      await expect(
        GroupMemberServices.joinGroup("507f1f77bcf86cd799439011", "FULL12")
      ).rejects.toThrow(AppError);
    });

    it("should create membership if joining is valid", async () => {
      const mockGroup = {
        _id: "507f191e810c19729de860ea",
        currentMembers: 2,
        totalMembers: 5,
        status: "upcoming",
        contributionAmount: 100,
        contributionFrequency: ContributionFrequency.MONTHLY,
      };
      (Group.findOne as jest.Mock).mockResolvedValue(mockGroup);
      (GroupMember.findOne as jest.Mock).mockResolvedValue(null);
      (GroupMember.create as jest.Mock).mockResolvedValue([{ _id: "507f1f77bcf86cd799439011" }]);

      const result = await GroupMemberServices.joinGroup(
        "507f1f77bcf86cd799439011",
        "VALID1"
      );

      expect(result).toHaveProperty("_id", "507f1f77bcf86cd799439011");
    });
  });
});
