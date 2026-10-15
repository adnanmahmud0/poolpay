"use client";

import { useState } from "react";
import Image from "next/image";

export function AdvertisementImage({
  value,
  onChange,
  onBusy
}: {
  value: string;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <fieldset className="rounded-2xl border border-slate-200 p-5">
      <legend className="px-2 text-sm font-medium">Advertisement image</legend>
      {value && (
        <Image
          src={value}
          alt="Current advertisement preview"
          width={640}
          height={300}
          unoptimized
          className="mb-4 max-h-56 w-full rounded-xl bg-slate-50 object-contain"
        />
      )}
      <label className="block text-sm font-medium">
        {value ? "Upload replacement image" : "Upload image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className="klx-input mt-2"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setError("");
            if (
              file.size > 5 * 1024 * 1024 ||
              !["image/jpeg", "image/png", "image/webp"].includes(file.type)
            ) {
              setError("Choose a JPEG, PNG or WebP image smaller than 5 MB.");
              return;
            }
            setBusy(true);
            onBusy(true);
            try {
              const form = new FormData();
              form.set("file", file);
              const response = await fetch("/api/admin/media", { method: "POST", body: form });
              const result = await response.json();
              if (!response.ok) throw new Error(result.error || "Image upload failed.");
              onChange(result.url);
            } catch (problem) {
              setError(
                problem instanceof Error
                  ? problem.message
                  : "Image upload failed. Please try again."
              );
            } finally {
              setBusy(false);
              onBusy(false);
            }
          }}
        />
      </label>
      <p role="status" className="mt-3 text-xs text-slate-500">
        {busy
          ? "Uploading image…"
          : "JPEG, PNG or WebP · maximum 5 MB. Save changes to apply the image to this advertisement."}
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
