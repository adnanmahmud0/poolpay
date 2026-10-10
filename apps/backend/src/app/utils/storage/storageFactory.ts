import { envVars } from "../../config/env";
import { CloudinaryProvider } from "./cloudinaryProvider";
import { S3Provider } from "./s3Provider";
import { LocalStorageProvider } from "./localStorageProvider";
import { DigitalOceanProvider } from "./digitalOceanProvider";
import { IStorageProvider } from "./storage.interface";

export const getStorageProvider = (): IStorageProvider => {
  const provider = envVars.STORAGE_PROVIDER;

  if (provider === "aws") {
    return new S3Provider();
  }

  if (provider === "cloudinary") {
    return new CloudinaryProvider();
  }

  if (provider === "digitalOcean") {
    return new DigitalOceanProvider();
  }

  // Default to local storage
  return new LocalStorageProvider();
};

export const storage = getStorageProvider();
