import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { stripe } from "../../config/stripe.config";
import { Payment } from "./payment.model";
import { User } from "../user/user.model";

// Mocking models and stripe
jest.mock("./payment.model", () => ({
  Payment: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
jest.mock("../../config/stripe.config", () => ({
  stripe: {
    paymentMethods: {
      retrieve: jest.fn(),
      attach: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      update: jest.fn(),
    },
    setupIntents: {
      create: jest.fn(),
    },
  },
}));
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));

describe("Payment Integration Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    stripeCustomerId: "cus_123",
    role: Role.USER,
    status: "active",
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

  describe("POST /api/v1/payment-methods/create-setup-intent", () => {
    it("should return client secret for setup intent", async () => {
      (stripe.setupIntents.create as jest.Mock).mockResolvedValue({
        id: "si_123",
        client_secret: "secret_123",
      });

      const response = await request(app)
        .post("/api/v1/payment-methods/create-setup-intent")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data.clientSecret).toBe("secret_123");
    });
  });

  describe("GET /api/v1/payments/my-payments", () => {
    it("should return user payments", async () => {
      const mockResult = [{ _id: "pay_123", amount: 100 }];
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

      (Payment.find as jest.Mock).mockReturnValue(mockQuery);

      const response = await request(app)
        .get("/api/v1/payments/my-payments")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0].amount).toBe(100);
    });
  });
});
