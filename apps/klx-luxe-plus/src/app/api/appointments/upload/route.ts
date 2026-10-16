import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { env } from "@/env";

import { handle, HttpError, rateLimit, sameOrigin } from "@/server/http";

export const runtime = "nodejs";

const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".webp", ".doc", ".docx"]);
const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    await rateLimit(request, "document_upload", 20);

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw new HttpError(400, "Please select a file to attach.");
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new HttpError(400, "Document must be smaller than 10 MB.");
    }

    const rawExt = extname(file.name || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(rawExt)) {
      throw new HttpError(
        400,
        "Unsupported file type. Please upload a PDF, JPG, PNG, WEBP, or DOC/DOCX file."
      );
    }

    const id = randomUUID();
    const safeExt = rawExt;
    const filename = `${id}${safeExt}`;
    const directory = resolve(env.KLX_MEDIA_DIR, "documents");

    await mkdir(directory, { recursive: true });

    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(resolve(directory, filename), bytes);

    const sanitizedName =
      file.name
        .slice(0, 150)
        .replace(/[^\w\s.-]/g, "_")
        .trim() || `document${safeExt}`;

    const mimeType = file.type || MIME_BY_EXT[safeExt] || "application/octet-stream";

    return {
      document: {
        id,
        name: sanitizedName,
        size: file.size,
        mimeType,
        url: `/api/documents/${filename}`
      }
    };
  });
}
