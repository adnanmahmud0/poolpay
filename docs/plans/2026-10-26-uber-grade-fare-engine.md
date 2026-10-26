# Uber-Grade Marketplace Fare Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the KLX Luxe Plus pricing engine into a production-grade, US market-aware fare calculation engine that mirrors Uber's multi-factor pricing (base fare, multi-bracket distance decay, traffic-aware time duration, minimum fare, airport/tolls, surge multiplier, fare ranges, and driver economics) while remaining 100% configurable via the admin dashboard.

**Architecture:**

- The fare engine evaluates trips across three distance tiers (Local 0–10 mi, Highway 10–50 mi, Long-Haul 50+ mi), a traffic duration component ($/minute), minimum trip guarantees, and airport/toll surcharges.
- The Google Routes API integration (`/directions/v2:computeRoutes`) is updated to fetch traffic-aware duration (`TRAFFIC_AWARE`) and travel advisory info.
- The Admin Dashboard (`TransportationPricingManager.tsx`) is upgraded with full controls for all tiers, fees, time rates, driver payout percentages, and an interactive multi-route simulator with pre-set real-world benchmark tests (NYC Metro, EWR-Long Island, Orlando-Miami).

**Tech Stack:**

- Next.js 16.4 (App Router) + TypeScript
- MongoDB (`klx_settings` collection) + Zod validation
- Google Maps Routes API (Directions v2 with `TRAFFIC_AWARE`) + OSRM fallback
- Tailwind CSS + Lucide React + Integer Cents financial precision

---

## Benchmark Calibration Targets

| Route Scenario                                                | Distance & Time   | Benchmark (Uber)                                       | Target KLX Price                             | Calibrated Model                                                                      |
| :------------------------------------------------------------ | :---------------- | :----------------------------------------------------- | :------------------------------------------- | :------------------------------------------------------------------------------------ |
| **Local NYC** (City Hall $\rightarrow$ Jamaica)               | 14.3 mi · 40 mins | UberX: **$74–$77**<br>UberXL: **$81–$86**              | Sedan: **~$74**<br>SUV: **~$85**             | Base $15 + (10mi × $3.20) + (4.3mi × $1.60) + (40m × $0.40) + $4 fee                  |
| **Medium Regional** (EWR Airport $\rightarrow$ Melville LI)   | 55.1 mi · 75 mins | UberX: **$137.93**<br>UberXL: **$155.98**              | Sedan: **~$148**<br>SUV: **~$169**           | Base $15 + (10mi × $3.20) + (40mi × $1.60) + (5.1mi × $1.40) + (75m × $0.40) + $4 fee |
| **Long-Haul Intercity** (MCO Orlando $\rightarrow$ MIA Miami) | 235 mi · 220 mins | Uber Black: **$695.98**<br>Uber Black SUV: **$911.95** | Sedan: **~$695–$705**<br>SUV: **~$910–$915** | Luxury rate with chauffeur return allowance + turnpike tolls + airport fees           |

---

## Phased Implementation Tasks

### Task 1: Update Data Models & Zod Schemas

**Files:**

- Modify: `apps/klx-luxe-plus/src/server/db/types.ts`
- Modify: `apps/klx-luxe-plus/src/server/validation.ts`
- Modify: `apps/klx-luxe-plus/src/server/db/defaults.ts`

**Step 1: Write test for schema validation of multi-bracket pricing**
Add schema validation unit tests in `apps/klx-luxe-plus/tests/workflows.test.ts` ensuring:

- `longHaulThreshold` (default 50 miles)
- `longHaulPricePerKmCents`
- `pricePerMinuteCents`
- `minimumFareCents`
- `bookingFeeCents`
- `airportFeeCents`
- `surgeMultiplier`
- `driverPayoutPercent`

**Step 2: Update TypeScript types in `types.ts`**
Extend `VehiclePricingConfig` and `TransportationPricingConfig` with:

```typescript
export interface VehiclePricingConfig {
  basePriceCents: number;
  pricePerKmCents: number; // Tier 1: 0 - 10 miles
  reducedPricePerKmCents?: number; // Tier 2: 10 - 50 miles
  longDistanceDiscountPercent?: number;
  longHaulPricePerKmCents?: number; // Tier 3: 50+ miles
  pricePerMinuteCents?: number; // Time in traffic
  minimumFareCents?: number; // Minimum trip fare
}

export interface TransportationPricingConfig {
  unit: "km" | "mile";
  longDistanceThreshold?: number; // Default 10 mi
  longHaulThreshold?: number; // Default 50 mi
  bookingFeeCents?: number; // Platform booking fee (e.g. $4.00)
  airportFeeCents?: number; // Surcharge for airport pickups/dropoffs (e.g. $15.00)
  surgeMultiplier?: number; // Default 1.0 (range 1.0 - 2.5)
  driverPayoutPercent?: number; // Default 75%
  tiers: {
    executive_sedan: VehiclePricingConfig;
    luxury_suv: VehiclePricingConfig;
    vip_sprinter: VehiclePricingConfig;
  };
}
```

