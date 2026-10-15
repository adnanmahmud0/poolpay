import { getDb } from "@/server/db/client";
import { json } from "@/server/http";

export async function GET() {
  try {
    await (await getDb()).command({ ping: 1 });
    return json({ status: "ready" });
  } catch {
    return json({ status: "unavailable" }, 503);
  }
}
