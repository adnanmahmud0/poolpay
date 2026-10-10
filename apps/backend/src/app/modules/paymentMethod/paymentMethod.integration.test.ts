import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { PaymentMethod } from "./paymentMethod.model";
import { User } from "../user/user.model";

// Mocking models and stripe config
jest.mock("./paymentMethod.model", () => ({
  PaymentMethod: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));
jest.mock("../../config/stripe.config", () => ({
  stripe: {
    setupIntents: {
      create: jest.fn().mockResolvedValue({ client_secret: "secret_123" }),
    },
    paymentMethods: {
      retrieve: jest
        .fn()
        .mockResolvedValue({
          id: "pm_123",
          card: { brand: "visa", last4: "4242" },
        }),
      attach: jest.fn().mockResolvedValue({ id: "pm_123" }),
    },
    customers: {
      update: jest.fn().mockResolvedValue({ id: "cust_123" }),
    },
  },
}));

describe("PaymentMethod Integration Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.USER,
    status: "active",
    stripeCustomerId: "cust_123",
  };

  const mockPaymentMethod = {
    _id: "507f1f77bcf86cd799439015",
    userId: mockUser._id,
    stripePaymentMethodId: "pm_123",
    cardBrand: "visa",
    last4: "4242",
    isDefault: true,
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
    then: (resolve: any) => resolve(result),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (User.findById as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /api/v1/payment-methods/", () => {
    it("should return user payment methods", async () => {
      (PaymentMethod.find as jest.Mock).mockReturnValue(
        createMockQuery([mockPaymentMethod])
      );

      const response = await request(app)
        .get("/api/v1/payment-methods/")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe("POST /api/v1/payment-methods/create-setup-intent", () => {
    it("should create a stripe setup intent", async () => {
      const response = await request(app)
        .post("/api/v1/payment-methods/create-setup-intent")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toHaveProperty("clientSecret");
    });
  });

  describe("DELETE /api/v1/payment-methods/:id", () => {
    it("should delete a payment method", async () => {
      (PaymentMethod.findOne as jest.Mock).mockResolvedValue(mockPaymentMethod);
      (PaymentMethod.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        mockPaymentMethod
      );
      (PaymentMethod.findByIdAndDelete as jest.Mock).mockResolvedValue(
        mockPaymentMethod
      );

      const response = await request(app)
        .delete(`/api/v1/payment-methods/${mockPaymentMethod._id}`)
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.success).toBe(true);
    });
  });
});
