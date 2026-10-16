import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";

import { env } from "@/env";

export const runtime = "nodejs";

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;

  // Strict regex prevents directory traversal and restricts file extension
  if (!/^[a-f0-9-]{36}\.(pdf|jpg|jpeg|png|webp|doc|docx)$/i.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = extname(filename).toLowerCase();
  const contentType = MIME_MAP[ext] || "application/octet-stream";
  const filePath = resolve(env.KLX_MEDIA_DIR, "documents", filename);

  try {
    const data = await readFile(filePath);
    return new Response(data, {
      headers: {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=86400",
        "Content-Disposition": `inline; filename="${filename}"`
      }
    });
  } catch {
    return new Response("Document not found", { status: 404 });
  }
}
