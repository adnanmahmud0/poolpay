import { cookies } from "next/headers";

import { z } from "zod";

import { authenticateUser, completeOwnerSetup } from "@/server/auth/users";
import { COLLECTIONS, getDb } from "@/server/db/client";
import {
  digest,
  handle,
  HttpError,
  rateLimit,
  sameOrigin,
  SESSION_COOKIE,
  startSession
} from "@/server/http";

export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  return handle(async () => {
    sameOrigin(request);
    await rateLimit(request, "auth", 12);
    const { action } = await context.params;
    if (action === "logout") {
      const jar = await cookies();
      const token = jar.get(SESSION_COOKIE)?.value;
      if (token)
        await (
          await getDb()
        )
          .collection(COLLECTIONS.SESSIONS)
          .deleteOne({ tokenHash: digest(token) });
      jar.delete(SESSION_COOKIE);
      return { ok: true };
    }
    const input = z
      .object({
        email: z.string().email().optional(),
        password: z
          .string()
          .min(8)
          .max(72)
          .refine(
            (value) => Buffer.byteLength(value, "utf8") <= 72,
            "Use a password of at most 72 UTF-8 bytes."
          ),
        token: z.string().optional(),
        name: z.string().max(100).default("KLX Administrator")
      })
      .parse(await request.json());
    const user =
      action === "setup" && input.token
        ? await completeOwnerSetup(input.token, input.password, input.name)
        : action === "login" && input.email
          ? await authenticateUser(input.email, input.password)
          : null;
    if (!user) throw new HttpError(401, "Invalid credentials or setup link.");
    await startSession(user);
    return { ok: true };
  });
}