**Step 3: Update Zod validation in `validation.ts`**
Add Zod constraints ensuring all cent values are non-negative integers, percentages are between 0 and 100, and surge multiplier is between 1.0 and 3.0.

**Step 4: Update defaults in `defaults.ts`**
Calibrate default values matching US market rates.

---

### Task 2: Core Multi-Tier Marketplace Calculation Function

**Files:**

- Modify: `apps/klx-luxe-plus/src/components/TransportationBooking.tsx`
- Modify: `apps/klx-luxe-plus/tests/workflows.test.ts`

**Step 1: Write unit tests covering Local, Regional, and Long-Haul routes**
Verify:

1. 14.3 miles NYC: Sedan calculates to ~$74, SUV ~$85.
2. 55.1 miles EWR-Melville: Sedan calculates to ~$148, SUV ~$170.
3. 235 miles MCO-MIA: Sedan calculates to ~$705, SUV ~$915.
4. Short 2-mile trip: Floor clamped to `minimumFareCents`.

**Step 2: Implement `calculateVehicleFare()`**
Update signature to accept `(tierId, distanceKm, durationMinutes, options, config)`:

- Distance split across Tier 1 (0–10 mi), Tier 2 (10–50 mi), and Tier 3 (50+ mi).
- Time fare = `durationMinutes * (tier.pricePerMinuteCents / 100)`.
- Base fare + Distance fare + Time fare clamped to `minimumFare`.
- Apply surge multiplier.
- Add booking fee and airport fee (if detected or flagged).
- Return estimate range (`minRangeFormatted`, `maxRangeFormatted`, `driverEarningsFormatted`, `platformMarginFormatted`).

**Step 3: Run Vitest / Node test runner**
Run `npm --prefix apps/klx-luxe-plus run test:workflows` and verify all tests pass.

---

### Task 3: Google Routes API Traffic-Aware & Airport Detection

**Files:**

- Modify: `apps/klx-luxe-plus/src/components/TransportationBooking.tsx`

**Step 1: Update Google Routes API request**

- Add `routingPreference: "TRAFFIC_AWARE"` to request body.
- Update field mask to include `routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.travelAdvisory.tollInfo`.
- Parse traffic duration in minutes accurately.

**Step 2: Add Airport Detection Helper**
Detect airport keywords in `pickupLocation` and `dropoffLocation` (e.g., "Airport", "MCO", "MIA", "JFK", "EWR", "LGA", "FLL", "PBI") and automatically apply the configured `airportFeeCents`.

**Step 3: Update Passenger UI Display**

- Show estimated price range (e.g., "$70 – $78" or "$905 – $925") alongside the primary estimate.
- Show clear breakdown pills: "Base + Distance + Traffic Time + Fees".
- Highlight fuel/turnpike toll considerations on long-haul trips.

---

### Task 4: Upgrade Admin Pricing Manager with Live Simulator

**Files:**

- Modify: `apps/klx-luxe-plus/src/components/admin/TransportationPricingManager.tsx`

**Step 1: Add Configuration Controls**

- Base Fares per vehicle
- Per-Mile Rates for Tier 1 (0–10 mi), Tier 2 (10–50 mi), and Tier 3 (50+ mi)
- Per-Minute Time Rate ($/min)
- Minimum Trip Fare ($)
- Booking Fee & Airport Surcharge ($)
- Dynamic Surge Multiplier Slider (1.0x to 2.5x)
- Driver Payout % (default 75%) & Target Platform Margin % (25%)

**Step 2: Build Live Route Benchmark Simulator**
Include one-click benchmark buttons right in the admin simulator:

- Button 1: **"Local City Trip (14.3 mi · 40 min)"**
- Button 2: **"Regional Highway (55.1 mi · 75 min)"**
- Button 3: **"Intercity Long-Haul (235 mi · 220 min)"**
- Live comparison cards showing:
  - Total Passenger Price & Range
  - Distance Fare vs. Time Fare breakdown
  - Estimated Driver Payout (e.g. $686 for the 235-mi SUV trip)
  - Platform Net Margin

---

### Task 5: Booking Snapshot Freezing & Repository Migration

**Files:**

- Modify: `apps/klx-luxe-plus/src/server/appointments.ts`
- Modify: `apps/klx-luxe-plus/src/server/db/repositories.ts`

**Step 1: Freeze fare calculation snapshot on booking creation**
Store `fareSnapshot` with all rates, distances, durations, and fees at the time the booking was made so future admin price edits never alter historical appointments.

**Step 2: Auto-migration safeguard in `repositories.ts`**
Ensure MongoDB automatically populates new fields when loading settings.

---

### Task 6: Full Verification & Client Communication

**Files:**

- Run test suite: `npm --prefix apps/klx-luxe-plus run test:workflows`
- Run build check: `npm run build:klx`
- Draft client communication explaining the Uber comparison and how long-haul trips work.
