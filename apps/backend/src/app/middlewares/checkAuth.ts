import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import AppError from "../errorHelpers/AppError";
import { IUser, Role, UserStatus } from "../modules/user/user.interface";
import { User } from "../modules/user/user.model";
import { verifyToken } from "../utils/jwt";

export const checkAuth =
  (...authRoles: Role[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      let user: JwtPayload | undefined;

      if (envVars.AUTH_SYSTEM === "passport") {
        // In Passport, req.user is populated after successful session authentication
        if (!req.isAuthenticated() || !req.user) {
          throw new AppError(
            httpStatus.UNAUTHORIZED,
            "You are not authenticated"
          );
        }

        const passportUser = req.user as IUser;
        user = {
          userId: passportUser._id?.toString() as string,
          email: passportUser.email,
          role: passportUser.role,
        };
      } else {
        // Custom JWT Authentication
        let accessToken = req.headers.authorization;

        if (!accessToken) {
          throw new AppError(httpStatus.UNAUTHORIZED, "No token provided");
        }

        // Strip 'Bearer ' if present
        if (accessToken.startsWith("Bearer ")) {
          accessToken = accessToken.split(" ")[1];
        }

        if (
          !accessToken ||
          accessToken === "undefined" ||
          accessToken === "null"
        ) {
          throw new AppError(
            httpStatus.UNAUTHORIZED,
            "Invalid or malformed token"
          );
        }

        user = verifyToken(
          accessToken,
          envVars.JWT_ACCESS_SECRET
        ) as JwtPayload;
      }

      if (!user) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Invalid authentication");
      }

      // Check if user exists and is active
      const isUserExist = await User.findById(user.userId);

      if (!isUserExist) {
        throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
      }

      if (isUserExist.status === UserStatus.PENDING) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "User account is pending approval"
        );
      }

      if (isUserExist.status === UserStatus.BLOCKED) {
        throw new AppError(httpStatus.FORBIDDEN, `User account is blocked`);
      }

      if (isUserExist.status === UserStatus.SUSPENDED) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "Your account has been suspended for compliance reasons."
        );
      }

      // Role authorization
      if (
        authRoles.length > 0 &&
        !authRoles.includes(isUserExist.role as Role)
      ) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You do not have permission to access this resource"
        );
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
