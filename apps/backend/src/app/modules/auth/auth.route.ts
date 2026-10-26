import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { authLimiter } from "../../middlewares/authLimiter";
import { Role } from "../user/user.interface";
import { AuthControllers } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateRequest(AuthValidation.registerValidationSchema),
  AuthControllers.register
);

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidation.loginValidationSchema),
  AuthControllers.credentialsLogin
);

router.post(
  "/verify-2fa",
  authLimiter,
  validateRequest(AuthValidation.verify2FAValidationSchema),
  AuthControllers.verify2FA
);

router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenSchema),
  AuthControllers.getNewAccessToken
);

router.post("/logout", AuthControllers.logout);

router.post(
  "/change-password",
  checkAuth(...Object.values(Role)),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthControllers.changePassword
);

router.post(
  "/set-password",
  checkAuth(...Object.values(Role)),
  validateRequest(AuthValidation.setPasswordSchema),
  AuthControllers.setPassword
);

router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(AuthValidation.forgotPasswordValidationSchema),
  AuthControllers.forgotPassword
);

router.post(
  "/reset-password",
  authLimiter,
  validateRequest(AuthValidation.resetPasswordValidationSchema),
  AuthControllers.resetPassword
);

router.post(
  "/verify-email",
  authLimiter,
  validateRequest(AuthValidation.verifyEmailSchema),
  AuthControllers.verifyEmail
);

router.post(
  "/resend-verification-code",
  authLimiter,
  validateRequest(AuthValidation.resendVerificationCodeSchema),
  AuthControllers.resendVerificationCode
);

// Self-Service Data & Account Deletion (Google Play & Privacy Compliance)
router.post(
  "/data-deletion/request-otp",
  authLimiter,
  validateRequest(AuthValidation.requestDeletionOtpSchema),
  AuthControllers.requestDataDeletionOtp
);

router.post(
  "/data-deletion/verify-otp",
  authLimiter,
  validateRequest(AuthValidation.verifyDeletionOtpSchema),
  AuthControllers.verifyDataDeletionOtp
);

router.post(
  "/data-deletion/confirm",
  authLimiter,
  validateRequest(AuthValidation.confirmDeletionSchema),
  AuthControllers.confirmDataDeletion
);

export const AuthRoutes = router;
