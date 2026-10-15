"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { Check, Copy, ExternalLink, Trash2 } from "lucide-react";

import { Button } from "@repo/ui";

import type { KlxMedia } from "@/server/db/types";

export function MediaGallery({
  refreshKey,
  onDeleted
}: {
  refreshKey: string;
  onDeleted?: () => void;
}) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<KlxMedia[]>([]);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/media?page=${page}`, { signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        return result;
      })
      .then((result) => {
        setItems(result.items);
        setMore(result.hasMore);
        setError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [page, refreshKey]);

  async function handleCopy(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore clipboard error
    }
  }

  async function handleDelete(item: KlxMedia) {
    if (
      !window.confirm(
        `Permanently delete "${item.originalName}"?\n\nThis will remove the file from server disk storage and delete its media record.`
      )
    ) {
      return;
    }

    setDeletingId(item.id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/media?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to delete media.");

      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setNotice(`Deleted "${item.originalName}" from server disk and database.`);
      onDeleted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete media.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">Uploaded media · page {page + 1}</h3>
        <span className="text-xs text-slate-500">
          Click &quot;Copy URL&quot; to use in advertisements or content
        </span>
      </div>

      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          {notice}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-xl bg-slate-50"
                title="Click to view full image in a new tab"
              >
                <Image
                  src={item.url}
                  alt={item.altText || item.originalName}
                  width={480}
                  height={240}
                  unoptimized
                  className="h-40 w-full rounded-xl object-contain transition-transform group-hover:scale-105"
                />
                <span className="absolute right-2 bottom-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Open full
                </span>
              </a>
              <p
                className="mt-3 truncate text-sm font-semibold text-slate-800"
                title={item.originalName}
              >
                {item.originalName}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {item.altText || "No alt text"} · {Math.ceil(item.size / 1024)} KB
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => handleCopy(item.url, item.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-sky-700"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="size-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3 text-slate-500" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline"
                >
                  <ExternalLink className="size-3" /> View
                </a>
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  title="Delete image file and database record"
                >
                  <Trash2 className="size-3" />
                  {deletingId === item.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!items.length && !error && (
        <p className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          No uploads on this page yet.
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          disabled={page === 0}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </Button>
        <Button variant="outline" disabled={!more} onClick={() => setPage((value) => value + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
