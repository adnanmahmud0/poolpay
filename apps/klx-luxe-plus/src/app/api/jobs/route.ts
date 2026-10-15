import { env } from "@/env";

import { handle, HttpError } from "@/server/http";
import { processOutbox } from "@/server/mail";

export async function POST(request: Request) {
  return handle(async () => {
    if (
      !env.KLX_JOB_SECRET ||
      request.headers.get("authorization") !== `Bearer ${env.KLX_JOB_SECRET}`
    )
      throw new HttpError(401, "Unauthorized");
    return processOutbox();
  });
}
