"use client";

import { useState } from "react";
import Image from "next/image";

import { AlertCircle, CheckCircle2, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

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
  const [imageFailed, setImageFailed] = useState(false);

  const PRESETS = [
    { label: "KLX Brand Card", url: "/images/klx-social-card.png" },
    { label: "PoolPay Logo", url: "/images/poolpay/logo.png" },
    { label: "PoolPay App View", url: "/images/poolpay/groups.webp" }
  ];

  const isValidUrl =
    Boolean(value) &&
    (value.startsWith("/") || /^https?:\/\//i.test(value)) &&
    !value.startsWith("//");

  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
      <legend className="px-2 text-sm font-semibold text-slate-800">
        Advertisement Banner Image
      </legend>

      {/* Live Preview */}
      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {value && !imageFailed ? (
          <div className="relative aspect-[3/1] max-h-56 w-full bg-slate-900/5">
            <Image
              src={value}
              alt="Advertisement banner preview"
              fill
              unoptimized
              className="object-contain"
              onError={() => setImageFailed(true)}
              onLoad={() => setImageFailed(false)}
            />
          </div>
        ) : (
          <div className="flex aspect-[3/1] max-h-40 w-full flex-col items-center justify-center gap-2 bg-slate-100 p-6 text-slate-400">
            {imageFailed ? (
              <>
                <AlertCircle className="size-8 text-amber-500" />
                <p className="text-xs font-medium text-amber-600">Image failed to load from URL</p>
                <p className="text-[11px] text-slate-400">
                  Check the URL or choose a valid preset / upload a file
                </p>
              </>
            ) : (
              <>
                <ImageIcon className="size-8 text-slate-300" />
                <p className="text-xs text-slate-500">No image specified</p>
              </>
            )}
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 truncate">
            {isValidUrl ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="size-3.5 shrink-0 text-amber-600" />
            )}
            <span className="truncate">{value || "None selected"}</span>
          </span>
          <span className="shrink-0 text-[11px] text-slate-400">Recommended 1200×400</span>
        </div>
      </div>

      {/* Direct URL input */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-slate-700">
          Image URL or local path
          <div className="relative mt-1">
            <LinkIcon className="pointer-events-none absolute top-2.5 left-3 size-4 text-slate-400" />
            <input
              type="text"
              className="klx-input pl-9 text-xs"
              placeholder="e.g. /images/klx-social-card.png or https://..."
              value={value}
              onChange={(e) => {
                setImageFailed(false);
                setError("");
                onChange(e.target.value);
              }}
            />
          </div>
        </label>
      </div>

      {/* Quick Presets */}
      <div className="mb-4">
        <span className="text-[11px] font-medium text-slate-500">Quick verified presets:</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.url}
              type="button"
              className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                value === p.url
                  ? "border-sky-500 bg-sky-50 font-medium text-sky-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
              onClick={() => {
                setImageFailed(false);
                setError("");
                onChange(p.url);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <label className="block text-xs font-semibold text-slate-700">
        Or upload image file from computer
        <div className="mt-1 flex items-center gap-2">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            className="klx-input file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:font-medium hover:file:bg-slate-200"
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
                setImageFailed(false);
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
        </div>
      </label>

      {busy && (
        <p role="status" className="mt-2 text-xs font-medium text-sky-600">
          Uploading image to media library…
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
