import crypto from "crypto";
import { envVars } from "../config/env";

const algorithm = "aes-256-cbc";
// Key must be 32 characters
const key = crypto
  .createHash("sha256")
  .update(String(envVars.ENCRYPTION_KEY))
  .digest("base64")
  .substring(0, 32);
const ivLength = 16;

export const encrypt = (text: string): string => {
  if (!text) return text;
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

export const decrypt = (text: string): string => {
  if (!text || !text.includes(":")) return text;
  const textParts = text.split(":");
  const ivStr = textParts.shift();
  if (!ivStr) return text;
  const iv = Buffer.from(ivStr, "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
