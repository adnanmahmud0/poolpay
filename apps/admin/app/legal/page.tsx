"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Cookie,
  FileText,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Printer,
  Share2,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { toast } from "sonner";

import { getLegalPolicies, getLegalPolicy } from "@/lib/api-auth";

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
  { slug: "sms-consent", label: "SMS Consent", icon: MessageSquare }
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
          url: window.location.href
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1A227F] text-lg font-bold text-white shadow-sm">
                P
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1A227F]">POOLPAY</span>
            </Link>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-600">Legal & Compliance Hub</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              title="Share Document"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Sidebar Nav (Desktop & Mobile) */}
          <div className="space-y-4 lg:col-span-3 print:hidden">
            <div className="sticky top-24 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm">
              <h2 className="px-3 pb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
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
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-[#1A227F] text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4 text-white/70" />}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 space-y-2 border-t border-gray-100 px-3 pt-4 text-xs text-gray-500">
                <p className="font-semibold text-gray-700">Need legal assistance?</p>
                <p className="text-gray-500">Contact our compliance team anytime:</p>
                <div className="space-y-1 pt-1">
                  <a
                    href="mailto:support@poolpay.space"
                    className="flex items-center gap-1.5 text-indigo-600 hover:underline"
                  >
                    <Mail className="h-3 w-3" />
                    support@poolpay.space
                  </a>
                  <a
                    href="tel:+16079004569"
                    className="flex items-center gap-1.5 text-gray-600 hover:underline"
                  >
                    <Phone className="h-3 w-3" />
                    +1 (607) 900-4569
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Document Content View */}
          <div className="lg:col-span-9">
            {loading ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-200/80 bg-white p-12">
                <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#1A227F]" />
                <p className="text-sm text-gray-500">Loading document...</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm sm:p-12">
                {/* Header Banner */}
                <div className="mb-8 border-b border-gray-200 pb-6">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider text-indigo-600 uppercase">
                    <span>PoolPay Legal Terms</span>
                    <span>•</span>
                    <span>Version {currentPolicy?.version || "1.0.0"}</span>
                  </div>

                  <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                    {currentPolicy?.title || POLICY_ITEMS.find((p) => p.slug === activeSlug)?.label}
                  </h1>

                  {currentPolicy?.summary && (
                    <p className="mt-3 max-w-3xl text-base leading-relaxed text-gray-600">
                      {currentPolicy.summary}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      Last Updated:{" "}
                      {currentPolicy?.updatedAt
                        ? new Date(currentPolicy.updatedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })
                        : "March 2026"}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active & Effective
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <article className="prose prose-indigo max-w-none space-y-6 font-sans leading-relaxed text-gray-800">
                  {currentPolicy?.content ? (
                    currentPolicy.content.split("\n\n").map((block, idx) => {
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
                    <p className="text-gray-400 italic">No content available for this document.</p>
                  )}
                </article>

                {/* Footer Acknowledgement */}
                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-8 text-xs text-gray-500 sm:flex-row">
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
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A227F]" />
        </div>
      }
    >
      <LegalViewerContent />
    </Suspense>
  );
}
