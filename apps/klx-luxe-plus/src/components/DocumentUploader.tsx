"use client";

import { useRef, useState } from "react";

import {
  AlertCircle,
  FileCheck2,
  FileText,
  Loader2,
  Paperclip,
  UploadCloud,
  X
} from "lucide-react";

import type { AttachedDocument } from "@/server/db/types";

interface DocumentUploaderProps {
  documents: AttachedDocument[];
  onChange: (docs: AttachedDocument[]) => void;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function DocumentUploader({ documents, onChange }: DocumentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    if (!files.length) return;
    setError("");
    setUploading(true);

    const uploadedList: AttachedDocument[] = [...documents];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`"${file.name}" is too large (max 10 MB).`);
        }

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/appointments/upload", {
          method: "POST",
          body: formData
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        if (data.document) {
          uploadedList.push(data.document);
        }
      }

      onChange(uploadedList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file(s).");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  function removeDocument(id: string) {
    onChange(documents.filter((doc) => doc.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          Attach documents to translate{" "}
          <span className="text-xs font-normal text-slate-500">
            (Birth certificates, marriage licenses, diplomas, etc.)
          </span>
        </label>
        {documents.length > 0 && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {documents.length} attached
          </span>
        )}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
          isDragging
            ? "scale-[0.99] border-sky-500 bg-sky-50/70"
            : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
          }}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2 text-sky-700">
            <Loader2 className="size-7 animate-spin" />
            <p className="text-xs font-medium">Uploading and encrypting document(s)...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-white p-3 text-sky-600 shadow-sm">
              <UploadCloud className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">
                Click to browse or drag and drop documents
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                PDF, JPG, PNG, WEBP, or DOCX (up to 10 MB each)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {documents.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-xs">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 p-3 text-xs text-slate-700"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FileCheck2 className="size-4 shrink-0 text-emerald-600" />
                <span className="truncate font-medium text-slate-800">{doc.name}</span>
                <span className="shrink-0 text-[11px] text-slate-400">
                  ({formatBytes(doc.size)})
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeDocument(doc.id);
                }}
                className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-600"
                title="Remove attachment"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
