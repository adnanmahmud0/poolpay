import { NextResponse } from "next/server";

import { DEFAULT_TRANSPORTATION_PRICING } from "@/server/db/defaults";
import { getSettings } from "@/server/db/repositories";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    const pricing = settings.transportationPricing || DEFAULT_TRANSPORTATION_PRICING;
    return NextResponse.json(pricing);
  } catch (err) {
    console.warn("Failed fetching transportation pricing, returning defaults:", err);
    return NextResponse.json(DEFAULT_TRANSPORTATION_PRICING);
  }
}
