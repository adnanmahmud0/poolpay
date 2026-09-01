import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { setAuthCookie } from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userTokens";
import { sendMobileRedirect } from "../../utils/mobileRedirect";
import { HydratedDocument } from "mongoose";
import { AuthServices } from "./auth.service";
import { IUser, Role } from "../user/user.interface";
import { getSocialAuthErrorPageHTML } from "../../utils/legalPages";

const register = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.register(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Registration successful. Please verify your account with the code sent to your email and phone number.",
    data: result,
  });
});

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const { identifier, code } = req.body;
  const result = await AuthServices.verifyEmail(identifier, code);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const resendVerificationCode = catchAsync(async (req: Request, res: Response) => {
  const { identifier } = req.body;
  const result = await AuthServices.resendVerificationCode(identifier);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Platform detection (Automatic detection of Web vs App)
    const userAgent = req.headers["user-agent"] || "";
    const isBrowser = /mozilla|chrome|safari|edg|opera|msie|trident/i.test(userAgent);
    const isDashboardLogin = req.body.isDashboardLogin ?? isBrowser;

    if (envVars.AUTH_SYSTEM === "passport") {
      passport.authenticate("local", async (err: Error | null, user: IUser, info: { message: string }) => {
        if (err) {
          return next(new AppError(httpStatus.UNAUTHORIZED, err.message));
        }

        if (!user) {
          return next(new AppError(httpStatus.UNAUTHORIZED, info?.message || "Authentication failed"));
        }

        // Dashboard Access Control for Passport
        if (isDashboardLogin) {
          if (user.role !== Role.ADMIN && user.role !== Role.SUPER_ADMIN) {
            return next(
              new AppError(
                httpStatus.FORBIDDEN,
                "Access Denied: Only administrators can access the dashboard."
              )
            );
          }
        }

        const userTokens = createUserTokens(user);
        const { password: _password, ...rest } = (user as HydratedDocument<IUser>).toObject();

        setAuthCookie(res, userTokens);

        sendResponse(res, {
          success: true,
          statusCode: httpStatus.OK,
          message: "User Logged In Successfully!",
          data: {
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
            user: rest,
          },
        });
      })(req, res, next);
    } else {
      // Custom JWT Authentication
      const result = await AuthServices.credentialsLogin({
        ...req.body,
        isDashboardLogin,
      });

      // If 2FA is required, don't set cookies yet, just return the requirement
      if (result.requires2FA) {
        return sendResponse(res, {
          success: true,
          statusCode: httpStatus.OK,
          message: result.message,
          data: {
            requires2FA: true,
            email: result.email,
            phone: result.phone,
          },
        });
      }

      setAuthCookie(res, {
        accessToken: result.accessToken as string,
        refreshToken: result.refreshToken as string,
      });

      sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "User Logged In Successfully!",
        data: result,
      });
    }
  }
);

const verify2FA = catchAsync(async (req: Request, res: Response) => {
  const { identifier, code } = req.body;
  const result = await AuthServices.verify2FA(identifier, code);

  setAuthCookie(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "2FA Verified! Logged In Successfully.",
    data: result,
  });
});

const getNewAccessToken = catchAsync(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    if (!refreshToken) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "No refresh token received from cookies or body"
      );
    }
    const tokenInfo = await AuthServices.getNewAccessToken(
      refreshToken as string
    );

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "New Access Token Retrieved Successfully",
      data: tokenInfo,
    });
  }
);

const logout = catchAsync(
  async (_req: Request, res: Response) => {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: envVars.NODE_ENV === "production",
      sameSite: "lax",
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: envVars.NODE_ENV === "production",
      sameSite: "lax",
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User Logged Out Successfully",
      data: null,
    });
  }
);

const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    const { newPassword, oldPassword } = req.body;
    const decodedToken = req.user;

    await AuthServices.changePassword(
      oldPassword,
      newPassword,
      decodedToken as JwtPayload
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Changed Successfully",
      data: null,
    });
  }
);

const resetPassword = catchAsync(
  async (req: Request, res: Response) => {
    await AuthServices.resetPassword(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Reset Successfully",
      data: null,
    });
  }
);

const setPassword = catchAsync(
  async (req: Request, res: Response) => {
    const decodedToken = req.user as JwtPayload;
    const { password } = req.body;

    await AuthServices.setPassword(decodedToken.userId, password);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password Set Successfully",
      data: null,
    });
  }
);

