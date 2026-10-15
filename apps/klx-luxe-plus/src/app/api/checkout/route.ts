import { z } from "zod";

import { checkout } from "@/server/commerce";
import { handle, rateLimit, sameOrigin } from "@/server/http";

export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    await rateLimit(request, "checkout", 20);
    const { token } = z
      .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
      .parse(await request.json());
    return checkout(token);
  });
}
