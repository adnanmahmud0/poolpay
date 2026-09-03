import { exec } from "child_process";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { envVars } from "../config/env";
import { getCurrentDbName } from "../config/dbConnect";
import logger from "./logger";

export const backupDatabase = async () => {
  try {
    const DB_URL = envVars.DATABASE_URL;
    if (!DB_URL) {
      logger.error("Database URL is not defined. Cannot backup.");
      return;
    }

    const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME } = envVars.AWS;

    if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_BUCKET_NAME) {
      logger.error("AWS credentials/bucket are not fully configured. Cannot upload backup.");
      return;
    }

    const currentDbName = getCurrentDbName();
    const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    
    // Set the specific DB name in the URL so mongodump targets only this DB
    let finalDbUrl = DB_URL;
    try {
      const parsedUrl = new URL(DB_URL);
      parsedUrl.pathname = `/${currentDbName}`;
      finalDbUrl = parsedUrl.toString();
    } catch (_err) {
      logger.warn(`Could not parse DB URL, using original URL for mongodump.`);
    }

    const archiveName = `${currentDbName}_backup_${dateStr}.gzip`;
    // Storing in a temporary directory
    const archivePath = path.join("/tmp", archiveName);

    logger.info(`Starting database backup: ${archiveName} for database: ${currentDbName}`);

    // Command to dump and compress in one go
    const dumpCommand = `mongodump --uri="${finalDbUrl}" --archive="${archivePath}" --gzip`;

    exec(dumpCommand, async (error, _stdout, stderr) => {
      if (error) {
        logger.error(`Error executing mongodump: ${error.message}`);
        return;
      }

      if (stderr) {
        // mongodump writes logs to stderr by default
        logger.info(`mongodump log: ${stderr}`);
      }

      logger.info(`Database backup created locally at ${archivePath}. Uploading to S3...`);

      // Initialize S3 client
      const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
      });

      try {
        const fileStream = fs.createReadStream(archivePath);

        const uploadParams = {
          Bucket: AWS_BUCKET_NAME,
          Key: `db-backups/${currentDbName}/${archiveName}`, // Folder path inside S3
          Body: fileStream,
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        logger.info(`Successfully uploaded backup ${archiveName} to S3.`);
        
        // After successful upload, delete old backups
        await deleteOldBackups(s3Client, AWS_BUCKET_NAME, `db-backups/${currentDbName}/`, 7);

      } catch (uploadError: unknown) {
        if (uploadError instanceof Error) {
          logger.error(`Failed to upload backup to S3: ${uploadError.message}`);
        } else {
          logger.error(`Failed to upload backup to S3`);
        }
      } finally {
        // Cleanup local file
        fs.unlink(archivePath, (err) => {
          if (err) logger.error(`Failed to delete local backup file: ${err.message}`);
          else logger.info(`Deleted local backup file: ${archivePath}`);
        });
      }
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(`Backup process encountered an error: ${err.message}`);
    } else {
      logger.error(`Backup process encountered an unknown error.`);
    }
  }
};

/**
 * Deletes backups older than a specified number of days from S3.
 */
const deleteOldBackups = async (
  s3Client: S3Client,
  bucketName: string,
  prefix: string,
  retentionDays: number
) => {
  try {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const listResponse = await s3Client.send(listCommand);

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return;
    }

    const now = new Date();
    const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

    const objectsToDelete = listResponse.Contents.filter((obj) => {
      if (!obj.LastModified || !obj.Key) return false;
      // Extra safety: only delete if it's explicitly inside the correct folder and is a gzip file
      if (!obj.Key.startsWith(prefix) || !obj.Key.endsWith(".gzip")) return false;
      
      const ageMs = now.getTime() - obj.LastModified.getTime();
      return ageMs > retentionMs;
    }).map((obj) => ({ Key: obj.Key }));

    if (objectsToDelete.length === 0) {
      logger.info(`No backups older than ${retentionDays} days found to delete.`);
      return;
    }

    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false,
      },
    });

    await s3Client.send(deleteCommand);
    logger.info(`Successfully deleted ${objectsToDelete.length} old backup(s) from S3.`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Failed to delete old backups from S3: ${error.message}`);
    } else {
      logger.error(`Failed to delete old backups from S3.`);
    }
  }
};

/**
 * Initializes the automated backup cron job.
 * By default, this runs every day at 00:00 (Midnight)
 */
export const initBackupCronJob = () => {
  if (envVars.NODE_ENV !== "production") {
    logger.info("Database backup cron job is disabled in non-production environments.");
    return;
  }

  if (envVars.DATABASE_URL.includes("mongodb.net") || envVars.DATABASE_URL.includes("mongodb+srv")) {
    logger.info("Database backup cron job is disabled for MongoDB Atlas URLs to prevent backing up test accounts.");
    return;
  }

  // '0 0 * * *' = every day at midnight (24h format)
  // You can change this to suit your needs (e.g., '0 2 * * *' for 2 AM)
  cron.schedule("0 0 * * *", () => {
    logger.info("Running daily database backup job...");
    backupDatabase();
  });
  logger.info("Database backup cron job initialized (runs daily at midnight).");
};
