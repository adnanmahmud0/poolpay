"use client";

import { useState } from "react";

import { Button } from "@repo/ui";

import type { KlxAppointment } from "@/server/db/types";

export function AppointmentCalendar({
  appointments,
  onSelect
}: {
  appointments: KlxAppointment[];
  onSelect: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return (
    <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-5 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          ←
        </Button>
        <h3 className="text-sm font-semibold">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <Button
          variant="outline"
          size="sm"
          aria-label="Next month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          →
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span className="py-2 text-center text-[10px] text-slate-500" key={day}>
            {day}
          </span>
        ))}
        {Array.from({ length: month.getDay() }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const date = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
          const count = appointments.filter((a) => a.requestedDate === date).length;
          return (
            <button
              key={date}
              aria-label={`${date}, ${count} appointments`}
              className={`min-h-12 rounded-lg border p-2 text-xs hover:border-sky-400 ${count ? "border-sky-200 bg-sky-50 text-sky-800" : "border-slate-100"}`}
              onClick={() => onSelect(date)}
            >
              {i + 1}
              {count > 0 && (
                <span className="mt-1 block text-[9px]">
                  {count} request{count !== 1 ? "s" : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
