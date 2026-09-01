import request from "supertest";
import app from "../../../app";
import { generateToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { Role } from "../user/user.interface";
import httpStatus from "http-status-codes";
import { User } from "../user/user.model";

// Mocking models and stripe config
jest.mock("../user/user.model", () => ({
  User: {
    findById: jest.fn(),
  },
}));
jest.mock("../../config/stripe.config", () => ({
  stripe: {
    accountLinks: {
      create: jest.fn().mockResolvedValue({ url: "http://stripe.com/link" }),
    },
    accounts: {
      create: jest.fn().mockResolvedValue({ id: "acct_123" }),
      retrieve: jest.fn().mockResolvedValue({ 
        charges_enabled: true, 
        payouts_enabled: true, 
        details_submitted: true,
        requirements: { currently_due: [], eventually_due: [], errors: [] }
      }),
    },
  },
}));
jest.mock("../membership/membership.utils", () => ({
  validateMembershipAction: jest.fn().mockResolvedValue(true),
  MembershipAction: {
    COMPLETE_ONBOARDING: "COMPLETE_ONBOARDING",
  },
}));

describe("Stripe Integration Tests", () => {
  const mockUser = {
    _id: "507f1f77bcf86cd799439011",
    role: Role.USER,
    status: "active",
    stripeConnectedAccountId: "acct_123",
    save: jest.fn().mockResolvedValue(true),
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

  describe("POST /api/v1/stripe/connect/account-link", () => {
    it("should create a stripe account link", async () => {
      const response = await request(app)
        .post("/api/v1/stripe/connect/account-link")
        .set("Authorization", accessToken)
        .send({ returnUrl: "http://example.com/return", refreshUrl: "http://example.com/refresh" });

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toBe("http://stripe.com/link"); // Service returns accountLink.url
    });
  });

  describe("GET /api/v1/stripe/connect/status", () => {
    it("should return connect account status", async () => {
      const response = await request(app)
        .get("/api/v1/stripe/connect/status")
        .set("Authorization", accessToken);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data.connected).toBe(true); // Fixed property name
    });
  });
});