const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { identifier } = req.body;

    await AuthServices.forgotPassword(identifier);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password reset code sent successfully to your email and phone number",
      data: null,
    });
  }
);

const googleCallbackController = catchAsync(
  async (req: Request, res: Response) => {
    let redirectTo = "/";

    if (req.query.state) {
      let stateStr = req.query.state as string;
      try {
        stateStr = stateStr.replace(/-/g, "+").replace(/_/g, "/");
        while (stateStr.length % 4) {
          stateStr += "=";
        }
        const decoded = Buffer.from(stateStr, "base64").toString("utf-8");
        const parsed = JSON.parse(decoded);
        redirectTo = parsed.redirect || "/";
      } catch (_e) {
        redirectTo = stateStr;
      }
    }

    if (redirectTo.startsWith("/")) {
      redirectTo = redirectTo.slice(1);
    }

    const user = req.user;

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
    }

    // Platform detection for social login (Google/Facebook strictly allowed on mobile app only)
    const isMobileApp = /^[a-z][a-z0-9+.-]*:\/\//.test(redirectTo);
    
    if (!isMobileApp) {
      const errorHTML = getSocialAuthErrorPageHTML(
        "Google login is only allowed on the mobile app.",
        envVars.FRONTEND_URL
      );
      res.setHeader("Content-Type", "text/html");
      res.status(httpStatus.FORBIDDEN).send(errorHTML);
      return;
    }

    const tokenInfo = createUserTokens(user);
    const { accessToken, refreshToken } = tokenInfo;

    const separator = redirectTo.includes("?") ? "&" : "?";
    const finalRedirectUrl = `${redirectTo}${separator}accessToken=${accessToken}&refreshToken=${refreshToken}`;
    sendMobileRedirect(res, finalRedirectUrl);
  }
);

const facebookCallbackController = catchAsync(
  async (req: Request, res: Response) => {
    let redirectTo = "/";

    if (req.query.state) {
      let stateStr = req.query.state as string;
      try {
        stateStr = stateStr.replace(/-/g, "+").replace(/_/g, "/");
        while (stateStr.length % 4) {
          stateStr += "=";
        }
        const decoded = Buffer.from(stateStr, "base64").toString("utf-8");
        const parsed = JSON.parse(decoded);
        redirectTo = parsed.redirect || "/";
      } catch (_e) {
        redirectTo = stateStr;
      }
    }

    if (redirectTo.startsWith("/")) {
      redirectTo = redirectTo.slice(1);
    }

    const user = req.user;

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
    }

    // Platform detection for social login (Google/Facebook strictly allowed on mobile app only)
    const isMobileApp = /^[a-z][a-z0-9+.-]*:\/\//.test(redirectTo);
    
    if (!isMobileApp) {
      const errorHTML = getSocialAuthErrorPageHTML(
        "Facebook login is only allowed on the mobile app.",
        envVars.FRONTEND_URL
      );
      res.setHeader("Content-Type", "text/html");
      res.status(httpStatus.FORBIDDEN).send(errorHTML);
      return;
    }

    const tokenInfo = createUserTokens(user);
    const { accessToken, refreshToken } = tokenInfo;

    const separator = redirectTo.includes("?") ? "&" : "?";
    const finalRedirectUrl = `${redirectTo}${separator}accessToken=${accessToken}&refreshToken=${refreshToken}`;
    sendMobileRedirect(res, finalRedirectUrl);
  }
);

const firebaseLogin = catchAsync(async (req: Request, res: Response) => {
  const { idToken, isDashboardLogin } = req.body;
  const result = await AuthServices.firebaseSocialLogin(idToken, isDashboardLogin);

  setAuthCookie(res, {
    accessToken: result.accessToken as string,
    refreshToken: result.refreshToken as string,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Logged In Successfully with Firebase!",
    data: result,
  });
});

export const AuthControllers = {
  register,
  verifyEmail,
  resendVerificationCode,
  credentialsLogin,
  firebaseLogin,
  verify2FA,
  getNewAccessToken,
  logout,
  changePassword,
  resetPassword,
  setPassword,
  forgotPassword,
  googleCallbackController,
  facebookCallbackController,
};
