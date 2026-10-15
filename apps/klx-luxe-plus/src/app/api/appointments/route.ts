import { requestAppointment } from "@/server/appointments";
import { handle, rateLimit, sameOrigin } from "@/server/http";

export async function POST(request: Request) {
  return handle(async () => {
    sameOrigin(request);
    await rateLimit(request, "appointments", 8);
    return requestAppointment(await request.json());
  });
}
