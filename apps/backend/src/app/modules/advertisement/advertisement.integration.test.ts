import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { Advertisement } from "./advertisement.model";
import { User } from "../user/user.model";

// Mocking models and storage
jest.mock("./advertisement.model", () => ({
  Advertisement: {
    find: jest.fn(),
    create: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));
jest.mock("../../utils/storage/storageFactory", () => ({
  storage: {
    uploadFile: jest.fn().mockResolvedValue("http://example.com/banner.jpg"),
  },
}));

describe("Advertisement Integration Tests", () => {
  const mockAdmin = {
    _id: "adminId",
    role: Role.ADMIN,
    status: "active",
  };

  const mockAd = {
    _id: "adId",
    title: "Big Sale",
    description: "Get 50% off",
    bannerImage: "http://example.com/image.jpg",
    isActive: true,
  };

  const adminToken = generateToken(
    { userId: mockAdmin._id, role: Role.ADMIN },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/v1/advertisements", () => {
    it("should create an advertisement as admin", async () => {
      (User.findById as jest.Mock).mockResolvedValue(mockAdmin);
      (Advertisement.create as jest.Mock).mockResolvedValue(mockAd);

      const response = await request(app)
        .post("/api/v1/advertisements")
        .set("Authorization", adminToken)
        .attach("bannerImage", Buffer.from("fake-image"), "test.jpg")
        .field("title", "Big Sale")
        .field("description", "Get 50% off");

      expect(response.status).toBe(httpStatus.CREATED);
      expect(response.body.data.title).toBe(mockAd.title);
    });

    it("should return 403 for regular user", async () => {
      const userToken = generateToken(
        { userId: "userId", role: Role.USER },
        envVars.JWT_ACCESS_SECRET,
        "1h"
      );
      (User.findById as jest.Mock).mockResolvedValue({
        _id: "userId",
        role: Role.USER,
        status: "active",
      });

      const response = await request(app)
        .post("/api/v1/advertisements")
        .set("Authorization", userToken)
        .send({ title: "Test" });

      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
  });

  describe("GET /api/v1/advertisements/active", () => {
    it("should return active advertisements", async () => {
      const mockResult = [mockAd];
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

      (Advertisement.find as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app).get("/api/v1/advertisements/active");

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});
