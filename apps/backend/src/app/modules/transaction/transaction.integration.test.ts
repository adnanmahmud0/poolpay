import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { Transaction } from "./transaction.model";
import { User } from "../user/user.model";

// Mocking models
jest.mock("./transaction.model", () => ({
  Transaction: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));

describe("Transaction Integration Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.USER,
    status: "active",
  };

  const mockTransaction = {
    _id: "txId",
    userId: mockUser._id,
    amount: 100,
    type: "contribution",
    status: "success",
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

  describe("GET /api/v1/transactions/my-transactions", () => {
    it("should return user transaction history", async () => {
      const mockResult = [mockTransaction];
      const mockQuery: any = {
        populate: jest.fn().mockReturnThis(),
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

      (Transaction.find as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app)
        .get("/api/v1/transactions/my-transactions")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0].amount).toBe(mockTransaction.amount);
    });
  });
});
