import { AuthServices } from "./auth.service";
import { User } from "../user/user.model";
import bcryptjs from "bcryptjs";
import AppError from "../../errorHelpers/AppError";

jest.mock("../user/user.model");
jest.mock("../settings/settings.model");
jest.mock("../auditLog/auditLog.model");
jest.mock("../../utils/activityLogger");
jest.mock("../../utils/sendSMS");
jest.mock("bcryptjs");
jest.mock("../../utils/sendEmail", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));
jest.mock("../../utils/userTokens", () => ({
  createUserTokens: jest.fn().mockReturnValue({
    accessToken: "mockAccessToken",
    refreshToken: "mockRefreshToken",
  }),
}));
import { Settings } from "../settings/settings.model";

describe("AuthServices", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Settings.findOne as jest.Mock).mockResolvedValue({ isUserRegistrationEnabled: true });
  });

  describe("register", () => {
    it("should throw an error if user already exists", async () => {
      (User.findOne as jest.Mock).mockResolvedValue({ email: "test@example.com" });

      await expect(
        AuthServices.register({ 
          email: "test@example.com", 
          password: "Password123!", 
          firstName: "Test", 
          lastName: "User" 
        })
      ).rejects.toThrow(AppError);
    });

    it("should hash the password and create a new pending user", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcryptjs.hash as jest.Mock).mockResolvedValue("hashedPassword123");
      (User.create as jest.Mock).mockResolvedValue({
        _id: "60f7a3f8c8d3b320c4e1b5a9",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        status: "pending",
        toObject: jest.fn().mockReturnValue({
          _id: "60f7a3f8c8d3b320c4e1b5a9",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          status: "pending",
        }),
      });

      const result = await AuthServices.register({
        email: "test@example.com",
        password: "Password123!",
        firstName: "Test",
        lastName: "User",
      });

      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(bcryptjs.hash).toHaveBeenCalledWith("Password123!", expect.any(Number));
      expect(User.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          password: "hashedPassword123",
          status: "pending",
        })
      );
      expect(result).toHaveProperty("_id", "60f7a3f8c8d3b320c4e1b5a9");
    });
  });
});
