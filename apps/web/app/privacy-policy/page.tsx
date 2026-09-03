"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, Printer, Share2, Calendar, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { getLegalPolicy } from "@/lib/api-auth";
import { toast } from "sonner";

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
      navigator.share({ title: "Privacy Policy - PoolPay", url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/legal" className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Legal Hub</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-bold text-[#1A227F]">POOLPAY</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-[#1A227F] animate-spin mb-3" />
            <p className="text-gray-500 text-sm">Loading Privacy Policy...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 shadow-sm">
            <div className="border-b border-gray-200 pb-6 mb-8">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Privacy & Data Protection</span>
                <span>•</span>
                <span>Version {policy?.version || "1.0.0"}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                {policy?.title || "Privacy Policy"}
              </h1>

              {policy?.summary && (
                <p className="mt-3 text-base text-gray-600 leading-relaxed">
                  {policy.summary}
                </p>
              )}

              <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Last Updated:{" "}
                  {policy?.updatedAt
                    ? new Date(policy.updatedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "March 2026"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Policy
                </span>
              </div>
            </div>

            <article className="prose prose-indigo max-w-none text-gray-800 leading-relaxed font-sans space-y-6">
              {policy?.content ? (
                policy.content.split("\n\n").map((block, idx) => {
                  if (block.startsWith("## ")) {
                    return (
                      <h2 key={idx} className="text-xl sm:text-2xl font-bold text-gray-900 pt-6 pb-1 border-b border-gray-100">
                        {block.replace("## ", "")}
                      </h2>
                    );
                  }
                  if (block.startsWith("### ")) {
                    return (
                      <h3 key={idx} className="text-lg font-semibold text-gray-800 pt-3">
                        {block.replace("### ", "")}
                      </h3>
                    );
                  }
                  if (block.startsWith("- ") || block.startsWith("* ")) {
                    const items = block.split("\n").filter((line) => line.trim());
                    return (
                      <ul key={idx} className="list-disc pl-5 space-y-2 text-gray-700">
                        {items.map((item, i) => (
                          <li key={i}>{item.replace(/^[-*]\s*/, "")}</li>
                        ))}
                      </ul>
                    );
                  }
                  return (
                    <p key={idx} className="text-gray-700 whitespace-pre-wrap">
                      {block}
                    </p>
                  );
                })
              ) : (
                <p className="text-gray-400 italic">No content available.</p>
              )}
            </article>

            <div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
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
