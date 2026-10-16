"use client";

import { useState } from "react";

import { Car, Check, CreditCard, MapPin, Navigation, ShieldCheck, Users } from "lucide-react";

export interface VehicleTier {
  id: string;
  name: string;
  passengers: string;
  description: string;
  baseFareCents: number;
}

export const VEHICLE_TIERS: VehicleTier[] = [
  {
    id: "executive_sedan",
    name: "Executive Sedan",
    passengers: "1–3 passengers",
    description:
      "Sleek luxury sedan (BMW 7 / Mercedes S-Class) with leather seating & climate control.",
    baseFareCents: 8500
  },
  {
    id: "luxury_suv",
    name: "Luxury SUV",
    passengers: "1–6 passengers",
    description: "Spacious Cadillac Escalade or Lincoln Navigator with generous luggage room.",
    baseFareCents: 14000
  },
  {
    id: "vip_sprinter",
    name: "VIP Executive Sprinter",
    passengers: "1–12 passengers",
    description:
      "Executive high-roof Mercedes Sprinter van for corporate delegations & VIP groups.",
    baseFareCents: 22000
  }
];

interface TransportationBookingProps {
  pickupLocation: string;
  onPickupChange: (val: string) => void;
  dropoffLocation: string;
  onDropoffChange: (val: string) => void;
  vehicleClass: string;
  onVehicleChange: (val: string) => void;
  passengers: number;
  onPassengersChange: (val: number) => void;
  payNow: boolean;
  onPayNowChange: (val: boolean) => void;
}

export function TransportationBooking({
  pickupLocation,
  onPickupChange,
  dropoffLocation,
  onDropoffChange,
  vehicleClass,
  onVehicleChange,
  passengers,
  onPassengersChange,
  payNow,
  onPayNowChange
}: TransportationBookingProps) {
  const selectedVehicle = VEHICLE_TIERS.find((v) => v.id === vehicleClass) || VEHICLE_TIERS[0]!;

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-slate-800">
        <Car className="size-5 text-sky-600" />
        <h4 className="text-sm font-semibold">Ride Route & Vehicle Details</h4>
        <span className="ml-auto text-xs font-medium text-slate-500">Uber-style Booking</span>
      </div>

      {/* Locations */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-700">
          Pickup Location *
          <div className="relative mt-1">
            <MapPin className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-emerald-600" />
            <input
              type="text"
              required
              value={pickupLocation}
              onChange={(e) => onPickupChange(e.target.value)}
              placeholder="e.g. JFK Terminal 4 or 350 5th Ave"
              className="klx-input pl-9 text-xs"
            />
          </div>
        </label>

        <label className="text-xs font-medium text-slate-700">
          Drop-off Location *
          <div className="relative mt-1">
            <Navigation className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sky-600" />
            <input
              type="text"
              required
              value={dropoffLocation}
              onChange={(e) => onDropoffChange(e.target.value)}
              placeholder="e.g. Midtown Manhattan Hotel or address"
              className="klx-input pl-9 text-xs"
            />
          </div>
        </label>
      </div>

      {/* Vehicle Tier Selection */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-700">Select Vehicle Tier *</label>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {VEHICLE_TIERS.map((tier) => {
            const isSelected = selectedVehicle.id === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => onVehicleChange(tier.id)}
                className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-sky-600 bg-white shadow-xs ring-2 ring-sky-500/20"
                    : "border-slate-200 bg-white/70 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900">{tier.name}</span>
                    {isSelected && (
                      <span className="flex size-4 items-center justify-center rounded-full bg-sky-600 text-white">
                        <Check className="size-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{tier.description}</p>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                  <span className="flex items-center gap-1 text-slate-500">
                    <Users className="size-3" />
                    {tier.passengers}
                  </span>
                  <span className="font-bold text-slate-900">
                    Est. ${(tier.baseFareCents / 100).toFixed(0)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Passenger count and Payment choice */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-700">
          Passenger Count
          <select
            value={passengers}
            onChange={(e) => onPassengersChange(Number(e.target.value))}
            className="klx-input mt-1 text-xs"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "passenger" : "passengers"}
              </option>
            ))}
          </select>
        </label>

        <div>
          <span className="block text-xs font-medium text-slate-700">Payment Option</span>
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => onPayNowChange(true)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                payNow
                  ? "border-sky-600 bg-sky-600 text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="size-3.5" />
              Pay Now (Stripe)
            </button>
            <button
              type="button"
              onClick={() => onPayNowChange(false)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                !payNow
                  ? "border-slate-800 bg-slate-800 text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Reserve First
            </button>
          </div>
        </div>
      </div>

      {/* Live Fare Summary */}
      <div className="flex items-center justify-between rounded-xl bg-sky-50/80 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-2 text-sky-900">
          <ShieldCheck className="size-4 text-sky-600" />
          <span>
            {payNow ? "Instant payment checkout via Stripe" : "Reserve with zero upfront charge"}
          </span>
        </div>
        <div className="text-right">
          <span className="mr-1.5 text-[11px] text-slate-500">Estimated Fare:</span>
          <span className="text-sm font-bold text-sky-950">
            ${(selectedVehicle.baseFareCents / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
