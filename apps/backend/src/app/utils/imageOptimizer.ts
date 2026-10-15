import sharp from "sharp";
import fs from "fs";
import path from "path";
import logger from "./logger";

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

/**
 * Optimizes an uploaded image file using Sharp.
 * Resizes to optimal mobile dimensions and converts to high-efficiency WebP.
 * Updates the Multer file object properties in-place.
 */
export async function optimizeUploadedImage(
  file: Express.Multer.File,
  options: ImageOptimizationOptions = {}
): Promise<Express.Multer.File> {
  // If not an image, return untouched
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    return file;
  }

  // Skip SVGs or GIFs to preserve animations/vector scaling
  if (file.mimetype === "image/svg+xml" || file.mimetype === "image/gif") {
    return file;
  }

  const maxWidth = options.maxWidth || 1200;
  const maxHeight = options.maxHeight || 630;
  const quality = options.quality || 82;

  try {
    const originalPath = file.path;
    const parsedPath = path.parse(originalPath);
    const optimizedFilename = `${parsedPath.name}.webp`;
    const optimizedPath = path.join(parsedPath.dir, optimizedFilename);

    const originalStats = fs.statSync(originalPath);
    const originalSizeKb = (originalStats.size / 1024).toFixed(1);

    // Process image with Sharp
    await sharp(originalPath)
      .rotate() // Automatically orient based on EXIF
      .resize({
        width: maxWidth,
        height: maxHeight,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality })
      .toFile(optimizedPath);

    const optimizedStats = fs.statSync(optimizedPath);
    const optimizedSizeKb = (optimizedStats.size / 1024).toFixed(1);

    // Remove original temp file if it's different from the optimized file
    if (originalPath !== optimizedPath && fs.existsSync(originalPath)) {
      try {
        fs.unlinkSync(originalPath);
      } catch {
        /* ignore cleanup error */
      }
    }

    // Update Multer file metadata
    file.path = optimizedPath;
    file.filename = `${path.parse(file.filename).name}.webp`;
    file.mimetype = "image/webp";
    file.size = optimizedStats.size;

    logger.info(
      `[ImageOptimizer] Compressed image from ${originalSizeKb}KB -> ${optimizedSizeKb}KB (${Math.round(
        (1 - optimizedStats.size / originalStats.size) * 100
      )}% reduction)`
    );

    return file;
  } catch (err) {
    logger.warn(
      `[ImageOptimizer] Optimization failed, keeping original: ${err instanceof Error ? err.message : err}`
    );
    return file;
  }
}
