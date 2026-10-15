import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import sharp from "sharp";
import { z } from "zod";

import { env } from "@/env";

import { COLLECTIONS, getDb } from "@/server/db/client";
import { logAudit } from "@/server/db/repositories";
import { handle, HttpError, requireAdmin } from "@/server/http";

export const runtime = "nodejs";
export async function GET(request: Request) {
  return handle(async () => {
    await requireAdmin();
    const page = z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .parse(new URL(request.url).searchParams.get("page") || 0);
    const records = await (
      await getDb()
    )
      .collection(COLLECTIONS.MEDIA)
      .find({})
      .sort({ createdAt: -1, id: 1 })
      .skip(page * 24)
      .limit(25)
      .toArray();
    return { items: records.slice(0, 24), hasMore: records.length > 24 };
  });
}
export async function POST(request: Request) {
  return handle(async () => {
    await requireAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 5 * 1024 * 1024)
      throw new HttpError(400, "Choose an image smaller than 5 MB.");
    const source = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(source, { limitInputPixels: 20000000 }).metadata();
    if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format))
      throw new HttpError(400, "Use a JPEG, PNG or WebP image.");
    const bytes = await sharp(source)
      .rotate()
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 88 })
      .toBuffer();
    const id = randomUUID();
    const filename = `${id}.webp`;
    const directory = resolve(env.KLX_MEDIA_DIR);
    await mkdir(directory, { recursive: true });
    await writeFile(resolve(directory, filename), bytes);
    const item = {
      id,
      filename,
      originalName: file.name.slice(0, 100),
      mimeType: "image/webp",
      size: bytes.length,
      url: `/media/${filename}`,
      altText: String(form.get("altText") || "").slice(0, 300),
      createdAt: new Date()
    };
    await (await getDb()).collection(COLLECTIONS.MEDIA).insertOne(item);
    return item;
  });
}

export async function DELETE(request: Request) {
  return handle(async () => {
    const admin = await requireAdmin(request);
    const url = new URL(request.url);
    let id: string | null | undefined = url.searchParams.get("id");
    if (!id) {
      try {
        const body = (await request.json()) as { id?: string };
        id = body?.id;
      } catch {
        // no body
      }
    }
    if (!id) {
      throw new HttpError(400, "Media ID is required for deletion.");
    }

    const db = await getDb();
    const media = await db.collection(COLLECTIONS.MEDIA).findOne({ id });
    if (!media) {
      throw new HttpError(404, "Media not found.");
    }

    // Explicit requirement: Delete physical media file from disk
    const filename = media.filename || media.url?.replace(/^\/media\//, "");
    if (filename) {
      try {
        const filePath = resolve(env.KLX_MEDIA_DIR, filename);
        await unlink(filePath);
      } catch (err: unknown) {
        const error = err as NodeJS.ErrnoException;
        if (error.code !== "ENOENT") {
          console.error("Failed to delete physical media file from disk:", error);
        }
      }
    }

    await db.collection(COLLECTIONS.MEDIA).deleteOne({ id });

    await logAudit({
      actorEmail: admin.email,
      action: "MEDIA_DELETED",
      entityType: "media",
      entityId: id,
      details: {
        filename,
        originalName: media.originalName
      }
    });

    return { ok: true, id };
  });
}
