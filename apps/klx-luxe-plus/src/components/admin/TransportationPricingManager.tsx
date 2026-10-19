"use client";

import { useState } from "react";

import { Calculator, Car, Check, Loader2, Route, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@repo/ui";

import type { TransportationPricingConfig, VehiclePricingConfig } from "@/server/db/types";

interface Props {
  initialPricing?: TransportationPricingConfig;
  onSave: (pricing: TransportationPricingConfig) => Promise<void>;
}

const DEFAULT_PRICING: TransportationPricingConfig = {
  unit: "km",
  tiers: {
    executive_sedan: { basePriceCents: 5000, pricePerKmCents: 250 },
    luxury_suv: { basePriceCents: 8000, pricePerKmCents: 350 },
    vip_sprinter: { basePriceCents: 12000, pricePerKmCents: 500 }
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
  const [testDistanceKm, setTestDistanceKm] = useState<number>(20);

  // Sedan state
  const [sedanBase, setSedanBase] = useState<number>(
    (current.tiers?.executive_sedan?.basePriceCents ?? 5000) / 100
  );
  const [sedanPerKm, setSedanPerKm] = useState<number>(
    (current.tiers?.executive_sedan?.pricePerKmCents ?? 250) / 100
  );

  // SUV state
  const [suvBase, setSuvBase] = useState<number>(
    (current.tiers?.luxury_suv?.basePriceCents ?? 8000) / 100
  );
  const [suvPerKm, setSuvPerKm] = useState<number>(
    (current.tiers?.luxury_suv?.pricePerKmCents ?? 350) / 100
  );

  // Sprinter state
  const [sprinterBase, setSprinterBase] = useState<number>(
    (current.tiers?.vip_sprinter?.basePriceCents ?? 12000) / 100
  );
  const [sprinterPerKm, setSprinterPerKm] = useState<number>(
    (current.tiers?.vip_sprinter?.pricePerKmCents ?? 500) / 100
  );

  const [busy, setBusy] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const tierState = {
    executive_sedan: {
      base: sedanBase,
      perKm: sedanPerKm,
      setBase: setSedanBase,
      setPerKm: setSedanPerKm
    },
    luxury_suv: { base: suvBase, perKm: suvPerKm, setBase: setSuvBase, setPerKm: setSuvPerKm },
    vip_sprinter: {
      base: sprinterBase,
      perKm: sprinterPerKm,
      setBase: setSprinterBase,
      setPerKm: setSprinterPerKm
    }
  };

  async function handleSave() {
    setBusy(true);
    setSavedSuccess(false);
    try {
      const payload: TransportationPricingConfig = {
        unit,
        tiers: {
          executive_sedan: {
            basePriceCents: Math.round(Math.max(0, sedanBase) * 100),
            pricePerKmCents: Math.round(Math.max(0, sedanPerKm) * 100)
          },
          luxury_suv: {
            basePriceCents: Math.round(Math.max(0, suvBase) * 100),
            pricePerKmCents: Math.round(Math.max(0, suvPerKm) * 100)
          },
          vip_sprinter: {
            basePriceCents: Math.round(Math.max(0, sprinterBase) * 100),
            pricePerKmCents: Math.round(Math.max(0, sprinterPerKm) * 100)
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
                  Transportation Vehicle Pricing (Per-KM Fare Formula)
                </h3>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  Active in Live Booking
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Configure base price and per-kilometer rates for all chauffeured vehicles.
              </p>
            </div>
          </div>
        </div>

        {/* Distance Unit Toggle & Live Simulation Slider */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            <button
              type="button"
              onClick={() => setUnit("km")}
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
              onClick={() => setUnit("mile")}
              className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                unit === "mile"
                  ? "bg-white text-sky-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Miles
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

      {/* Formula Explainer Banner */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-sky-50/70 p-4 text-xs text-sky-950">
        <div className="flex items-center gap-2">
          <Calculator className="size-4 shrink-0 text-sky-700" />
          <span>
            <strong>Fare Calculation Formula:</strong>{" "}
            <code className="rounded bg-sky-100 px-2 py-0.5 font-mono text-xs font-bold text-sky-900">
              Total Fare = Base Price + (Trip Distance in {unit.toUpperCase()} × Price per{" "}
              {unit.toUpperCase()})
            </code>
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Route className="size-3.5 text-sky-600" />
          <span>Simulate distance:</span>
          <input
            type="number"
            min={1}
            max={300}
            value={testDistanceKm}
            onChange={(e) => setTestDistanceKm(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 rounded-md border border-slate-300 bg-white px-2 py-0.5 text-center font-bold text-slate-800"
          />
          <span>{unit}</span>
        </div>
      </div>

      {/* 3 Vehicle Tiers Grid */}
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {TIERS_META.map((meta) => {
          const { base, perKm, setBase, setPerKm } = tierState[meta.id];
          const calculatedTestTotal = base + testDistanceKm * perKm;

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
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Base Price ($ USD)
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
                    <span className="text-[10px] text-slate-400">Fixed upfront base fee</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Price per {unit.toUpperCase()} ($ USD)
                    </label>
                    <div className="relative mt-1">
                      <span className="absolute top-1/2 left-3 -translate-y-1/2 font-semibold text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={perKm}
                        onChange={(e) => setPerKm(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-8 text-sm font-bold text-slate-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Rate multiplied by trip distance
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-3 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>
                    Simulation ({testDistanceKm} {unit}):
                  </span>
                  <span className="font-mono text-[11px]">
                    ${base.toFixed(0)} + ({testDistanceKm} × ${perKm.toFixed(2)})
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between border-t border-slate-100 pt-1.5 font-bold">
                  <span className="text-slate-800">Total Customer Fare:</span>
                  <span className="text-base text-sky-700">${calculatedTestTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {savedSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          <Check className="size-4" />
          Transportation vehicle pricing updated successfully! Live fares will immediately reflect
          these rates.
        </div>
      )}
    </div>
  );
}
