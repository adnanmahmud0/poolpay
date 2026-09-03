"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  ShieldCheck,
  FileText,
  Lock,
  Cookie,
  Trash2,
  MessageSquare,
  ExternalLink,
  Save,
  Loader2,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
  Bold,
  Heading2,
  List,
  Link2,
  RotateCcw
} from "lucide-react";
import { getLegalPolicies, updateLegalPolicy, LegalPolicyPayload } from "@/lib/api-auth";
import { toast } from "sonner";

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
  { slug: "terms-and-conditions", label: "Terms & Conditions", icon: FileText, publicUrl: "/terms-and-conditions" },
  { slug: "cookie-policy", label: "Cookie Policy", icon: Cookie, publicUrl: "/cookie-policy" },
  { slug: "data-deletion", label: "Data Deletion", icon: Trash2, publicUrl: "/legal?tab=data-deletion" },
  { slug: "sms-consent", label: "SMS Consent", icon: MessageSquare, publicUrl: "/legal?tab=sms-consent" },
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
      setTitle(POLICY_TABS.find(t => t.slug === slug)?.label || "");
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
        isPublished,
      };

      const res = await updateLegalPolicy(activeSlug, payload);
      if (res.success && res.data) {
        toast.success(`"${title}" saved successfully!`);
        // Update local state
        setPolicies((prev) => ({
          ...prev,
          [activeSlug]: res.data,
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
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText || "text").length);
    }, 50);
  };

  const activeTabMeta = POLICY_TABS.find((t) => t.slug === activeSlug);
  const activePolicyData = policies[activeSlug];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-[#1A227F] rounded-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Legal & Policies Management</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Update compliance documents, user agreements, and privacy terms shown on mobile and web.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/legal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl border border-gray-200 transition text-sm"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
            <span>Public Legal Hub</span>
          </a>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200">
        {POLICY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSlug === tab.slug;
          const policyItem = policies[tab.slug];
          const isLive = policyItem ? policyItem.isPublished : true;

          return (
            <button
              key={tab.slug}
              onClick={() => handleTabChange(tab.slug)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-xl font-medium text-sm transition shrink-0 ${
                isActive
                  ? "bg-[#1A227F] text-white shadow-md shadow-indigo-900/10"
                  : "bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-gray-100"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
              <span>{tab.label}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isLive ? (isActive ? "bg-emerald-300" : "bg-emerald-500") : "bg-amber-400"
                }`}
                title={isLive ? "Published" : "Draft"}
              />
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
          <Loader2 className="w-8 h-8 text-[#1A227F] animate-spin mb-3" />
          <p className="text-gray-500 text-sm">Loading legal documents...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Document Metadata Bar */}
          <div className="px-6 py-4 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Slug: <code className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-800">{activeSlug}</code>
              </span>

              {activePolicyData?.updatedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  Last Updated: {new Date(activePolicyData.updatedAt).toLocaleDateString()} at{" "}
                  {new Date(activePolicyData.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}

              {activePolicyData?.updatedBy?.fullName && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-gray-400" />
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
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Public Page
                </a>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Top row: Title, Version, and Published switch */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-7 space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Privacy Policy"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A227F]/20 focus:border-[#1A227F] text-sm text-gray-900 transition"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Version
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A227F]/20 focus:border-[#1A227F] text-sm text-gray-900 transition"
                />
              </div>

              <div className="md:col-span-3 flex flex-col justify-center space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                  Publication Status
                </label>
                <label className="flex items-center gap-3 cursor-pointer py-1">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 relative"></div>
                  <span className={`text-sm font-medium ${isPublished ? "text-emerald-700" : "text-amber-600"}`}>
                    {isPublished ? "Publicly Visible" : "Hidden (Draft)"}
                  </span>
                </label>
              </div>
            </div>

            {/* Summary description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                Short Summary (Displayed at the top of the public document)
              </label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Brief summary explaining what this policy covers..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A227F]/20 focus:border-[#1A227F] text-sm text-gray-900 transition"
              />
            </div>

            {/* Content Editor with Toolbar & Preview Toggle */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPreviewMode(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      !previewMode ? "bg-white text-[#1A227F] shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      previewMode ? "bg-white text-[#1A227F] shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Live Preview
                  </button>
                </div>

                {!previewMode && (
                  <div className="flex items-center gap-1 text-gray-600">
                    <button
                      type="button"
                      onClick={() => insertFormatting("## ")}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 text-xs font-semibold transition"
                      title="Add Section Heading"
                    >
                      <Heading2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("**", "**")}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 text-xs font-semibold transition"
                      title="Bold Text"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("- ")}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 text-xs transition"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting("[Link Title](", ")")}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900 text-xs transition"
                      title="Insert Link"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {previewMode ? (
                /* Live Preview Area */
                <div className="min-h-[420px] p-6 bg-gray-50/60 rounded-xl border border-gray-200/80 overflow-y-auto max-h-[600px] prose prose-indigo max-w-none text-gray-800">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 m-0">{title || "Untitled Document"}</h2>
                    {summary && <p className="text-gray-500 text-sm mt-1">{summary}</p>}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                      <span>Version {version}</span>
                      <span>•</span>
                      <span>Last Updated: Today</span>
                    </div>
                  </div>

                  <div className="space-y-4 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {content ? (
                      content.split("\n\n").map((block, idx) => {
                        if (block.startsWith("## ")) {
                          return (
                            <h3 key={idx} className="text-lg font-bold text-gray-900 pt-3 border-t border-gray-100">
                              {block.replace("## ", "")}
                            </h3>
                          );
                        }
                        if (block.startsWith("### ")) {
                          return (
                            <h4 key={idx} className="text-base font-semibold text-gray-800 pt-2">
                              {block.replace("### ", "")}
                            </h4>
                          );
                        }
                        if (block.startsWith("- ") || block.startsWith("* ")) {
                          const items = block.split("\n").filter((line) => line.trim());
                          return (
                            <ul key={idx} className="list-disc pl-5 space-y-1.5 text-gray-700">
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
                  rows={16}
                  placeholder="Enter policy content using Markdown formatting (## Headings, - Bullet lists, **bold**, etc.)..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1A227F]/20 focus:border-[#1A227F] text-sm text-gray-800 font-mono transition leading-relaxed"
                />
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={fetchPolicies}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard & Reset
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#1A227F] hover:bg-[#151c68] text-white font-medium rounded-xl shadow-sm transition disabled:opacity-50 text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
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
