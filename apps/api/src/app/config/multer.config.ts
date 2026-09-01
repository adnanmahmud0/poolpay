import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = "uploads/tmp";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Ensure .gitkeep exists so the folder is tracked by git
const gitkeepPath = path.join(uploadDir, ".gitkeep");
if (!fs.existsSync(gitkeepPath)) {
  fs.writeFileSync(gitkeepPath, "");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Safely extract extension and base name
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext);

    // Sanitize the base name: lowercase, replace non-alphanumeric with a single hyphen
    const sanitizedBase = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-") // replace spaces and any special characters with hyphens
      .replace(/-+/g, "-")         // squash consecutive hyphens
      .replace(/^-|-$/g, "");      // trim hyphens from start/end

    // Create a unique, clean, and safe filename
    const uniqueSuffix = `${Math.random().toString(36).substring(2, 8)}-${Date.now()}`;
    const uniqueFileName = sanitizedBase 
      ? `${uniqueSuffix}-${sanitizedBase}${ext}`
      : `${uniqueSuffix}${ext}`;

    cb(null, uniqueFileName);
  },
});

export const multerUpload = multer({ storage: storage });
