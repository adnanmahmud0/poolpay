import { IStorageProvider } from "./storage.interface";
import { envVars } from "../../config/env";
import fs from "fs";
import path from "path";

const resolveUploadBaseDir = (): string => {
  const possiblePaths = [
    path.resolve(process.cwd(), "uploads"),
    path.resolve(process.cwd(), "apps/api/uploads"),
    path.resolve(__dirname, "../../../../../uploads"),
    path.resolve(__dirname, "../../../../uploads"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }

  const defaultPath = path.resolve(process.cwd(), "uploads");
  fs.mkdirSync(defaultPath, { recursive: true });
  return defaultPath;
};

export class LocalStorageProvider implements IStorageProvider {
  private uploadBaseDir: string;

  constructor() {
    this.uploadBaseDir = resolveUploadBaseDir();
    if (!fs.existsSync(this.uploadBaseDir)) {
      fs.mkdirSync(this.uploadBaseDir, { recursive: true });
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    folder = "others"
  ): Promise<string> {
    const targetFolder = path.join(this.uploadBaseDir, folder);

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const targetPath = path.join(targetFolder, file.filename);

    // Move file from tmp to permanent folder
    try {
      fs.renameSync(file.path, targetPath);
    } catch {
      // Fallback for cross-device links or locked files
      fs.copyFileSync(file.path, targetPath);
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch {
        /* ignore cleanup error */
      }
    }

    // Return the URL with clean forward slashes
    const cleanFolder = folder.replace(/\\/g, "/");
    const backendUrl = (envVars.BACKEND_URL || "http://localhost:5000").replace(
      /\/$/,
      ""
    );
    return `${backendUrl}/uploads/${cleanFolder}/${file.filename}`;
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const backendUrl = (
        envVars.BACKEND_URL || "http://localhost:5000"
      ).replace(/\/$/, "");
      let relativePath = url
        .replace(`${backendUrl}/`, "")
        .replace(/^\/?uploads\/?/, "");
      relativePath = relativePath.replace(/\//g, path.sep);

      const absolutePath = path.join(this.uploadBaseDir, relativePath);

      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (error) {
      console.error("Local file deletion failed:", error);
    }
  }
}
