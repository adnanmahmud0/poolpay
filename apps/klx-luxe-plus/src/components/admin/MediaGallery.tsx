"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { Button } from "@repo/ui";

import type { KlxMedia } from "@/server/db/types";

export function MediaGallery({ refreshKey }: { refreshKey: string }) {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<KlxMedia[]>([]);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
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
  return (
    <div className="mb-8">
      <h3 className="mb-4 font-semibold">Uploaded media · page {page + 1}</h3>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <Image
              src={item.url}
              alt={item.altText || item.originalName}
              width={480}
              height={240}
              unoptimized
              className="h-40 w-full rounded-xl bg-slate-50 object-contain"
            />
            <p className="mt-3 truncate text-sm font-medium">{item.originalName}</p>
            <p className="mt-2 text-xs text-slate-500">
              {item.altText || "No description"} · {Math.ceil(item.size / 1024)} KB
            </p>
          </a>
        ))}
      </div>
      {!items.length && !error && (
        <p className="text-sm text-slate-500">No uploads on this page yet.</p>
      )}
      <div className="mt-4 flex gap-3">
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
