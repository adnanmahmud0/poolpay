import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { ChatMessage } from "./chat.model";
import { User } from "../user/user.model";
import { GroupMember } from "../groupMember/groupMember.model";
import { Group } from "../group/group.model";

// Mocking models and storage
jest.mock("./chat.model", () => ({
  ChatMessage: {
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
  MessageType: {
    TEXT: "text",
    IMAGE: "image",
    VIDEO: "video",
    MEDIA: "media",
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
  },
}));
jest.mock("../groupMember/groupMember.model", () => ({
  GroupMember: {
    findOne: jest.fn(),
  },
}));
jest.mock("../../utils/storage/storageFactory", () => ({
  storage: {
    uploadFile: jest.fn().mockResolvedValue("http://example.com/file.jpg"),
  },
}));

describe("Chat Integration Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.USER,
    status: "active",
  };

  const mockGroup = {
    _id: "507f1f77bcf86cd799439012",
  };

  const mockMessage = {
    _id: "507f1f77bcf86cd799439016",
    senderId: mockUser._id,
    groupId: mockGroup._id,
    message: "Hello world",
    messageType: "text",
  };

  const accessToken = generateToken(
    { userId: mockUser._id, role: Role.USER },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  const createMockQuery = (result: any) => ({
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
    getFilter: jest.fn().mockReturnValue({}),
    model: {
      countDocuments: jest.fn().mockResolvedValue(1),
    },
    then: (resolve: any) => resolve(result),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
    (Group.findById as jest.Mock).mockResolvedValue(mockGroup);
    (GroupMember.findOne as jest.Mock).mockResolvedValue({
      userId: mockUser._id,
      groupId: mockGroup._id,
    });
  });

  describe("GET /api/v1/chat/group/:groupId/messages", () => {
    it("should return group messages", async () => {
      const mockResult = [mockMessage];
      (ChatMessage.find as jest.Mock).mockReturnValue(
        createMockQuery(mockResult)
      );

      const response = await request(app)
        .get(`/api/v1/chat/group/${mockGroup._id}/messages`)
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/v1/chat/group/:groupId/messages", () => {
    it("should send a text message successfully", async () => {
      (ChatMessage.create as jest.Mock).mockResolvedValue(mockMessage);

      const response = await request(app)
        .post(`/api/v1/chat/group/${mockGroup._id}/messages`)
        .set("Authorization", accessToken)
        .send({ message: "Hello world" });

      expect(response.status).toBe(httpStatus.CREATED); // Updated expectation
      expect(response.body.success).toBe(true);
    });

    it("should send a message with images", async () => {
      (ChatMessage.create as jest.Mock).mockResolvedValue({
        ...mockMessage,
        messageType: "image",
        attachments: [{ url: "http://example.com/file.jpg", type: "image" }],
      });

      const response = await request(app)
        .post(`/api/v1/chat/group/${mockGroup._id}/messages`)
        .set("Authorization", accessToken)
        .attach("images", Buffer.from("fake-image"), "test.jpg")
        .field("message", "Check this out");

      expect(response.status).toBe(httpStatus.CREATED); // Updated expectation
      expect(response.body.success).toBe(true);
    });
  });
});
