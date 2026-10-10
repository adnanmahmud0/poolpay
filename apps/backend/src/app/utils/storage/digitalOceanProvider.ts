import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { IStorageProvider } from "./storage.interface";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import fs from "fs";

export class DigitalOceanProvider implements IStorageProvider {
  private s3: S3Client;

  constructor() {
    const {
      SPACES_ENDPOINT,
      SPACES_ACCESS_KEY_ID,
      SPACES_SECRET_ACCESS_KEY,
      SPACES_REGION,
    } = envVars.SPACES;

    if (
      !SPACES_ENDPOINT ||
      !SPACES_ACCESS_KEY_ID ||
      !SPACES_SECRET_ACCESS_KEY
    ) {
      throw new AppError(
        500,
        "DigitalOcean Spaces credentials or endpoint missing in environment variables"
      );
    }

    this.s3 = new S3Client({
      endpoint: SPACES_ENDPOINT,
      region: SPACES_REGION,
      credentials: {
        accessKeyId: SPACES_ACCESS_KEY_ID,
        secretAccessKey: SPACES_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = "uploads"
  ): Promise<string> {
    try {
      const bucketName = envVars.SPACES.SPACES_BUCKET_NAME;
      if (!bucketName) {
        throw new AppError(
          500,
          "SPACES_BUCKET_NAME is missing in environment variables"
        );
      }

      const fileStream = fs.createReadStream(file.path);
      const fileName = `${folder}/${file.filename}`;

      const uploadParams = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileStream,
        ACL: "public-read" as const,
        ContentType: file.mimetype,
      };

      await this.s3.send(new PutObjectCommand(uploadParams));

      const endpoint = envVars.SPACES.SPACES_ENDPOINT || "";
      const endpointHost = endpoint.replace(/^https?:\/\//i, "");
      const fileUrl = `https://${bucketName}.${endpointHost}/${fileName}`;

      // Cleanup local file after successful upload
      if (file.path && fs.existsSync(file.path)) {
        fs.unlink(file.path, (err) => {
          if (err)
            console.error(
              `[STORAGE] Failed to delete local file: ${file.path}`,
              err
            );
        });
      }

      return fileUrl;
    } catch (error) {
      // Cleanup local file on failure
      if (file.path && fs.existsSync(file.path)) {
        fs.unlink(file.path, (err) => {
          if (err)
            console.error(
              `[STORAGE] Failed to delete local file on error: ${file.path}`,
              err
            );
        });
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      throw new AppError(500, `DigitalOcean Spaces upload failed: ${message}`);
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const bucketName = envVars.SPACES.SPACES_BUCKET_NAME;
      if (!bucketName) {
        console.error(
          "DigitalOcean Spaces deletion failed: bucketName missing"
        );
        return;
      }

      const endpoint = envVars.SPACES.SPACES_ENDPOINT || "";
      const endpointHost = endpoint.replace(/^https?:\/\//i, "");
      const baseUrl = `https://${bucketName}.${endpointHost}/`;
      const key = url.replace(baseUrl, "");

      const deleteParams = {
        Bucket: bucketName,
        Key: key,
      };

      await this.s3.send(new DeleteObjectCommand(deleteParams));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("DigitalOcean Spaces deletion failed:", message);
    }
  }
}
