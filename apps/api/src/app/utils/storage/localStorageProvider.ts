import { IStorageProvider } from "./storage.interface";
import { envVars } from "../../config/env";
import fs from "fs";
import path from "path";

export class LocalStorageProvider implements IStorageProvider {
  private uploadBaseDir = "uploads";

  constructor() {
    if (!fs.existsSync(this.uploadBaseDir)) {
      fs.mkdirSync(this.uploadBaseDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder = "others"): Promise<string> {
    const targetFolder = path.join(this.uploadBaseDir, folder);
    
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const targetPath = path.join(targetFolder, file.filename);
    
    // Move file from tmp to permanent folder
    fs.renameSync(file.path, targetPath);

    // Return the relative URL (e.g., /uploads/profiles/filename.jpg)
    return `${envVars.BACKEND_URL}/uploads/${folder}/${file.filename}`;
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const relativePath = url.replace(`${envVars.BACKEND_URL}/`, "");
      const absolutePath = path.join(process.cwd(), relativePath);
      
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }
    } catch (error) {
      console.error("Local file deletion failed:", error);
    }
  }
}
