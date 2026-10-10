"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

import { ArrowLeft, Calendar, CheckCircle2, Loader2, Lock, Printer, Share2 } from "lucide-react";
import { toast } from "sonner";

import { getLegalPolicy } from "@/lib/api-auth";

interface PolicyData {
  title: string;
  summary?: string;
  content: string;
  version?: string;
  updatedAt?: string;
}

export default function PrivacyPolicyPage() {
  const [policy, setPolicy] = useState<PolicyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getLegalPolicy("privacy-policy");
        if (res.success && res.data) {
          setPolicy(res.data);
        }
      } catch (err) {
        console.error("Failed to load privacy policy:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handlePrint = () => window.print();

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({ title: "Privacy Policy - PoolPay", url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/legal"
              className="flex items-center gap-1 text-xs text-gray-500 transition hover:text-gray-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Legal Hub</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-bold text-[#1A227F]">POOLPAY</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              title="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#1A227F]" />
            <p className="text-sm text-gray-500">Loading Privacy Policy...</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
            <div className="mb-8 border-b border-gray-200 pb-6">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-600 uppercase">
                <Lock className="h-3.5 w-3.5" />
                <span>Privacy & Data Protection</span>
                <span>•</span>
                <span>Version {policy?.version || "1.0.0"}</span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                {policy?.title || "Privacy Policy"}
              </h1>

              {policy?.summary && (
                <p className="mt-3 text-base leading-relaxed text-gray-600">{policy.summary}</p>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  Last Updated:{" "}
                  {policy?.updatedAt
                    ? new Date(policy.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })
                    : "March 2026"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Active Policy
                </span>
              </div>
            </div>

            <article className="prose prose-indigo max-w-none space-y-6 font-sans leading-relaxed text-gray-800">
              {policy?.content ? (
                policy.content.split("\n\n").map((block, idx) => {
                  if (block.startsWith("## ")) {
                    return (
                      <h2
                        key={idx}
                        className="border-b border-gray-100 pt-6 pb-1 text-xl font-bold text-gray-900 sm:text-2xl"
                      >
                        {block.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (block.startsWith("### ")) {
                    return (
                      <h3 key={idx} className="pt-3 text-lg font-semibold text-gray-800">
                        {block.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (block.startsWith("- ") || block.startsWith("* ")) {
                    const items = block.split("\n").filter((line) => line.trim());
                    return (
                      <ul key={idx} className="list-disc space-y-2 pl-5 text-gray-700">
                        {items.map((item, i) => (
                          <li key={i}>{item.replace(/^[-*]\s*/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={idx} className="whitespace-pre-wrap text-gray-700">
                      {block}
                    </p>
                  );
                })
              ) : (
                <p className="text-gray-400 italic">No content available.</p>
              )}
            </article>

            <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-gray-500 sm:flex-row">
              <p>© {new Date().getFullYear()} PoolPay. All rights reserved.</p>
              <Link href="/legal" className="text-indigo-600 hover:underline">
                View All Legal Documents
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
