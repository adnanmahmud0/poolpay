import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { envVars } from "../config/env";
import logger from "./logger";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Community Savings App API",
      version: "1.0.0",
      description:
        "API Documentation for the Community-Based Savings App. Note: The server enforces a strict Environment Validator. Ensure you configure all critical required environment variables (DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SUPER_ADMIN_EMAIL, and SUPER_ADMIN_PASSWORD) in your local .env file prior to starting the application.",
    },
    servers: [
      {
        url: "/api/v1",
        description: "Default Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    path.join(process.cwd(), "src/app/modules/**/*.route.ts").replace(/\\/g, "/"),
    path.join(process.cwd(), "src/app/modules/**/*.ts").replace(/\\/g, "/"),
    path.join(process.cwd(), "src/app/modules/**/*.swagger.ts").replace(/\\/g, "/"),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  try {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    logger.info(`📑 Swagger Docs available at http://localhost:${envVars.PORT}/api-docs`);
  } catch (error) {
    logger.error("❌ Failed to setup Swagger:", error);
  }
};
