
import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import { envVars } from "../../config/env";
import { checkAuth } from "../../middlewares/checkAuth";
import { sendMobileRedirect } from "../../utils/mobileRedirect";

import validateRequest from "../../middlewares/validateRequest";
import { authLimiter } from "../../middlewares/authLimiter";
import { Role, type IUser } from "../user/user.interface";
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
  "/firebase-login",
  authLimiter,
  validateRequest(AuthValidation.firebaseLoginSchema),
  AuthControllers.firebaseLogin
);

router.post(
  "/google",
  authLimiter,
  validateRequest(AuthValidation.firebaseLoginSchema),
  AuthControllers.firebaseLogin
);

router.post(
  "/facebook",
  authLimiter,
  validateRequest(AuthValidation.firebaseLoginSchema),
  AuthControllers.firebaseLogin
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

// Google OAuth Routes
router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  const stateObj = {
    redirect: (req.query.redirect as string) || "/",
    isDashboardLogin: req.query.isDashboardLogin === "true",
  };
  const state = Buffer.from(JSON.stringify(stateObj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: state,
  })(req, res, next);
});

// Facebook OAuth Routes
router.get("/facebook", (req: Request, res: Response, next: NextFunction) => {
  const stateObj = {
    redirect: (req.query.redirect as string) || "/",
    isDashboardLogin: req.query.isDashboardLogin === "true",
  };
  const state = Buffer.from(JSON.stringify(stateObj))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  passport.authenticate("facebook", {
    scope: ["email"],
    state: state,
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.state as string;
    const isDeepLink = /^[a-z][a-z0-9+.-]*:\/\//.test(redirect);

    passport.authenticate(
      "google",
      (err: Error | null, user: IUser | false, info: { message?: string }) => {
        if (err || !user) {
          const failureUrl = isDeepLink
            ? `${redirect}${redirect.includes("?") ? "&" : "?"}error=${info?.message || "auth_failed"}`
            : `${envVars.FRONTEND_URL}/login?error=auth_failed`;

          if (isDeepLink) {
            return sendMobileRedirect(res, failureUrl, "Authentication Failed");
          }
          return res.redirect(failureUrl);
        }

        req.user = user;
        return AuthControllers.googleCallbackController(req, res, next);
      }
    )(req, res, next);
  }
);

router.get(
  "/facebook/callback",
  (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.state as string;
    const isDeepLink = /^[a-z][a-z0-9+.-]*:\/\//.test(redirect);

    passport.authenticate(
      "facebook",
      (err: Error | null, user: IUser | false, info: { message?: string }) => {
        if (err || !user) {
          const failureUrl = isDeepLink
            ? `${redirect}${redirect.includes("?") ? "&" : "?"}error=${info?.message || "auth_failed"}`
            : `${envVars.FRONTEND_URL}/login?error=auth_failed`;

          if (isDeepLink) {
            return sendMobileRedirect(res, failureUrl, "Authentication Failed");
          }
          return res.redirect(failureUrl);
        }

        req.user = user;
        return AuthControllers.facebookCallbackController(req, res, next);
      }
    )(req, res, next);
  }
);

export const AuthRoutes = router;
