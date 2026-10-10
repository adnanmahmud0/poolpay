import { v2 as cloudinary } from "cloudinary";
import { IStorageProvider } from "./storage.interface";
import { envVars } from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import path from "path";
import fs from "fs";

export class CloudinaryProvider implements IStorageProvider {
  /**
   * Ensures Cloudinary is correctly configured before each operation.
   * This prevents intermittent "unsigned upload" errors caused by state loss.
   */
  private ensureConfig() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      envVars.CLOUDINARY;

    // Dynamically inject CLOUDINARY_URL environment variable to force SDK's internal uploader to use signed requests
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      process.env.CLOUDINARY_URL = `cloudinary://${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}@${CLOUDINARY_CLOUD_NAME}`;
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = "uploads"
  ): Promise<string> {
    try {
      this.ensureConfig();

      // If using multer-storage-cloudinary, the path is already the URL
      if (file.path && file.path.startsWith("http")) {
        return file.path;
      }

      // Generate a safe, URL-friendly public ID by removing any non-alphanumeric/hyphen/underscore characters
      const fileBaseName = path.parse(file.filename).name;
      const safePublicId = fileBaseName
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "_")
        .substring(0, 100);

      // Validate that all Cloudinary credentials are fully loaded
      const {
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET,
      } = envVars.CLOUDINARY;
      if (
        !CLOUDINARY_CLOUD_NAME ||
        !CLOUDINARY_API_KEY ||
        !CLOUDINARY_API_SECRET
      ) {
        const missing = [
          !CLOUDINARY_CLOUD_NAME && "CLOUDINARY_CLOUD_NAME",
          !CLOUDINARY_API_KEY && "CLOUDINARY_API_KEY",
          !CLOUDINARY_API_SECRET && "CLOUDINARY_API_SECRET",
        ].filter(Boolean);
        throw new AppError(
          500,
          `Cloudinary configuration is incomplete. Missing env variables: ${missing.join(", ")}`
        );
      }

      // Read the file from the local disk path into a buffer
      const fileBuffer = fs.readFileSync(file.path);
      const mimeType = file.mimetype || "image/png";
      const base64Data = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

      console.info(
        `[STORAGE] Uploading file to Cloudinary: ${safePublicId} (Size: ${(fileBuffer.length / 1024).toFixed(2)} KB)`
      );

      // Upload the Base64 data directly using Cloudinary's highly robust file uploader
      // Rely on the trimmed global config for automatic and correct signature generation
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: folder,
        public_id: safePublicId,
        resource_type: "auto",
      });

      // Cleanup local file after successful upload
      if (
        file.path &&
        !file.path.startsWith("http") &&
        fs.existsSync(file.path)
      ) {
        fs.unlink(file.path, (err) => {
          if (err)
            console.error(
              `[STORAGE] Failed to delete local file: ${file.path}`,
              err
            );
        });
      }

      return result.secure_url;
    } catch (error: unknown) {
      // Also cleanup local file on failure
      if (
        file.path &&
        !file.path.startsWith("http") &&
        fs.existsSync(file.path)
      ) {
        fs.unlink(file.path, (err) => {
          if (err)
            console.error(
              `[STORAGE] Failed to delete local file on error: ${file.path}`,
              err
            );
        });
      }

      const message =
        error instanceof Error
          ? error.message
          : error && typeof error === "object" && "message" in error
            ? String((error as { message: unknown }).message)
            : JSON.stringify(error) || "Unknown error";

      throw new AppError(500, `Cloudinary upload failed: ${message}`);
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      this.ensureConfig();
      const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;
      const match = url.match(regex);

      if (match && match[1]) {
        const public_id = match[1];
        await cloudinary.uploader.destroy(public_id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Cloudinary deletion failed:", message);
    }
  }
}
