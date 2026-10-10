"use client";

import React, { useEffect, useState, useTransition } from "react";

import {
  Bold,
  CheckCircle2,
  Clock,
  Cookie,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Heading2,
  Link2,
  List,
  Loader2,
  Lock,
  MessageSquare,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  User
} from "lucide-react";
import { toast } from "sonner";

import { getLegalPolicies, LegalPolicyPayload, updateLegalPolicy } from "@/lib/api-auth";

interface PolicyItem {
  _id?: string;
  slug: string;
  title: string;
  summary?: string;
  content: string;
  version?: string;
  isPublished: boolean;
  updatedBy?: {
    fullName?: string;
    email?: string;
  };
  updatedAt?: string;
}

const POLICY_TABS = [
  { slug: "privacy-policy", label: "Privacy Policy", icon: Lock, publicUrl: "/privacy-policy" },
  {
    slug: "terms-and-conditions",
    label: "Terms & Conditions",
    icon: FileText,
    publicUrl: "/terms-and-conditions"
  },
  { slug: "cookie-policy", label: "Cookie Policy", icon: Cookie, publicUrl: "/cookie-policy" },
  {
    slug: "data-deletion",
    label: "Data Deletion",
    icon: Trash2,
    publicUrl: "/legal?tab=data-deletion"
  },
  {
    slug: "sms-consent",
    label: "SMS Consent",
    icon: MessageSquare,
    publicUrl: "/legal?tab=sms-consent"
  }
];

