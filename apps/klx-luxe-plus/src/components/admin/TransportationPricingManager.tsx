"use client";

import { useState } from "react";

import { Calculator, Car, Check, Gauge, Loader2, Route } from "lucide-react";

import { Button } from "@repo/ui";

import type { TransportationPricingConfig } from "@/server/db/types";

interface Props {
  initialPricing?: TransportationPricingConfig;
  onSave: (pricing: TransportationPricingConfig) => Promise<void>;
}

const DEFAULT_PRICING: TransportationPricingConfig = {
  unit: "km",
  longDistanceThreshold: 16,
  tiers: {
    executive_sedan: {
      basePriceCents: 5000,
      pricePerKmCents: 250,
      reducedPricePerKmCents: 175,
      longDistanceDiscountPercent: 30
    },
    luxury_suv: {
      basePriceCents: 8000,
      pricePerKmCents: 350,
      reducedPricePerKmCents: 245,
      longDistanceDiscountPercent: 30
    },
    vip_sprinter: {
      basePriceCents: 12000,
      pricePerKmCents: 500,
      reducedPricePerKmCents: 350,
      longDistanceDiscountPercent: 30
    }
  }
};

interface TierMeta {
  id: "executive_sedan" | "luxury_suv" | "vip_sprinter";
  name: string;
  badge: string;
  capacity: string;
  models: string;
}

const TIERS_META: TierMeta[] = [
  {
    id: "executive_sedan",
    name: "Executive Sedan",
    badge: "Most Popular",
    capacity: "1–3 Passengers · 3 Bags",
    models: "Mercedes-Benz S-Class, BMW 7 Series"
  },
  {
    id: "luxury_suv",
    name: "Luxury SUV",
    badge: "Spacious Comfort",
    capacity: "1–6 Passengers · 6 Bags",
    models: "Cadillac Escalade, Lincoln Navigator"
  },
  {
    id: "vip_sprinter",
    name: "VIP Executive Sprinter",
    badge: "Group Luxury",
    capacity: "1–12 Passengers · 12 Bags",
    models: "Mercedes-Benz Sprinter Executive"
  }
];

