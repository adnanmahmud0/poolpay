import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { env } from "@/env";

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!/^[a-f0-9-]{36}\.webp$/.test(filename)) return new Response("Not found", { status: 404 });
  try {
    return new Response(await readFile(resolve(env.KLX_MEDIA_DIR, filename)), {
      headers: {
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