export default function LegalManagementPage() {
  const [policies, setPolicies] = useState<Record<string, PolicyItem>>({});
  const [activeSlug, setActiveSlug] = useState<string>("privacy-policy");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Active policy draft state
  const [title, setTitle] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [version, setVersion] = useState<string>("1.0.0");
  const [isPublished, setIsPublished] = useState<boolean>(true);

  // Fetch policies on mount
  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await getLegalPolicies();
      if (res.success && Array.isArray(res.data)) {
        const mapped: Record<string, PolicyItem> = {};
        res.data.forEach((p: PolicyItem) => {
          mapped[p.slug] = p;
        });
        setPolicies(mapped);

        // Populate active policy draft
        const current = mapped[activeSlug];
        if (current) {
          populateForm(current);
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Failed to load legal policies: " + (error?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (policy: PolicyItem) => {
    setTitle(policy.title || "");
    setSummary(policy.summary || "");
    setContent(policy.content || "");
    setVersion(policy.version || "1.0.0");
    setIsPublished(policy.isPublished ?? true);
  };

  const handleTabChange = (slug: string) => {
    setActiveSlug(slug);
    const selected = policies[slug];
    if (selected) {
      populateForm(selected);
    } else {
      // Default empty if newly clicked before reload
      setTitle(POLICY_TABS.find((t) => t.slug === slug)?.label || "");
      setSummary("");
      setContent("");
      setVersion("1.0.0");
      setIsPublished(true);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Document Title is required.");
      return;
    }
    if (!content.trim()) {
      toast.error("Document Content cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      const payload: LegalPolicyPayload = {
        title,
        summary,
        content,
        version,
        isPublished
      };

      const res = await updateLegalPolicy(activeSlug, payload);
      if (res.success && res.data) {
        toast.success(`"${title}" saved successfully!`);
        // Update local state
        setPolicies((prev) => ({
          ...prev,
          [activeSlug]: res.data
        }));
      } else {
        toast.error("Failed to save policy.");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Save error: " + (error?.message || "Internal server error"));
    } finally {
      setSaving(false);
    }
  };

  // Helper to insert formatting tags into the content textarea
  const insertFormatting = (prefix: string, suffix = "") => {
    const textarea = document.getElementById("legal-content-editor") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const replacement = prefix + (selectedText || "text") + suffix;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText || "text").length
      );
    }, 50);
  };

  const activeTabMeta = POLICY_TABS.find((t) => t.slug === activeSlug);
  const activePolicyData = policies[activeSlug];

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-xl bg-indigo-50 p-2.5 text-[#1A227F]">
              <ShieldCheck className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                Legal & Policies Management
              </h1>
              <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">
                Update compliance documents, user agreements, and privacy terms shown on mobile and
                web.
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <a
            href="/legal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 sm:w-auto sm:text-sm"
          >
            <ExternalLink className="h-4 w-4 text-gray-500" />
            <span>Public Legal Hub</span>
          </a>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-gray-200 pb-2">
        {POLICY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSlug === tab.slug;
          const policyItem = policies[tab.slug];
          const isLive = policyItem ? policyItem.isPublished : true;

          return (
            <button
              key={tab.slug}
              onClick={() => handleTabChange(tab.slug)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium transition sm:px-4 sm:py-3 sm:text-sm ${
                isActive
                  ? "bg-[#1A227F] text-white shadow-md shadow-indigo-900/10"
                  : "border border-gray-100 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-gray-400"}`} />
              <span>{tab.label}</span>
              <span
                className={`h-2 w-2 rounded-full ${
                  isLive ? (isActive ? "bg-emerald-300" : "bg-emerald-500") : "bg-amber-400"
                }`}
                title={isLive ? "Published" : "Draft"}
              />
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-20">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-[#1A227F]" />
          <p className="text-sm text-gray-500">Loading legal documents...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Document Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/70 px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 sm:gap-4">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <FileText className="h-3.5 w-3.5 text-gray-400" />
                Slug:{" "}
                <code className="rounded border border-gray-200 bg-white px-2 py-0.5 text-gray-800">
                  {activeSlug}
                </code>
              </span>

              {activePolicyData?.updatedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  Last Updated: {new Date(activePolicyData.updatedAt).toLocaleDateString()} at{" "}
                  {new Date(activePolicyData.updatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              )}

              {activePolicyData?.updatedBy?.fullName && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  By: {activePolicyData.updatedBy.fullName}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {activeTabMeta?.publicUrl && (
                <a
                  href={activeTabMeta.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 transition hover:text-indigo-800"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Public Page
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6 p-4 sm:p-6">
            {/* Top row: Title, Version, and Published switch */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-12">
              <div className="space-y-1.5 md:col-span-7">
                <label className="block text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Privacy Policy"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-[#1A227F] focus:ring-2 focus:ring-[#1A227F]/20 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-[#1A227F] focus:ring-2 focus:ring-[#1A227F]/20 focus:outline-none"
                />
              </div>

              <div className="flex flex-col justify-center space-y-1.5 md:col-span-3">
                <label className="block text-xs font-semibold tracking-wider text-gray-600 uppercase">
                  Publication Status
                </label>
                <label className="flex cursor-pointer items-center gap-3 py-1">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="peer relative h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-emerald-500 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                  <span
                    className={`text-sm font-medium ${isPublished ? "text-emerald-700" : "text-amber-600"}`}
                  >
                    {isPublished ? "Publicly Visible" : "Hidden (Draft)"}
                  </span>
                </label>
              </div>
            </div>

            {/* Summary description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold tracking-wider text-gray-600 uppercase">
                Short Summary (Displayed at the top of the public document)
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary explaining what this policy covers..."
                className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 transition focus:border-[#1A227F] focus:ring-2 focus:ring-[#1A227F]/20 focus:outline-none"
              />
            </div>

            {/* Content Editor with Toolbar & Preview Toggle */}
            <div className="space-y-2">
              <div className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      !previewMode
                        ? "bg-white text-[#1A227F] shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(true)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      previewMode
                        ? "bg-white text-[#1A227F] shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Live Preview
                  </button>
                </div>

                {!previewMode && (
                  <div className="flex flex-wrap items-center gap-1 text-gray-600">
                    <button
                      type="button"
                      onClick={() => insertFormatting("## ")}
                      className="rounded-lg p-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                      title="Add Section Heading"
                    >
                      <Heading2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("**", "**")}
                      className="rounded-lg p-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                      title="Bold Text"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("- ")}
                      className="rounded-lg p-1.5 text-xs text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                      title="Bullet List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("[Link Title](", ")")}
                      className="rounded-lg p-1.5 text-xs text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
                      title="Insert Link"
                    >
                      <Link2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {previewMode ? (
                /* Live Preview Area */
                <div className="prose prose-indigo max-h-[600px] min-h-[360px] max-w-none overflow-y-auto rounded-xl border border-gray-200/80 bg-gray-50/60 p-4 text-gray-800 sm:min-h-[420px] sm:p-6">
                  <div className="mb-6 border-b border-gray-200 pb-4">
                    <h2 className="m-0 text-xl font-bold text-gray-900 sm:text-2xl">
                      {title || "Untitled Document"}
                    </h2>
                    {summary && <p className="mt-1 text-xs text-gray-500 sm:text-sm">{summary}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span>Version {version}</span>
                      <span>•</span>
                      <span>Last Updated: Today</span>
                    </div>
                  </div>

                  <div className="space-y-4 font-sans text-xs leading-relaxed whitespace-pre-wrap sm:text-sm">
                    {content ? (
                      content.split("\n\n").map((block, idx) => {
                        if (block.startsWith("## ")) {
                          return (
                            <h3
                              key={idx}
                              className="border-t border-gray-100 pt-3 text-base font-bold text-gray-900 sm:text-lg"
                            >
                              {block.replace("## ", "")}
                            </h3>
                          );
                        }
                        if (block.startsWith("### ")) {
                          return (
                            <h4
                              key={idx}
                              className="pt-2 text-sm font-semibold text-gray-800 sm:text-base"
                            >
                              {block.replace("### ", "")}
                            </h4>
                          );
                        }
                        if (block.startsWith("- ") || block.startsWith("* ")) {
                          const items = block.split("\n").filter((line) => line.trim());
                          return (
                            <ul key={idx} className="list-disc space-y-1.5 pl-5 text-gray-700">
                              {items.map((item, i) => (
                                <li key={i}>{item.replace(/^[-*]\s*/, "")}</li>
                              ))}
                            </ul>
                          );
                        }
                        return (
                          <p key={idx} className="text-gray-700">
                            {block}
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-gray-400 italic">No content to preview.</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Markdown / Text Editor */
                <textarea
                  id="legal-content-editor"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  placeholder="Enter policy content using Markdown formatting (## Headings, - Bullet lists, **bold**, etc.)..."
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-3 font-mono text-xs leading-relaxed text-gray-800 transition focus:border-[#1A227F] focus:ring-2 focus:ring-[#1A227F]/20 focus:outline-none sm:px-4 sm:text-sm"
                />
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col-reverse justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={fetchPolicies}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-medium text-gray-500 transition hover:bg-gray-50 hover:text-gray-700 sm:w-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Discard & Reset
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1A227F] px-6 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-[#151c68] disabled:opacity-50 sm:w-auto sm:text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save {activeTabMeta?.label || "Policy"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