export function TransportationPricingManager({ initialPricing, onSave }: Props) {
  const current = initialPricing || DEFAULT_PRICING;

  const [unit, setUnit] = useState<"km" | "mile">(current.unit || "km");
  const [threshold, setThreshold] = useState<number>(
    current.longDistanceThreshold ?? (current.unit === "mile" ? 10 : 16)
  );
  const [testDistance, setTestDistance] = useState<number>(20);

  // Sedan state
  const [sedanBase, setSedanBase] = useState<number>(
    (current.tiers?.executive_sedan?.basePriceCents ?? 5000) / 100
  );
  const [sedanStandard, setSedanStandard] = useState<number>(
    (current.tiers?.executive_sedan?.pricePerKmCents ?? 250) / 100
  );
  const [sedanDiscountPercent, setSedanDiscountPercent] = useState<number>(
    current.tiers?.executive_sedan?.longDistanceDiscountPercent ?? 30
  );
  const [sedanReduced, setSedanReduced] = useState<number>(
    (current.tiers?.executive_sedan?.reducedPricePerKmCents ??
      Math.round((current.tiers?.executive_sedan?.pricePerKmCents ?? 250) * 0.7)) / 100
  );

  // SUV state
  const [suvBase, setSuvBase] = useState<number>(
    (current.tiers?.luxury_suv?.basePriceCents ?? 8000) / 100
  );
  const [suvStandard, setSuvStandard] = useState<number>(
    (current.tiers?.luxury_suv?.pricePerKmCents ?? 350) / 100
  );
  const [suvDiscountPercent, setSuvDiscountPercent] = useState<number>(
    current.tiers?.luxury_suv?.longDistanceDiscountPercent ?? 30
  );
  const [suvReduced, setSuvReduced] = useState<number>(
    (current.tiers?.luxury_suv?.reducedPricePerKmCents ??
      Math.round((current.tiers?.luxury_suv?.pricePerKmCents ?? 350) * 0.7)) / 100
  );

  // Sprinter state
  const [sprinterBase, setSprinterBase] = useState<number>(
    (current.tiers?.vip_sprinter?.basePriceCents ?? 12000) / 100
  );
  const [sprinterStandard, setSprinterStandard] = useState<number>(
    (current.tiers?.vip_sprinter?.pricePerKmCents ?? 500) / 100
  );
  const [sprinterDiscountPercent, setSprinterDiscountPercent] = useState<number>(
    current.tiers?.vip_sprinter?.longDistanceDiscountPercent ?? 30
  );
  const [sprinterReduced, setSprinterReduced] = useState<number>(
    (current.tiers?.vip_sprinter?.reducedPricePerKmCents ??
      Math.round((current.tiers?.vip_sprinter?.pricePerKmCents ?? 500) * 0.7)) / 100
  );

  const [busy, setBusy] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  function updateSedanStandard(val: number) {
    const s = Math.max(0, val);
    setSedanStandard(s);
    setSedanReduced(parseFloat((s * (1 - sedanDiscountPercent / 100)).toFixed(2)));
  }

  function updateSedanDiscount(pct: number) {
    const p = Math.max(0, Math.min(100, pct));
    setSedanDiscountPercent(p);
    setSedanReduced(parseFloat((sedanStandard * (1 - p / 100)).toFixed(2)));
  }

  function updateSedanReduced(r: number) {
    const red = Math.max(0, r);
    setSedanReduced(red);
    if (sedanStandard > 0) {
      setSedanDiscountPercent(
        Math.max(0, Math.min(100, Math.round(((sedanStandard - red) / sedanStandard) * 100)))
      );
    }
  }

  function updateSuvStandard(val: number) {
    const s = Math.max(0, val);
    setSuvStandard(s);
    setSuvReduced(parseFloat((s * (1 - suvDiscountPercent / 100)).toFixed(2)));
  }

  function updateSuvDiscount(pct: number) {
    const p = Math.max(0, Math.min(100, pct));
    setSuvDiscountPercent(p);
    setSuvReduced(parseFloat((suvStandard * (1 - p / 100)).toFixed(2)));
  }

  function updateSuvReduced(r: number) {
    const red = Math.max(0, r);
    setSuvReduced(red);
    if (suvStandard > 0) {
      setSuvDiscountPercent(
        Math.max(0, Math.min(100, Math.round(((suvStandard - red) / suvStandard) * 100)))
      );
    }
  }

  function updateSprinterStandard(val: number) {
    const s = Math.max(0, val);
    setSprinterStandard(s);
    setSprinterReduced(parseFloat((s * (1 - sprinterDiscountPercent / 100)).toFixed(2)));
  }

  function updateSprinterDiscount(pct: number) {
    const p = Math.max(0, Math.min(100, pct));
    setSprinterDiscountPercent(p);
    setSprinterReduced(parseFloat((sprinterStandard * (1 - p / 100)).toFixed(2)));
  }

  function updateSprinterReduced(r: number) {
    const red = Math.max(0, r);
    setSprinterReduced(red);
    if (sprinterStandard > 0) {
      setSprinterDiscountPercent(
        Math.max(0, Math.min(100, Math.round(((sprinterStandard - red) / sprinterStandard) * 100)))
      );
    }
  }

  const tierState = {
    executive_sedan: {
      base: sedanBase,
      standard: sedanStandard,
      reduced: sedanReduced,
      discountPercent: sedanDiscountPercent,
      setBase: setSedanBase,
      setStandard: updateSedanStandard,
      setDiscount: updateSedanDiscount,
      setReduced: updateSedanReduced
    },
    luxury_suv: {
      base: suvBase,
      standard: suvStandard,
      reduced: suvReduced,
      discountPercent: suvDiscountPercent,
      setBase: setSuvBase,
      setStandard: updateSuvStandard,
      setDiscount: updateSuvDiscount,
      setReduced: updateSuvReduced
    },
    vip_sprinter: {
      base: sprinterBase,
      standard: sprinterStandard,
      reduced: sprinterReduced,
      discountPercent: sprinterDiscountPercent,
      setBase: setSprinterBase,
      setStandard: updateSprinterStandard,
      setDiscount: updateSprinterDiscount,
      setReduced: updateSprinterReduced
    }
  };

  async function handleSave() {
    setBusy(true);
    setSavedSuccess(false);
    try {
      const payload: TransportationPricingConfig = {
        unit,
        longDistanceThreshold: Math.max(1, Number(threshold) || (unit === "mile" ? 10 : 16)),
        tiers: {
          executive_sedan: {
            basePriceCents: Math.round(Math.max(0, sedanBase) * 100),
            pricePerKmCents: Math.round(Math.max(0, sedanStandard) * 100),
            reducedPricePerKmCents: Math.round(Math.max(0, sedanReduced) * 100),
            longDistanceDiscountPercent: Math.round(
              Math.max(0, Math.min(100, sedanDiscountPercent))
            )
          },
          luxury_suv: {
            basePriceCents: Math.round(Math.max(0, suvBase) * 100),
            pricePerKmCents: Math.round(Math.max(0, suvStandard) * 100),
            reducedPricePerKmCents: Math.round(Math.max(0, suvReduced) * 100),
            longDistanceDiscountPercent: Math.round(Math.max(0, Math.min(100, suvDiscountPercent)))
          },
          vip_sprinter: {
            basePriceCents: Math.round(Math.max(0, sprinterBase) * 100),
            pricePerKmCents: Math.round(Math.max(0, sprinterStandard) * 100),
            reducedPricePerKmCents: Math.round(Math.max(0, sprinterReduced) * 100),
            longDistanceDiscountPercent: Math.round(
              Math.max(0, Math.min(100, sprinterDiscountPercent))
            )
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

  function handleUnitChange(nextUnit: "km" | "mile") {
    if (nextUnit === unit) return;
    setUnit(nextUnit);
    // Suggest conversion for threshold if untouched
    if (nextUnit === "mile" && threshold === 16) {
      setThreshold(10);
    } else if (nextUnit === "km" && threshold === 10) {
      setThreshold(16);
    }
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-sky-200/80 bg-white p-6 shadow-sm sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-sky-100 text-sky-800">
              <Car className="size-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">
                  Transportation Vehicle Pricing &amp; Mileage Tiers
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  Active in Live Booking
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure base fees, standard rates, and gradual long-distance discounts for each
                vehicle tier.
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
              Miles (MI)
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

      {/* Long-Distance Reduction Threshold Control Card */}
      <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50/60 p-4 sm:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gauge className="size-4 text-sky-700" />
              <h4 className="text-sm font-bold text-slate-900">
                Gradual Long-Distance Rate Reduction Threshold
              </h4>
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">
                Prevents Overcharging
              </span>
            </div>
            <p className="text-xs text-slate-600">
              When a trip reaches or exceeds this distance, all additional miles/km are billed at
              the reduced rate instead of the standard rate.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span>Threshold Distance:</span>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="500"
                  step="1"
                  value={threshold}
                  onChange={(e) => setThreshold(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-20 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-center text-sm font-bold text-slate-900 shadow-xs focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-700 uppercase shadow-xs">
                {unit}
              </span>
            </label>
          </div>
        </div>

        {/* Live Simulator Distance Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 pt-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calculator className="size-3.5 text-sky-700" />
            <span>
              <strong>Formula:</strong> Trips up to {threshold} {unit} pay standard rate. Distance
              beyond {threshold} {unit} receives the reduced rate.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Route className="size-3.5 text-sky-600" />
            <span className="font-medium text-slate-700">Test Simulation Distance:</span>
            <input
              type="number"
              min="1"
              max="500"
              value={testDistance}
              onChange={(e) => setTestDistance(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-center font-bold text-slate-800 shadow-xs"
            />
            <span className="font-semibold text-slate-700">{unit}</span>
          </div>
        </div>
      </div>

      {/* 3 Vehicle Tiers Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {TIERS_META.map((meta) => {
          const {
            base,
            standard,
            reduced,
            discountPercent,
            setBase,
            setStandard,
            setDiscount,
            setReduced
          } = tierState[meta.id];

          // Simulation calculation
          let simTotal = base;
          let simStandardDist = testDistance;
          let simDiscountedDist = 0;

          if (testDistance <= threshold) {
            simTotal += testDistance * standard;
          } else {
            simStandardDist = threshold;
            simDiscountedDist = testDistance - threshold;
            simTotal += simStandardDist * standard + simDiscountedDist * reduced;
          }

          const unadjustedTotal = base + testDistance * standard;
          const savings = Math.max(0, unadjustedTotal - simTotal);

          return (
            <div
              key={meta.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition-all hover:border-sky-300 hover:bg-white hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800">
                    {meta.badge}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {meta.id === "executive_sedan"
                      ? "Sedan"
                      : meta.id === "luxury_suv"
                        ? "SUV"
                        : "Van"}
                  </span>
                </div>

                <h4 className="mt-3 text-base font-bold text-slate-900">{meta.name}</h4>
                <p className="text-xs text-slate-500">{meta.capacity}</p>
                <p className="mt-0.5 text-[11px] text-slate-400 italic">{meta.models}</p>

                {/* Input Fields */}
                <div className="mt-5 space-y-3.5">
                  {/* Base Price */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Base Pickup Fee ($ USD)
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={base}
                        onChange={(e) => setBase(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-8 text-sm font-bold text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Upfront dispatch base charge</span>
                  </div>

                  {/* Standard Rate */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Standard Rate (Up to {threshold} {unit})
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.05"
                        value={standard}
                        onChange={(e) => setStandard(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-8 text-sm font-bold text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Price per {unit} for the initial {threshold} {unit}
                    </span>
                  </div>

                  {/* Long-Distance Discount % & Reduced Rate */}
                  <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800">
                        Discount After {threshold} {unit}
                      </label>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {discountPercent}% OFF
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="70"
                        step="5"
                        value={discountPercent}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-sky-200 accent-sky-600"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountPercent}
                        onChange={(e) => setDiscount(Number(e.target.value))}
                        className="w-14 rounded-lg border border-slate-300 bg-white px-1.5 py-0.5 text-center text-xs font-bold text-slate-800"
                      />
                      <span className="text-xs font-semibold text-slate-600">%</span>
                    </div>

                    <div className="mt-2.5">
                      <label className="block text-[11px] font-medium text-slate-600">
                        Reduced Rate (Past {threshold} {unit})
                      </label>
                      <div className="relative mt-1">
                        <span className="absolute top-1/2 left-2.5 -translate-y-1/2 text-xs font-semibold text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.05"
                          value={reduced}
                          onChange={(e) => setReduced(parseFloat(e.target.value) || 0)}
                          className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pr-2.5 pl-7 text-xs font-bold text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                        />
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Per {unit} rate for distance beyond {threshold} {unit}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold text-slate-700">
                    Simulation ({testDistance} {unit}):
                  </span>
                  {savings > 0 && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      Saves ${savings.toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="mt-1.5 space-y-0.5 font-mono text-[11px] text-slate-500">
                  <div>Base Fee: ${base.toFixed(2)}</div>
                  {testDistance <= threshold ? (
                    <div>
                      Standard: {testDistance} {unit} × ${standard.toFixed(2)}
                    </div>
                  ) : (
                    <>
                      <div>
                        First {threshold} {unit} @ ${standard.toFixed(2)} = $
                        {(threshold * standard).toFixed(2)}
                      </div>
                      <div className="text-emerald-700">
                        Extra {(testDistance - threshold).toFixed(1)} {unit} @ ${reduced.toFixed(2)}{" "}
                        = ${((testDistance - threshold) * reduced).toFixed(2)}
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-2 flex items-baseline justify-between border-t border-slate-100 pt-2 font-bold">
                  <span className="text-slate-800">Total Customer Fare:</span>
                  <span className="text-base text-sky-700">${simTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          <Check className="size-4" />
          Transportation vehicle pricing and mileage tiers updated successfully! Live fares will
          immediately reflect these rates.
        </div>
      )}
    </div>
  );
}
