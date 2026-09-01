
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { envVars } from "./env";
import AppError from "../errorHelpers/AppError";

const ensureConfig = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = envVars.CLOUDINARY;

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
};

export const uploadBufferToCloudinary = async (
  buffer: Buffer,
  fileName: string
): Promise<UploadApiResponse | undefined> => {
  try {
    ensureConfig();

    return new Promise((resolve, reject) => {
      // Sanitize the filename for public_id safety
      const cleanFileName = fileName
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "_")
        .substring(0, 100);

      const public_id = `pdf/${cleanFileName}-${Date.now()}`;

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          public_id: public_id,
          folder: "pdf",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );

      // Listen to the error event on the stream to prevent unhandled rejections
      uploadStream.on("error", (error) => {
        reject(error);
      });

      uploadStream.end(buffer);
    });
  } catch (error: unknown) {
    console.error("[CLOUDINARY] Buffer upload error:", error);
    const message = error instanceof Error 
      ? error.message 
      : (error && typeof error === "object" && "message" in error)
        ? String((error as { message: unknown }).message)
        : JSON.stringify(error) || "Unknown error";
    throw new AppError(401, `Error uploading file! ${message}`);
  }
};

export const deleteImageFromCloudinary = async (url: string) => {
  try {
    ensureConfig();
    const regex = /\/v\d+\/(.*?)\.(jpg|jpeg|png|gif|webp)$/i;

    const match = url.match(regex);

    if (match && match[1]) {
      const public_id = match[1];
      await cloudinary.uploader.destroy(public_id);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new AppError(401, `Cloudinary image deletion failed: ${message}`);
  }
};

export const cloudinaryUpload = cloudinary;
