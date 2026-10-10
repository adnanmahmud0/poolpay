import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import passport from "passport";
import jwt, { JwtPayload } from "jsonwebtoken";
import { envVars } from "./app/config/env";
import "./app/config/passport";
import { RedisStore } from "connect-redis";
import { bullMqRedis } from "./app/config/ioredis.config";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { router } from "./app/routes";
import { WebhookControllers } from "./app/modules/webhook/webhook.controller";
import { setupSwagger } from "./app/utils/swagger";
import { getLandingPageHTML } from "./app/utils/landingPage";
import {
  getPrivacyPolicyHTML,
  getTermsAndConditionsHTML,
  getDataDeletionInstructionsHTML,
  getSmsConsentHTML,
} from "./app/utils/legalPages";
import path from "path";
import fs from "fs";
import { trimInput } from "./app/middlewares/trimInput";

const app = express();
app.set("trust proxy", 1);

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy:
      envVars.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://cdnjs.cloudflare.com",
              ],
              styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://fonts.googleapis.com",
                "https://cdnjs.cloudflare.com",
              ],
              fontSrc: ["'self'", "https://fonts.gstatic.com"],
              imgSrc: [
                "'self'",
                "data:",
                "https://res.cloudinary.com",
                "https://validator.swagger.io",
              ],
            },
          }
        : false,
    crossOriginOpenerPolicy: envVars.NODE_ENV === "production",
    crossOriginEmbedderPolicy: envVars.NODE_ENV === "production",
    hsts: envVars.NODE_ENV === "production",
  })
);
app.use(
  cors({
    origin: [
      envVars.FRONTEND_URL,
      "https://poolpay.space",
      "https://www.poolpay.space",
      "https://admin.poolpay.space",
      "https://api.poolpay.space",
      "https://derival-dash.vercel.app",
      "http://localhost:5001",
      "http://localhost:5000",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "http://127.0.0.1:5001",
      "http://127.0.0.1:5000",
      "http://127.0.0.1:3000",
      "http://172.31.0.1:5001",
      "http://172.31.0.1:5000",
      "http://10.10.26.172:3000",
      "http://10.10.26.172:3001",
    ],
    credentials: true,
  })
);

if (envVars.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3000, // limit each IP to 3000 requests per windowMs
  message: {
    success: false,
    message:
      "Too many requests from this IP, please try again after 15 minutes",
  },
  skip: (req) => {
    // Do not skip rate limit for login to prevent brute force
    if (req.originalUrl && req.originalUrl.includes("/auth/login")) {
      return false;
    }

    // Skip rate limiting for authenticated admins across ALL routes
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
          return true; // Skip global rate limit for admins
        }
      }
    } catch (_error) {
      // Invalid token or no token, fall back to default rate limiting behavior
    }

    // Also skip for pure admin routes as a fallback
    if (req.originalUrl && req.originalUrl.startsWith("/api/v1/admin")) {
      return true;
    }

    return false;
  },
});

if (envVars.RATE_LIMITER_ENABLED) {
  app.use("/api", limiter);
}

// --- OPTIMIZATION: Public routes that don't need Redis sessions ---
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/privacy-policy", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(getPrivacyPolicyHTML());
});

app.get("/terms-and-conditions", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(getTermsAndConditionsHTML());
});

app.get("/data-deletion", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(getDataDeletionInstructionsHTML());
});

app.get("/sms-consent", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(getSmsConsentHTML());
});

app.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(getLandingPageHTML(envVars.PORT, process.uptime()));
});

app.post(
  "/api/v1/webhook/stripe",
  express.raw({ type: "*/*" }),
  WebhookControllers.stripeWebhook
);

// Global input trimmer to remove leading/trailing spaces from all requests
app.use(trimInput);
const resolvedUploadsDir = fs.existsSync(path.join(process.cwd(), "uploads"))
  ? path.join(process.cwd(), "uploads")
  : path.join(process.cwd(), "apps/api/uploads");
app.use("/uploads", express.static(resolvedUploadsDir));
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.use(cookieParser());
app.use(express.json());
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));

// --- Session and Passport initialization (ONLY for routes below) ---
app.use(
  expressSession({
    store:
      envVars.NODE_ENV === "production"
        ? new RedisStore({
            client: bullMqRedis,
            prefix: "sess:",
          })
        : undefined, // Uses default MemoryStore in development
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: envVars.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// API Routes (Need session/auth)
app.use("/api/v1", router);

// Serve Postman Collection JSON
app.get("/postman_collection.json", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "postman_collection.json"));
});

app.get("/master_postman_collection.json", (_req, res) => {
  res.sendFile(
    path.join(
      process.cwd(),
      "PoolPay_Master_Collection.postman_collection.json"
    )
  );
});

// Setup Swagger API Documentation
setupSwagger(app);

app.use(globalErrorHandler);
app.use(notFound);

export default app;
