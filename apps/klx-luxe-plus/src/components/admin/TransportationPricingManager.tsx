"use client";

import { useState } from "react";

import { Calculator, Car, Check, Clock, Gauge, Loader2, Plane, Route } from "lucide-react";

import { Button } from "@repo/ui";

import type { TransportationPricingConfig } from "@/server/db/types";

interface Props {
  initialPricing?: TransportationPricingConfig;
  onSave: (pricing: TransportationPricingConfig) => Promise<void>;
}

const DEFAULT_PRICING: TransportationPricingConfig = {
  unit: "mile",
  longDistanceThreshold: 10,
  longHaulThreshold: 50,
  bookingFeeCents: 400,
  airportFeeCents: 1500,
  surgeMultiplier: 1.0,
  driverPayoutPercent: 75,
  tiers: {
    executive_sedan: {
      basePriceCents: 1500,
      pricePerKmCents: 320,
      reducedPricePerKmCents: 160,
      longDistanceDiscountPercent: 50,
      longHaulPricePerKmCents: 215,
      longHaulDiscountPercent: 33,
      pricePerMinuteCents: 40,
      minimumFareCents: 2500
    },
    luxury_suv: {
      basePriceCents: 2000,
      pricePerKmCents: 350,
      reducedPricePerKmCents: 180,
      longDistanceDiscountPercent: 49,
      longHaulPricePerKmCents: 285,
      longHaulDiscountPercent: 19,
      pricePerMinuteCents: 50,
      minimumFareCents: 3500
    },
    vip_sprinter: {
      basePriceCents: 3500,
      pricePerKmCents: 450,
      reducedPricePerKmCents: 240,
      longDistanceDiscountPercent: 47,
      longHaulPricePerKmCents: 350,
      longHaulDiscountPercent: 22,
      pricePerMinuteCents: 75,
      minimumFareCents: 6000
    }
  }
};

