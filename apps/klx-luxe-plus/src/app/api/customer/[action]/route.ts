import { cookies } from "next/headers";

import { z } from "zod";

import { env } from "@/env";

import {
  customerCookie,
  customerOrders,
  requestCustomerCode,
  verifyCustomerCode
} from "@/server/customer";
import { getDb } from "@/server/db/client";
import { digest, handle, HttpError, rateLimit, sameOrigin } from "@/server/http";

export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  return handle(async () => {
    sameOrigin(request);
    const { action } = await context.params;
    const jar = await cookies();
    if (action === "logout") {
      const token = jar.get(customerCookie)?.value;
      if (token)
        await (
          await getDb()
        )
          .collection("klx_customer_sessions")
          .deleteOne({ tokenHash: digest(token) });
      jar.delete(customerCookie);
      return { ok: true };
    }
    await rateLimit(request, `customer-${action}`, action === "request" ? 5 : 20);
    if (action === "request") {
      const { email } = z
        .object({
          email: z
            .string()
            .trim()
            .email()
            .max(254)
            .transform((value) => value.toLowerCase())
        })
        .parse(await request.json());
      await rateLimit(request, `customer-address-${digest(email)}`, 3);
      return requestCustomerCode(email);
    }
    if (action === "verify") {
      const input = z
        .object({ challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) })
        .parse(await request.json());
      const session = await verifyCustomerCode(input.challengeId, input.code);
      jar.set(customerCookie, session.token, {
        httpOnly: true,
        sameSite: "lax",
        secure: new URL(env.KLX_SITE_URL).protocol === "https:",
        expires: session.expiresAt,
        path: "/"
      });
      return { ok: true };
    }
    throw new HttpError(404, "Unknown action.");
  });
}
export async function GET(request: Request, context: { params: Promise<{ action: string }> }) {
  return handle(async () => {
    if ((await context.params).action !== "orders") throw new HttpError(404, "Not found.");
    const page = z.coerce
      .number()
      .int()
      .min(0)
      .max(100000)
      .parse(new URL(request.url).searchParams.get("page") || 0);
    return customerOrders((await cookies()).get(customerCookie)?.value || "", page);
  });
}
