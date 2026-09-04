import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IUser, UserStatus } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { generateToken, verifyToken } from "./jwt";

import { Settings } from "../modules/settings/settings.model";

export const createUserTokens = (user: Partial<IUser>, sessionTimeoutMinutes?: number) => {
  const jwtPayload = {
    userId: user._id,
    userName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: user.role,
  };

  const timeout = sessionTimeoutMinutes || envVars.SESSION_TIMEOUT_MINUTES || 20;
  const accessExpiresIn = `${timeout}m`;

  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    accessExpiresIn
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVars.JWT_REFRESH_SECRET,
    envVars.JWT_REFRESH_EXPIRES_IN
  );

  return {
    accessToken,
    refreshToken,
    sessionTimeoutMinutes: timeout,
  };
};

export const createNewAccessTokenWithRefreshToken = async (
  refreshToken: string
) => {
  let verifiedRefreshToken: JwtPayload;
  try {
    verifiedRefreshToken = verifyToken(
      refreshToken,
      envVars.JWT_REFRESH_SECRET
    ) as JwtPayload;
  } catch (err: any) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      err?.name === "TokenExpiredError"
        ? "Refresh token has expired"
        : "Invalid refresh token"
    );
  }

  const isUserExist = await User.findById(verifiedRefreshToken.userId);

  if (!isUserExist) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User does not exist");
  }
  if (isUserExist.status === UserStatus.BLOCKED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `User account is blocked`
    );
  }
  if (isUserExist.status === UserStatus.PENDING) {
    throw new AppError(httpStatus.BAD_REQUEST, "User account is pending approval");
  }

  const settings = await Settings.findOne().select("sessionTimeoutMinutes");
  const timeout = settings?.sessionTimeoutMinutes || envVars.SESSION_TIMEOUT_MINUTES || 20;
  const accessExpiresIn = `${timeout}m`;

  const jwtPayload = {
    userId: isUserExist._id,
    userName: `${isUserExist.firstName} ${isUserExist.lastName}`.trim(),
    email: isUserExist.email,
    role: isUserExist.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    envVars.JWT_ACCESS_SECRET,
    accessExpiresIn
  );

  return accessToken;
};
