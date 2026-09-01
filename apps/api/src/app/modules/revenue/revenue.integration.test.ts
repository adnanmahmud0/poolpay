import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { User } from "../user/user.model";
import { Revenue } from "./revenue.model";
import { Transaction } from "../transaction/transaction.model";
import { Adjustment } from "../payout/adjustment.model";

// Mocking models
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));
jest.mock("./revenue.model", () => ({
  Revenue: {
    find: jest.fn(),
    aggregate: jest.fn(),
  },
  FeeType: {
    LATE_FEE: "late_fee",
  },
}));
jest.mock("../transaction/transaction.model", () => ({
  Transaction: {
    aggregate: jest.fn(),
  },
  TransactionType: {
    CONTRIBUTION: "contribution",
    PAYOUT: "payout",
  },
  TransactionStatus: {
    SUCCESS: "success",
  },
}));
jest.mock("../payout/adjustment.model", () => ({
  Adjustment: {
    aggregate: jest.fn(),
  },
}));

describe("Revenue Integration Tests", () => {
  const mockAdmin = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.ADMIN,
    status: "active",
  };

  const adminToken = generateToken(
    { userId: mockAdmin._id, role: Role.ADMIN },
    envVars.JWT_ACCESS_SECRET,
    "1h"
  );

  const createMockQuery = (result: any) => ({
    find: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    paginate: jest.fn().mockReturnThis(),
    fields: jest.fn().mockReturnThis(),
    filter: jest.fn().mockReturnThis(),
    build: jest.fn().mockResolvedValue(result),
    getMeta: jest.fn().mockImplementation(async function(this: any) {
        return { page: 1, limit: 10, total: 1, totalPage: 1 };
    }),
    model: {
      countDocuments: jest.fn().mockResolvedValue(1),
    },
    getFilter: jest.fn().mockReturnValue({}),
    then: (resolve: any) => resolve(result),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockReturnValue(createMockQuery(mockAdmin));
  });

  describe("GET /api/v1/revenue/", () => {
    it("should return revenue statistics for admin", async () => {
      const mockData = [{ amount: 100 }];
      (Revenue.find as jest.Mock).mockReturnValue(createMockQuery(mockData));
      (Revenue.aggregate as jest.Mock).mockResolvedValue([{ total: 100 }]);

      const response = await request(app)
        .get("/api/v1/revenue/")
        .set("Authorization", adminToken);

      expect(response.status).toBe(httpStatus.OK);
      // The controller sends { data: result.data, extra: result.stats }
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.extra).toHaveProperty("total");
    });
  });

  describe("GET /api/v1/revenue/metrics", () => {
    it("should return revenue metrics for admin", async () => {
      (Transaction.aggregate as jest.Mock).mockResolvedValue([{ totalContribution: 1000, platformCommission: 50 }]);
      (Revenue.aggregate as jest.Mock).mockResolvedValue([{ totalLateFees: 10 }]);
      (Adjustment.aggregate as jest.Mock).mockResolvedValue([{ totalRedistributed: 5 }]);

      const response = await request(app)
        .get("/api/v1/revenue/metrics")
        .set("Authorization", adminToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toHaveProperty("totalRevenue");
    });
  });
});
