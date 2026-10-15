import { z } from "zod";

import { availableTimes } from "@/server/appointments";
import { handle, rateLimit } from "@/server/http";
import { dateString } from "@/server/validation";

export const runtime = "nodejs";
export async function GET(request: Request) {
  return handle(async () => {
    await rateLimit(request, "availability", 120);
    const input = z
      .object({ date: dateString, serviceId: z.string().min(1).max(100) })
      .parse(Object.fromEntries(new URL(request.url).searchParams));
    return availableTimes(input.date, input.serviceId);
  });
}
