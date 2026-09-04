import winston from "winston";
import path from "path";
import fs from "fs";
import { envVars } from "../config/env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} ${level}: ${stack || message}`;
});

const logsDir = path.join(process.cwd(), "logs");

let canWriteFiles = false;
try {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  fs.accessSync(logsDir, fs.constants.W_OK);
  canWriteFiles = true;
} catch {
  canWriteFiles = false;
}

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: combine(
      ...(envVars.NODE_ENV === "development" ? [colorize()] : []),
      logFormat
    ),
  }),
];

if (canWriteFiles) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
    })
  );
}

const logger = winston.createLogger({
  level: envVars.NODE_ENV === "development" ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports,
  ...(canWriteFiles
    ? {
        exceptionHandlers: [
          new winston.transports.File({
            filename: path.join(logsDir, "exceptions.log"),
          }),
        ],
        rejectionHandlers: [
          new winston.transports.File({
            filename: path.join(logsDir, "rejections.log"),
          }),
        ],
      }
    : {}),
});

export default logger;

