"use client";

import { useState } from "react";

import { Dialog } from "radix-ui";

import { Button } from "@repo/ui";

import { AdvertisementImage } from "./AdvertisementImage";

type Value = string | number | boolean | null | Value[] | { [key: string]: Value };
const label = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/Cents$/, " (USD)")
    .replace(/^./, (s) => s.toUpperCase());
function Fields({
  value,
  update,
  name = "",
  onUploadBusy
}: {
  value: Value;
  update: (value: Value) => void;
  name?: string;
  onUploadBusy: (busy: boolean) => void;
}) {
  if (name === "imageUrl")
    return (
      <AdvertisementImage value={String(value || "")} onChange={update} onBusy={onUploadBusy} />
    );
  if (name === "workingDays" && Array.isArray(value))
    return (
      <fieldset className="rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold">Available weekdays</legend>
        <div className="grid grid-cols-2 gap-3">
          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
            (day, i) => (
              <label key={day} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={value.includes(i)}
                  onChange={(e) =>
                    update(e.target.checked ? [...value, i].sort() : value.filter((v) => v !== i))
                  }
                />
                {day}
              </label>
            )
          )}
        </div>
      </fieldset>
    );
  if (name === "sectionOrder" && Array.isArray(value))
    return (
      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold">Section order</legend>
        {value.map((item, i) => (
          <div key={String(item)} className="flex items-center justify-between gap-4">
            <span className="text-sm capitalize">{String(item)}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={i <= 1}
                onClick={() => {
                  const copy = [...value];
                  [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
                  update(copy);
                }}
                aria-label={`Move ${item} up`}
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={i === 0 || i === value.length - 1}
                onClick={() => {
                  const copy = [...value];
                  [copy[i + 1], copy[i]] = [copy[i], copy[i + 1]];
                  update(copy);
                }}
                aria-label={`Move ${item} down`}
              >
                ↓
              </Button>
            </div>
          </div>
        ))}
      </fieldset>
    );
  if (Array.isArray(value))
    return (
      <fieldset className="space-y-4 rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold">{label(name)}</legend>
        {value.map((item, i) => (
          <div key={i} className="space-y-2">
            <Fields
              name={`${name} ${i + 1}`}
              onUploadBusy={onUploadBusy}
              value={item}
              update={(next) => update(value.map((v, n) => (n === i ? next : v)))}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update(value.filter((_, n) => n !== i))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            update([
              ...value,
              typeof value[0] === "object"
                ? { ...value[0] }
                : name === "faqs"
                  ? { question: "", answer: "" }
                  : name === "stats"
                    ? { label: "", value: "" }
                    : ""
            ])
          }
        >
          Add item
        </Button>
      </fieldset>
    );
  if (typeof value === "object" && value !== null)
    return (
      <div className="grid gap-5">
        {Object.entries(value)
          .filter(
            ([key]) =>
              ![
                "_id",
                "id",
                "requestId",
                "serviceId",
                "number",
                "ownerEmail",
                "createdAt",
                "updatedAt",
                "publishedAt",
                "token"
              ].includes(key)
          )
          .map(([key, item]) => (
            <Fields
              key={key}
              onUploadBusy={onUploadBusy}
              name={key}
              value={item}
              update={(next) => update({ ...value, [key]: next })}
            />
          ))}
      </div>
    );
  if (typeof value === "boolean")
    return (
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => update(e.target.checked)}
          className="size-4"
        />
        {label(name)}
      </label>
    );
  if (typeof value === "number")
    return (
      <label className="block text-sm font-medium">
        {label(name)}
        <input
          className="klx-input mt-2"
          type="number"
          step={name.endsWith("Cents") ? ".01" : "1"}
          value={name.endsWith("Cents") ? value / 100 : value}
          onChange={(e) =>
            update(
              name.endsWith("Cents")
                ? Math.round(Number(e.target.value) * 100)
                : Number(e.target.value)
            )
          }
        />
      </label>
    );
  const str = value === null ? "" : String(value);
  const options =
    name === "pricingMode"
      ? ["quote", "fixed", "deposit"]
      : name === "status"
        ? ["requested", "confirmed", "rescheduled", "cancelled", "declined", "completed"]
        : name === "placement"
          ? ["after_hero", "after_services"]
          : name.startsWith("sectionOrder")
            ? ["poolpay", "services", "about", "appointments", "faqs"]
            : null;
  if (options)
    return (
      <label className="block text-sm font-medium">
        {label(name)}
        <select className="klx-input mt-2" value={str} onChange={(e) => update(e.target.value)}>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  return (
    <label className="block text-sm font-medium">
      {label(name)}
      {str.length > 100 ||
      /description|story|answer|policy|privacy|terms|refund|cancellation|notes/i.test(name) ? (
        <textarea
          rows={4}
          className="klx-input mt-2"
          value={str}
          onChange={(e) => update(e.target.value)}
        />
      ) : (
        <input
          type={
            name.startsWith("blockedDates") ||
            (/Date$/.test(name) && name !== "endDate" && name !== "startDate")
              ? "date"
              : /Time$/.test(name) || name === "requestedTimeSlot"
                ? "time"
                : "text"
          }
          step={name === "requestedTimeSlot" ? 900 : undefined}
          className="klx-input mt-2"
          value={str}
          onChange={(e) => update(e.target.value)}
        />
      )}
    </label>
  );
}
export function Editor({
  title,
  initial,
  onSave,
  onClose
}: {
  title: string;
  initial: unknown;
  onSave: (data: unknown) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState<Value>(JSON.parse(JSON.stringify(initial)));
  const [opener] = useState(() =>
    typeof document !== "undefined" && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const changed = JSON.stringify(value) !== JSON.stringify(initial);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && (!changed || window.confirm("Discard unsaved changes?"))) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40" />
        <Dialog.Content
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener?.focus();
          }}
          aria-describedby="editor-description"
          className="fixed inset-3 z-50 overflow-y-auto sm:inset-8"
        >
          <form
            className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-2xl sm:p-9"
            onSubmit={async (e) => {
              e.preventDefault();
              if (uploading) return;
              setBusy(true);
              setError("");
              try {
                await onSave(value);
                onClose();
              } catch (error) {
                setError(error instanceof Error ? error.message : "Could not save.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <Dialog.Title className="text-2xl font-semibold tracking-tight">{title}</Dialog.Title>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!changed || window.confirm("Discard unsaved changes?")) onClose();
                }}
              >
                Close
              </Button>
            </div>
            <p id="editor-description" className="sr-only">
              Update the fields below, then save your changes.
            </p>
            <fieldset disabled={uploading || busy}>
              <Fields value={value} update={setValue} onUploadBusy={setUploading} />
            </fieldset>
            {error && (
              <p role="alert" className="mt-6 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="sticky bottom-0 mt-8 flex items-center justify-between border-t border-slate-100 bg-white py-5">
              <span className="text-xs text-slate-500">
                {changed ? "Unsaved changes" : "No changes yet"}
              </span>
              <Button type="submit" disabled={busy || uploading}>
                {busy ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
