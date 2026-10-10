import rateLimit from "express-rate-limit";
import { envVars } from "../config/env";
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

const isAdmin = (req: Request) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(
        token,
        envVars.JWT_ACCESS_SECRET
      ) as JwtPayload;
      if (
        decoded &&
        (decoded.role === "ADMIN" || decoded.role === "SUPER_ADMIN")
      ) {
        return true;
      }
    }
  } catch (_error) {
    // ignore
  }
  return false;
};

const baseAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per window (login, register, forgot-password)
  message: {
    success: false,
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.originalUrl && req.originalUrl.includes("/auth/login")) {
      return false;
    }
    return isAdmin(req);
  },
});

export const authLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (envVars.RATE_LIMITER_ENABLED) {
    baseAuthLimiter(req, res, next);
    return;
  }
  next();
};
