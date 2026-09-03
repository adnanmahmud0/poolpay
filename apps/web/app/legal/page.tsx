"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Lock,
  Cookie,
  Trash2,
  MessageSquare,
  Printer,
  Calendar,
  Share2,
  ChevronRight,
  CheckCircle2,
  Mail,
  Phone,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { getLegalPolicies, getLegalPolicy } from "@/lib/api-auth";
import { toast } from "sonner";

interface PolicyItem {
  slug: string;
  title: string;
  summary?: string;
  content: string;
  version?: string;
  isPublished: boolean;
  updatedAt?: string;
}

const POLICY_ITEMS = [
  { slug: "privacy-policy", label: "Privacy Policy", icon: Lock },
  { slug: "terms-and-conditions", label: "Terms & Conditions", icon: FileText },
  { slug: "cookie-policy", label: "Cookie Policy", icon: Cookie },
  { slug: "data-deletion", label: "Data Deletion", icon: Trash2 },
  { slug: "sms-consent", label: "SMS Consent", icon: MessageSquare },
];

function LegalViewerContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "privacy-policy";

  const [activeSlug, setActiveSlug] = useState<string>(initialTab);
  const [policies, setPolicies] = useState<Record<string, PolicyItem>>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && POLICY_ITEMS.some((p) => p.slug === tab)) {
      setActiveSlug(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await getLegalPolicies();
        if (res.success && Array.isArray(res.data)) {
          const map: Record<string, PolicyItem> = {};
          res.data.forEach((item: PolicyItem) => {
            map[item.slug] = item;
          });
          setPolicies(map);
        }
      } catch (err) {
        console.error("Failed to load legal policies:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentPolicy = policies[activeSlug];

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${currentPolicy?.title || "Legal Document"} - PoolPay`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-[#1A227F] text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
                P
              </div>
              <span className="font-bold text-xl tracking-tight text-[#1A227F]">POOLPAY</span>
            </Link>
            <span className="text-gray-300 mx-2">/</span>
            <span className="text-sm font-medium text-gray-600">Legal & Compliance Hub</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              title="Share Document"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Nav (Desktop & Mobile) */}
          <div className="lg:col-span-3 space-y-4 print:hidden">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm sticky top-24">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3 pb-2">
                Legal Documents
              </h2>
              <nav className="space-y-1">
                {POLICY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSlug === item.slug;
                  return (
                    <button
                      key={item.slug}
                      onClick={() => setActiveSlug(item.slug)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? "bg-[#1A227F] text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4 text-white/70" />}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-2 px-3">
                <p className="font-semibold text-gray-700">Need legal assistance?</p>
                <p className="text-gray-500">Contact our compliance team anytime:</p>
                <div className="space-y-1 pt-1">
                  <a
                    href="mailto:support@poolpay.space"
                    className="flex items-center gap-1.5 text-indigo-600 hover:underline"
                  >
                    <Mail className="w-3 h-3" />
                    support@poolpay.space
                  </a>
                  <a
                    href="tel:+16079004569"
                    className="flex items-center gap-1.5 text-gray-600 hover:underline"
                  >
                    <Phone className="w-3 h-3" />
                    +1 (607) 900-4569
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Document Content View */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-12 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-[#1A227F] animate-spin mb-3" />
                <p className="text-gray-500 text-sm">Loading document...</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200/80 p-8 sm:p-12 shadow-sm">
                {/* Header Banner */}
                <div className="border-b border-gray-200 pb-6 mb-8">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">
                    <span>PoolPay Legal Terms</span>
                    <span>•</span>
                    <span>Version {currentPolicy?.version || "1.0.0"}</span>
                  </div>

                  <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                    {currentPolicy?.title || POLICY_ITEMS.find((p) => p.slug === activeSlug)?.label}
                  </h1>

                  {currentPolicy?.summary && (
                    <p className="mt-3 text-base text-gray-600 leading-relaxed max-w-3xl">
                      {currentPolicy.summary}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      Last Updated:{" "}
                      {currentPolicy?.updatedAt
                        ? new Date(currentPolicy.updatedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "March 2026"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active & Effective
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <article className="prose prose-indigo max-w-none text-gray-800 leading-relaxed font-sans space-y-6">
                  {currentPolicy?.content ? (
                    currentPolicy.content.split("\n\n").map((block, idx) => {
                      if (block.startsWith("## ")) {
                        return (
                          <h2
                            key={idx}
                            className="text-xl sm:text-2xl font-bold text-gray-900 pt-6 pb-1 border-b border-gray-100"
                          >
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
                    <p className="text-gray-400 italic">No content available for this document.</p>
                  )}
                </article>

                {/* Footer Acknowledgement */}
                <div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p>© {new Date().getFullYear()} PoolPay. All rights reserved.</p>
                  <p className="text-gray-400">
                    Authorized document governed by PoolPay Platform Terms.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LegalHubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#1A227F] animate-spin" />
        </div>
      }
    >
      <LegalViewerContent />
    </Suspense>
  );
}