export function TransportationPricingManager({ initialPricing, onSave }: Props) {
  const current = initialPricing || DEFAULT_PRICING;

  const [unit, setUnit] = useState<"km" | "mile">(current.unit || "mile");
  const [threshold1, setThreshold1] = useState<number>(
    current.longDistanceThreshold ?? (current.unit === "km" ? 16 : 10)
  );
  const [threshold2, setThreshold2] = useState<number>(
    current.longHaulThreshold ?? (current.unit === "km" ? 80 : 50)
  );

  // Global marketplace fees & surge
  const [bookingFee, setBookingFee] = useState<number>((current.bookingFeeCents ?? 400) / 100);
  const [airportFee, setAirportFee] = useState<number>((current.airportFeeCents ?? 1500) / 100);
  const [surgeMultiplier, setSurgeMultiplier] = useState<number>(current.surgeMultiplier ?? 1.0);
  const [driverPayoutPercent, setDriverPayoutPercent] = useState<number>(
    current.driverPayoutPercent ?? 75
  );

  // Sedan state
  const [sedanBase, setSedanBase] = useState<number>(
    (current.tiers?.executive_sedan?.basePriceCents ?? 1500) / 100
  );
  const [sedanStandard, setSedanStandard] = useState<number>(
    (current.tiers?.executive_sedan?.pricePerKmCents ?? 320) / 100
  );
  const [sedanDiscountPercent, setSedanDiscountPercent] = useState<number>(
    current.tiers?.executive_sedan?.longDistanceDiscountPercent ?? 50
  );
  const [sedanReduced, setSedanReduced] = useState<number>(
    (current.tiers?.executive_sedan?.reducedPricePerKmCents ?? 160) / 100
  );
  const [sedanLongHaulDiscount, setSedanLongHaulDiscount] = useState<number>(
    current.tiers?.executive_sedan?.longHaulDiscountPercent ?? 33
  );
  const [sedanLongHaul, setSedanLongHaul] = useState<number>(
    (current.tiers?.executive_sedan?.longHaulPricePerKmCents ?? 215) / 100
  );
  const [sedanTimeRate, setSedanTimeRate] = useState<number>(
    (current.tiers?.executive_sedan?.pricePerMinuteCents ?? 40) / 100
  );
  const [sedanMinFare, setSedanMinFare] = useState<number>(
    (current.tiers?.executive_sedan?.minimumFareCents ?? 2500) / 100
  );

  // SUV state
  const [suvBase, setSuvBase] = useState<number>(
    (current.tiers?.luxury_suv?.basePriceCents ?? 2000) / 100
  );
  const [suvStandard, setSuvStandard] = useState<number>(
    (current.tiers?.luxury_suv?.pricePerKmCents ?? 350) / 100
  );
  const [suvDiscountPercent, setSuvDiscountPercent] = useState<number>(
    current.tiers?.luxury_suv?.longDistanceDiscountPercent ?? 49
  );
  const [suvReduced, setSuvReduced] = useState<number>(
    (current.tiers?.luxury_suv?.reducedPricePerKmCents ?? 180) / 100
  );
  const [suvLongHaulDiscount, setSuvLongHaulDiscount] = useState<number>(
    current.tiers?.luxury_suv?.longHaulDiscountPercent ?? 19
  );
  const [suvLongHaul, setSuvLongHaul] = useState<number>(
    (current.tiers?.luxury_suv?.longHaulPricePerKmCents ?? 285) / 100
  );
  const [suvTimeRate, setSuvTimeRate] = useState<number>(
    (current.tiers?.luxury_suv?.pricePerMinuteCents ?? 50) / 100
  );
  const [suvMinFare, setSuvMinFare] = useState<number>(
    (current.tiers?.luxury_suv?.minimumFareCents ?? 3500) / 100
  );

  // Sprinter state
  const [sprinterBase, setSprinterBase] = useState<number>(
    (current.tiers?.vip_sprinter?.basePriceCents ?? 3500) / 100
  );
  const [sprinterStandard, setSprinterStandard] = useState<number>(
    (current.tiers?.vip_sprinter?.pricePerKmCents ?? 450) / 100
  );
  const [sprinterDiscountPercent, setSprinterDiscountPercent] = useState<number>(
    current.tiers?.vip_sprinter?.longDistanceDiscountPercent ?? 47
  );
  const [sprinterReduced, setSprinterReduced] = useState<number>(
    (current.tiers?.vip_sprinter?.reducedPricePerKmCents ?? 240) / 100
  );
  const [sprinterLongHaulDiscount, setSprinterLongHaulDiscount] = useState<number>(
    current.tiers?.vip_sprinter?.longHaulDiscountPercent ?? 22
  );
  const [sprinterLongHaul, setSprinterLongHaul] = useState<number>(
    (current.tiers?.vip_sprinter?.longHaulPricePerKmCents ?? 350) / 100
  );
  const [sprinterTimeRate, setSprinterTimeRate] = useState<number>(
    (current.tiers?.vip_sprinter?.pricePerMinuteCents ?? 75) / 100
  );
  const [sprinterMinFare, setSprinterMinFare] = useState<number>(
    (current.tiers?.vip_sprinter?.minimumFareCents ?? 6000) / 100
  );

  // Live Simulator state
  const [testDistance, setTestDistance] = useState<number>(14.3);
  const [testDuration, setTestDuration] = useState<number>(40);
  const [testAirport, setTestAirport] = useState<boolean>(false);

  const [busy, setBusy] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function handleUnitChange(newUnit: "km" | "mile") {
    if (newUnit === unit) return;
    setUnit(newUnit);
    if (newUnit === "km") {
      setThreshold1(16);
      setThreshold2(80);
      setTestDistance(23);
    } else {
      setThreshold1(10);
      setThreshold2(50);
      setTestDistance(14.3);
    }
  }

  function applyPreset(distance: number, duration: number, airport: boolean) {
    setTestDistance(distance);
    setTestDuration(duration);
    setTestAirport(airport);
  }

  async function handleSave() {
    setBusy(true);
    setSavedSuccess(false);
    try {
      const payload: TransportationPricingConfig = {
        unit,
        longDistanceThreshold: Math.max(1, Number(threshold1) || (unit === "mile" ? 10 : 16)),
        longHaulThreshold: Math.max(
          threshold1 + 1,
          Number(threshold2) || (unit === "mile" ? 50 : 80)
        ),
        bookingFeeCents: Math.round(Math.max(0, bookingFee) * 100),
        airportFeeCents: Math.round(Math.max(0, airportFee) * 100),
        surgeMultiplier: Number(surgeMultiplier) || 1.0,
        driverPayoutPercent: Math.max(1, Math.min(100, Number(driverPayoutPercent) || 75)),
        tiers: {
          executive_sedan: {
            basePriceCents: Math.round(Math.max(0, sedanBase) * 100),
            pricePerKmCents: Math.round(Math.max(0, sedanStandard) * 100),
            reducedPricePerKmCents: Math.round(Math.max(0, sedanReduced) * 100),
            longDistanceDiscountPercent: Math.round(
              Math.max(0, Math.min(100, sedanDiscountPercent))
            ),
            longHaulPricePerKmCents: Math.round(Math.max(0, sedanLongHaul) * 100),
            longHaulDiscountPercent: Math.round(Math.max(0, Math.min(100, sedanLongHaulDiscount))),
            pricePerMinuteCents: Math.round(Math.max(0, sedanTimeRate) * 100),
            minimumFareCents: Math.round(Math.max(0, sedanMinFare) * 100)
          },
          luxury_suv: {
            basePriceCents: Math.round(Math.max(0, suvBase) * 100),
            pricePerKmCents: Math.round(Math.max(0, suvStandard) * 100),
            reducedPricePerKmCents: Math.round(Math.max(0, suvReduced) * 100),
            longDistanceDiscountPercent: Math.round(Math.max(0, Math.min(100, suvDiscountPercent))),
            longHaulPricePerKmCents: Math.round(Math.max(0, suvLongHaul) * 100),
            longHaulDiscountPercent: Math.round(Math.max(0, Math.min(100, suvLongHaulDiscount))),
            pricePerMinuteCents: Math.round(Math.max(0, suvTimeRate) * 100),
            minimumFareCents: Math.round(Math.max(0, suvMinFare) * 100)
          },
          vip_sprinter: {
            basePriceCents: Math.round(Math.max(0, sprinterBase) * 100),
            pricePerKmCents: Math.round(Math.max(0, sprinterStandard) * 100),
            reducedPricePerKmCents: Math.round(Math.max(0, sprinterReduced) * 100),
            longDistanceDiscountPercent: Math.round(
              Math.max(0, Math.min(100, sprinterDiscountPercent))
            ),
            longHaulPricePerKmCents: Math.round(Math.max(0, sprinterLongHaul) * 100),
            longHaulDiscountPercent: Math.round(
              Math.max(0, Math.min(100, sprinterLongHaulDiscount))
            ),
            pricePerMinuteCents: Math.round(Math.max(0, sprinterTimeRate) * 100),
            minimumFareCents: Math.round(Math.max(0, sprinterMinFare) * 100)
          }
        }
      };

      await onSave(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } finally {
      setBusy(false);
    }
  }

  // Calculate live simulation for a given tier
  function calculateSim(
    base: number,
    std: number,
    red: number,
    lh: number,
    timeRate: number,
    minFare: number
  ) {
    const d1 = Math.min(testDistance, threshold1);
    const d2 = Math.min(
      Math.max(0, testDistance - threshold1),
      Math.max(0, threshold2 - threshold1)
    );
    const d3 = Math.max(0, testDistance - threshold2);

    const distCost = d1 * std + d2 * red + d3 * lh;
    const timeCost = testDuration * timeRate;
    const rawSubtotal = base + distCost + timeCost;
    const subtotal = Math.max(minFare, rawSubtotal);
    const surged = subtotal * surgeMultiplier;
    const fees = bookingFee + (testAirport ? airportFee : 0);
    const total = surged + fees;

    const minRange = total * 0.96;
    const maxRange = total * 1.08;

    const driverEarnings = (total - bookingFee) * (driverPayoutPercent / 100);
    const platformMargin = total - driverEarnings;

    return {
      d1,
      d2,
      d3,
      distCost,
      timeCost,
      fees,
      total,
      minRange,
      maxRange,
      driverEarnings,
      platformMargin
    };
  }

  const sedanSim = calculateSim(
    sedanBase,
    sedanStandard,
    sedanReduced,
    sedanLongHaul,
    sedanTimeRate,
    sedanMinFare
  );
  const suvSim = calculateSim(
    suvBase,
    suvStandard,
    suvReduced,
    suvLongHaul,
    suvTimeRate,
    suvMinFare
  );
  const sprinterSim = calculateSim(
    sprinterBase,
    sprinterStandard,
    sprinterReduced,
    sprinterLongHaul,
    sprinterTimeRate,
    sprinterMinFare
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <Car className="size-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Uber-Grade Marketplace Pricing Engine
              </h3>
              <p className="text-xs text-slate-500">
                Calibrated multi-bracket distance decay, traffic duration, fees &amp; driver
                economics
              </p>
            </div>
          </div>
        </div>

        {/* Distance Unit Toggle & Save Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => handleUnitChange("km")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                unit === "km"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Kilometers (KM)
            </button>
            <button
              type="button"
              onClick={() => handleUnitChange("mile")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                unit === "mile"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Miles (US MI)
            </button>
          </div>

          <Button onClick={handleSave} disabled={busy} className="bg-sky-600 hover:bg-sky-700">
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
              </>
            ) : savedSuccess ? (
              <>
                <Check className="mr-2 size-4 text-emerald-300" /> Saved!
              </>
            ) : (
              <>
                <Check className="mr-2 size-4" /> Save Pricing
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Global Market Fees, Surge & Distance Thresholds Card */}
      <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-sky-100 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-sky-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Marketplace Parameters &amp; Mileage Brackets
              </h4>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                3-Tier Distance Decay
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Tier 1 (0–{threshold1} {unit}): City base · Tier 2 ({threshold1}–{threshold2} {unit}):
              Regional highway · Tier 3 ({threshold2}+ {unit}): Long-haul intercity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span>Local Cap:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={threshold1}
                onChange={(e) => setThreshold1(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center text-xs font-bold text-slate-900 shadow-xs"
              />
              <span className="text-[10px] text-slate-500 uppercase">{unit}</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <span>Long-Haul Cap:</span>
              <input
                type="number"
                min={threshold1 + 1}
                max="300"
                value={threshold2}
                onChange={(e) =>
                  setThreshold2(Math.max(threshold1 + 1, parseFloat(e.target.value) || 50))
                }
                className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-center text-xs font-bold text-slate-900 shadow-xs"
              />
              <span className="text-[10px] text-slate-500 uppercase">{unit}</span>
            </label>
          </div>
        </div>

        {/* Global Fees Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/80 bg-white/90 p-2.5">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Booking Fee
            </span>
            <div className="relative mt-1">
              <span className="absolute top-1/2 left-2 -translate-y-1/2 text-xs font-bold text-slate-400">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={bookingFee}
                onChange={(e) => setBookingFee(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-200 py-1 pr-2 pl-6 text-xs font-bold text-slate-800"
              />
            </div>
            <span className="mt-0.5 block text-[9px] text-slate-400">Platform base per trip</span>
          </div>

          <div className="rounded-xl border border-white/80 bg-white/90 p-2.5">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Airport Surcharge
            </span>
            <div className="relative mt-1">
              <span className="absolute top-1/2 left-2 -translate-y-1/2 text-xs font-bold text-slate-400">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={airportFee}
                onChange={(e) => setAirportFee(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-200 py-1 pr-2 pl-6 text-xs font-bold text-slate-800"
              />
            </div>
            <span className="mt-0.5 block text-[9px] text-slate-400">MCO, MIA, JFK, EWR, LGA</span>
          </div>

          <div className="rounded-xl border border-white/80 bg-white/90 p-2.5">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Dynamic Surge
            </span>
            <div className="relative mt-1">
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.05"
                value={surgeMultiplier}
                onChange={(e) =>
                  setSurgeMultiplier(Math.max(1.0, parseFloat(e.target.value) || 1.0))
                }
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800"
              />
            </div>
            <span className="mt-0.5 block text-[9px] text-slate-400">
              Baseline 1.0x (Peak 1.25x–2.0x)
            </span>
          </div>

          <div className="rounded-xl border border-white/80 bg-white/90 p-2.5">
            <span className="block text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
              Driver Payout %
            </span>
            <div className="relative mt-1">
              <input
                type="number"
                min="50"
                max="95"
                step="1"
                value={driverPayoutPercent}
                onChange={(e) =>
                  setDriverPayoutPercent(Math.max(50, Math.min(95, Number(e.target.value) || 75)))
                }
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800"
              />
            </div>
            <span className="mt-0.5 block text-[9px] text-slate-400">
              Platform margin: {100 - driverPayoutPercent}%
            </span>
          </div>
        </div>

        {/* Live Multi-Route Benchmark Simulator Bar */}
        <div className="mt-4 border-t border-sky-100 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Calculator className="size-3.5 text-sky-700" />
              <span>Real-World Benchmark Presets:</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(14.3, 40, false)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-sky-400 hover:bg-sky-50"
              >
                🏙 NYC Metro (14.3 mi · 40m)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(55.1, 75, false)}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-sky-400 hover:bg-sky-50"
              >
                🛣 Newark $\rightarrow$ Long Island (55.1 mi · 75m)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(235, 220, true)}
                className="cursor-pointer rounded-lg border border-sky-300 bg-sky-100/80 px-2.5 py-1 text-[11px] font-bold text-sky-900 hover:bg-sky-200"
              >
                ✈ Orlando MCO $\rightarrow$ Miami MIA (235 mi · 220m)
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 font-medium text-slate-700">
              <Route className="size-3.5 text-sky-600" />
              <span>Distance:</span>
              <input
                type="number"
                min="1"
                max="500"
                step="0.5"
                value={testDistance}
                onChange={(e) => setTestDistance(Math.max(1, parseFloat(e.target.value) || 1))}
                className="w-16 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-center font-bold text-slate-800 shadow-xs"
              />
              <span className="font-semibold text-slate-600">{unit}</span>
            </label>

            <label className="flex items-center gap-1.5 font-medium text-slate-700">
              <Clock className="size-3.5 text-slate-500" />
              <span>Drive Time:</span>
              <input
                type="number"
                min="1"
                max="600"
                value={testDuration}
                onChange={(e) => setTestDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 rounded-md border border-slate-300 bg-white px-1.5 py-0.5 text-center font-bold text-slate-800 shadow-xs"
              />
              <span className="font-semibold text-slate-600">mins</span>
            </label>

            <label className="flex items-center gap-1.5 font-medium text-slate-700">
              <Plane className="size-3.5 text-amber-600" />
              <input
                type="checkbox"
                checked={testAirport}
                onChange={(e) => setTestAirport(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Airport Surcharge (+${airportFee})</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3 Vehicle Tiers Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {/* Tier 1: Executive Sedan */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-sky-300 hover:bg-white hover:shadow-md sm:p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                Most Popular
              </span>
              <span className="text-[11px] font-semibold text-slate-500">UberX / Uber Black</span>
            </div>

            <h4 className="mt-2 text-base font-bold text-slate-900">Executive Sedan</h4>
            <p className="text-xs text-slate-500">1–3 Passengers · 3 Bags</p>
            <p className="mt-0.5 text-[11px] text-slate-400 italic">
              Mercedes-Benz S-Class, BMW 7 Series
            </p>

            <div className="mt-4 space-y-3">
              {/* Base Price & Minimum Fare */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Base Fare ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sedanBase}
                    onChange={(e) => setSedanBase(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Min Trip Fare ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sedanMinFare}
                    onChange={(e) => setSedanMinFare(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Tier 1 Rate (Local) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Tier 1: Local Rate (0–{threshold1} {unit})
                </label>
                <div className="relative mt-1">
                  <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={sedanStandard}
                    onChange={(e) => setSedanStandard(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-2 pl-6 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Tier 2 Rate (Regional Highway) */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                  <span>
                    Tier 2: Regional ({threshold1}–{threshold2} {unit})
                  </span>
                  <span className="font-bold text-emerald-700">
                    ${sedanReduced.toFixed(2)}/{unit}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="70"
                    step="1"
                    value={sedanDiscountPercent}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setSedanDiscountPercent(p);
                      setSedanReduced(parseFloat((sedanStandard * (1 - p / 100)).toFixed(2)));
                    }}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-sky-200 accent-sky-600"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    {sedanDiscountPercent}% off
                  </span>
                </div>
              </div>

              {/* Tier 3 Rate (Long-Haul Intercity) */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                  <span>
                    Tier 3: Long-Haul ({threshold2}+ {unit})
                  </span>
                  <span className="font-bold text-amber-800">
                    ${sedanLongHaul.toFixed(2)}/{unit}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="70"
                    step="1"
                    value={sedanLongHaulDiscount}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setSedanLongHaulDiscount(p);
                      setSedanLongHaul(parseFloat((sedanStandard * (1 - p / 100)).toFixed(2)));
                    }}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-amber-200 accent-amber-600"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    {sedanLongHaulDiscount}% off
                  </span>
                </div>
              </div>

              {/* Traffic Time Rate */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Traffic Time Rate ($/minute)
                </label>
                <div className="relative mt-1">
                  <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={sedanTimeRate}
                    onChange={(e) => setSedanTimeRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-2 pl-6 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Card */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Simulation Result:</span>
              <span className="text-base font-bold text-sky-700">${sedanSim.total.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Est. Range:</span>
              <span className="font-medium text-slate-700">
                ${sedanSim.minRange.toFixed(2)} – ${sedanSim.maxRange.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>
                  Distance ({testDistance} {unit}):
                </span>
                <span>${sedanSim.distCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Traffic Time ({testDuration}m):</span>
                <span>${sedanSim.timeCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>Driver Payout ({driverPayoutPercent}%):</span>
                <span>${sedanSim.driverEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sky-700">
                <span>Platform Margin ({100 - driverPayoutPercent}%):</span>
                <span>${sedanSim.platformMargin.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 2: Luxury SUV */}
        <div className="flex flex-col justify-between rounded-2xl border border-sky-300 bg-sky-50/30 p-4 transition-all hover:bg-white hover:shadow-md sm:p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-sky-200 px-2.5 py-0.5 text-[10px] font-bold text-sky-900">
                Spacious Comfort
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                UberXL / Uber Black SUV
              </span>
            </div>

            <h4 className="mt-2 text-base font-bold text-slate-900">Luxury SUV</h4>
            <p className="text-xs text-slate-500">1–6 Passengers · 6 Bags</p>
            <p className="mt-0.5 text-[11px] text-slate-400 italic">
              Cadillac Escalade, Lincoln Navigator
            </p>

            <div className="mt-4 space-y-3">
              {/* Base Price & Minimum Fare */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Base Fare ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={suvBase}
                    onChange={(e) => setSuvBase(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Min Trip Fare ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={suvMinFare}
                    onChange={(e) => setSuvMinFare(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Tier 1 Rate (Local) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Tier 1: Local Rate (0–{threshold1} {unit})
                </label>
                <div className="relative mt-1">
                  <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={suvStandard}
                    onChange={(e) => setSuvStandard(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-2 pl-6 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Tier 2 Rate (Regional Highway) */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                  <span>
                    Tier 2: Regional ({threshold1}–{threshold2} {unit})
                  </span>
                  <span className="font-bold text-emerald-700">
                    ${suvReduced.toFixed(2)}/{unit}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="70"
                    step="1"
                    value={suvDiscountPercent}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setSuvDiscountPercent(p);
                      setSuvReduced(parseFloat((suvStandard * (1 - p / 100)).toFixed(2)));
                    }}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-sky-200 accent-sky-600"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    {suvDiscountPercent}% off
                  </span>
                </div>
              </div>

              {/* Tier 3 Rate (Long-Haul Intercity) */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                  <span>
                    Tier 3: Long-Haul ({threshold2}+ {unit})
                  </span>
                  <span className="font-bold text-amber-800">
                    ${suvLongHaul.toFixed(2)}/{unit}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="70"
                    step="1"
                    value={suvLongHaulDiscount}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setSuvLongHaulDiscount(p);
                      setSuvLongHaul(parseFloat((suvStandard * (1 - p / 100)).toFixed(2)));
                    }}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-amber-200 accent-amber-600"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    {suvLongHaulDiscount}% off
                  </span>
                </div>
              </div>

              {/* Traffic Time Rate */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Traffic Time Rate ($/minute)
                </label>
                <div className="relative mt-1">
                  <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={suvTimeRate}
                    onChange={(e) => setSuvTimeRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-2 pl-6 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Card */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Simulation Result:</span>
              <span className="text-base font-bold text-sky-700">${suvSim.total.toFixed(2)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Est. Range:</span>
              <span className="font-medium text-slate-700">
                ${suvSim.minRange.toFixed(2)} – ${suvSim.maxRange.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>
                  Distance ({testDistance} {unit}):
                </span>
                <span>${suvSim.distCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Traffic Time ({testDuration}m):</span>
                <span>${suvSim.timeCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>Driver Payout ({driverPayoutPercent}%):</span>
                <span>${suvSim.driverEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sky-700">
                <span>Platform Margin ({100 - driverPayoutPercent}%):</span>
                <span>${suvSim.platformMargin.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 3: VIP Executive Sprinter */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-sky-300 hover:bg-white hover:shadow-md sm:p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-800">
                Group Luxury
              </span>
              <span className="text-[11px] font-semibold text-slate-500">VIP Sprinter Van</span>
            </div>

            <h4 className="mt-2 text-base font-bold text-slate-900">VIP Executive Sprinter</h4>
            <p className="text-xs text-slate-500">1–12 Passengers · 12 Bags</p>
            <p className="mt-0.5 text-[11px] text-slate-400 italic">
              Mercedes-Benz Sprinter Executive
            </p>

            <div className="mt-4 space-y-3">
              {/* Base Price & Minimum Fare */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Base Fare ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sprinterBase}
                    onChange={(e) => setSprinterBase(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Min Trip Fare ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={sprinterMinFare}
                    onChange={(e) =>
                      setSprinterMinFare(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Tier 1 Rate (Local) */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Tier 1: Local Rate (0–{threshold1} {unit})
                </label>
                <div className="relative mt-1">
                  <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={sprinterStandard}
                    onChange={(e) =>
                      setSprinterStandard(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-2 pl-6 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Tier 2 Rate (Regional Highway) */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                  <span>
                    Tier 2: Regional ({threshold1}–{threshold2} {unit})
                  </span>
                  <span className="font-bold text-emerald-700">
                    ${sprinterReduced.toFixed(2)}/{unit}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="70"
                    step="1"
                    value={sprinterDiscountPercent}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setSprinterDiscountPercent(p);
                      setSprinterReduced(parseFloat((sprinterStandard * (1 - p / 100)).toFixed(2)));
                    }}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-sky-200 accent-sky-600"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    {sprinterDiscountPercent}% off
                  </span>
                </div>
              </div>

              {/* Tier 3 Rate (Long-Haul Intercity) */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                  <span>
                    Tier 3: Long-Haul ({threshold2}+ {unit})
                  </span>
                  <span className="font-bold text-amber-800">
                    ${sprinterLongHaul.toFixed(2)}/{unit}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="70"
                    step="1"
                    value={sprinterLongHaulDiscount}
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      setSprinterLongHaulDiscount(p);
                      setSprinterLongHaul(
                        parseFloat((sprinterStandard * (1 - p / 100)).toFixed(2))
                      );
                    }}
                    className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-amber-200 accent-amber-600"
                  />
                  <span className="text-[11px] font-bold text-slate-700">
                    {sprinterLongHaulDiscount}% off
                  </span>
                </div>
              </div>

              {/* Traffic Time Rate */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700">
                  Traffic Time Rate ($/minute)
                </label>
                <div className="relative mt-1">
                  <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.05"
                    value={sprinterTimeRate}
                    onChange={(e) =>
                      setSprinterTimeRate(Math.max(0, parseFloat(e.target.value) || 0))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pr-2 pl-6 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Simulation Card */}
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-700">
              <span>Simulation Result:</span>
              <span className="text-base font-bold text-sky-700">
                ${sprinterSim.total.toFixed(2)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Est. Range:</span>
              <span className="font-medium text-slate-700">
                ${sprinterSim.minRange.toFixed(2)} – ${sprinterSim.maxRange.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 space-y-0.5 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>
                  Distance ({testDistance} {unit}):
                </span>
                <span>${sprinterSim.distCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Traffic Time ({testDuration}m):</span>
                <span>${sprinterSim.timeCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>Driver Payout ({driverPayoutPercent}%):</span>
                <span>${sprinterSim.driverEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-sky-700">
                <span>Platform Margin ({100 - driverPayoutPercent}%):</span>
                <span>${sprinterSim.platformMargin.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          <Check className="size-4" />
          Transportation pricing and marketplace parameters updated successfully! Live passenger
          fares will immediately reflect these rates.
        </div>
      )}
    </div>
  );
}
