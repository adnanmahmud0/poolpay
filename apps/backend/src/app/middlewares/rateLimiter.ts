import rateLimit from "express-rate-limit";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "../config/env";
import { Request } from "express";

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

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs for auth
  message:
    "Too many login/register attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.originalUrl && req.originalUrl.includes("/auth/login")) {
      return false;
    }
    return isAdmin(req);
  },
});

export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 payment requests per 15 mins
  message:
    "Too many payment requests from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (envVars.NODE_ENV === "development") return true;
    return isAdmin(req);
  },
});
