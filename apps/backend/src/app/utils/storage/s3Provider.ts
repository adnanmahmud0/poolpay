import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { IStorageProvider } from "./storage.interface";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import fs from "fs";
import logger from "../../utils/logger";
import { LocalStorageProvider } from "./localStorageProvider";

export class S3Provider implements IStorageProvider {
  private s3: S3Client;

  constructor() {
    const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } =
      envVars.AWS;

    if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      throw new AppError(
        500,
        "AWS credentials or region missing in environment variables"
      );
    }

    this.s3 = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = "uploads"
  ): Promise<string> {
    try {
      const bucketName = envVars.AWS.AWS_BUCKET_NAME;
      if (!bucketName) {
        throw new AppError(
          500,
          "AWS_BUCKET_NAME is missing in environment variables"
        );
      }

      const fileStream = fs.createReadStream(file.path);
      const fileName = `${folder}/${file.filename}`;

      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileStream,
        ContentType: file.mimetype,
      };

      await this.s3.send(new PutObjectCommand(uploadParams));

      // Clean up tmp file
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch {}

      return `https://${bucketName}.s3.${envVars.AWS.AWS_REGION}.amazonaws.com/${fileName}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.warn(
        `[STORAGE] S3 upload failed (${message}). Seamlessly falling back to LocalStorageProvider.`
      );
      try {
        const local = new LocalStorageProvider();
        return await local.uploadFile(file, folder);
      } catch (localError) {
        throw new AppError(500, `Storage upload failed: ${message}`);
      }
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      if (url.includes("/uploads/")) {
        const local = new LocalStorageProvider();
        await local.deleteFile(url);
        return;
      }

      const bucketName = envVars.AWS.AWS_BUCKET_NAME;
      const region = envVars.AWS.AWS_REGION;

      if (!bucketName || !region) {
        console.error("S3 deletion failed: bucketName or region missing");
        return;
      }

      const baseUrl = `https://${bucketName}.s3.${region}.amazonaws.com/`;
      const key = url.replace(baseUrl, "");

      const deleteParams = {
        Bucket: bucketName,
        Key: key,
      };

      await this.s3.send(new DeleteObjectCommand(deleteParams));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("S3 deletion failed:", message);
    }
  }
}
