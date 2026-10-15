"use client";

import { useEffect, useState } from "react";

import { Clock3 } from "lucide-react";

export const timeLabel = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
};
export function AppointmentTimes({ date, serviceId }: { date: string; serviceId: string }) {
  const [state, setState] = useState<{
    key: string;
    slots: string[];
    error: string;
    duration: number;
  }>({ key: "", slots: [], error: "", duration: 0 });
  const key = `${date}:${serviceId}`;
  useEffect(() => {
    if (!date || !serviceId) return;
    const controller = new AbortController();
    fetch(
      `/api/appointments/availability?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
      })
      .then((data) =>
        setState({ key, slots: data.slots, error: "", duration: data.durationMinutes })
      )
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({
            key,
            slots: [],
            error: error.message || "Could not load availability.",
            duration: 0
          });
      });
    return () => controller.abort();
  }, [date, serviceId, key]);
  const ready = state.key === key && !!date;
  return (
    <label className="block">
      <span className="flex items-center gap-2">
        <Clock3 size={17} aria-hidden="true" /> Preferred time (AM/PM)
      </span>
      <select
        key={key}
        name="requestedTimeSlot"
        required
        defaultValue=""
        className="klx-input mt-2"
      >
        <option value="">
          {!date
            ? "Choose a date first"
            : !ready
              ? "Checking availability…"
              : state.slots.length
                ? "Select an available time"
                : "No available times"}
        </option>
        {ready &&
          state.slots.map((time) => (
            <option value={time} key={time}>
              {timeLabel(time)}
            </option>
          ))}
      </select>
      <span className="mt-2 block text-xs text-slate-500" role="status">
        {state.error ||
          (ready && state.duration
            ? `${state.duration}-minute appointment. Booked times and off days are excluded.`
            : "")}
      </span>
    </label>
  );
}
