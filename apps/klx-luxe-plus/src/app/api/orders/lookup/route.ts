import { z } from "zod";

import { handle, rateLimit, sameOrigin } from "@/server/http";
import { requestOrderLink } from "@/server/orders";

export const runtime = "nodejs";
export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    await rateLimit(request, "order-lookup", 5);
    const input = z
      .object({
        reference: z
          .string()
          .trim()
          .regex(/^(KLX-)?[A-Z0-9]{6,16}$/i),
        email: z.string().trim().email().max(254)
      })
      .parse(await request.json());
    return requestOrderLink(input.reference, input.email);
  });
}
