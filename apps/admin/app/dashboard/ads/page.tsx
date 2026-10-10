"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Link2,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  createAdvertisement,
  deleteAdvertisement,
  getAdvertisements,
  updateAdvertisement
} from "@/lib/api-auth";

interface Advertisement {
  _id: string;
  title: string;
  description: string;
  bannerImage: string; // URL from backend
  redirectUrl?: string;
  actionType?: "none" | "link" | "email" | "phone" | "whatsapp";
  actionValue?: string;
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

// Client-side image compressor: Resizes to max 1200x600 and converts to WebP for instant loading
async function compressImageClientSide(
  file: File,
  maxWidth = 1200,
  maxHeight = 600,
  quality = 0.82
): Promise<{
  file: File;
  width: number;
  height: number;
  originalSizeKb: number;
  compressedSizeKb: number;
}> {
  return new Promise((resolve) => {
    const originalSizeKb = Math.round(file.size / 1024);
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { naturalWidth: width, naturalHeight: height } = img;

      // Fit inside 1200x600 maintaining original ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve({
          file,
          width: img.naturalWidth,
          height: img.naturalHeight,
          originalSizeKb,
          compressedSizeKb: originalSizeKb
        });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file,
              width: img.naturalWidth,
              height: img.naturalHeight,
              originalSizeKb,
              compressedSizeKb: originalSizeKb
            });
            return;
          }
          const baseCleanName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
          const compressedFile = new File([blob], `${baseCleanName}.webp`, {
            type: "image/webp",
            lastModified: Date.now()
          });
          const compressedSizeKb = Math.round(compressedFile.size / 1024);
          resolve({
            file: compressedFile,
            width,
            height,
            originalSizeKb,
            compressedSizeKb
          });
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      resolve({ file, width: 0, height: 0, originalSizeKb, compressedSizeKb: originalSizeKb });
    };

    img.src = objectUrl;
  });
}

export default function AdsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    width: number;
    height: number;
    ratio: string;
    ratioStatus: "ideal" | "warning" | "neutral";
    originalKb: number;
    compressedKb: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: 1,
    isActive: true,
    actionType: "none" as "none" | "link" | "email" | "phone" | "whatsapp",
    actionValue: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  });

  const fetchAds = async () => {
    setIsLoading(true);
    try {
      const response = await getAdvertisements();
      if (response.success) {
        setAds(response.data);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch advertisements");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageClientSide(file, 1200, 600, 0.82);
        setImageFile(compressed.file);

        const calculatedRatio = (compressed.width / (compressed.height || 1)).toFixed(2);
        const numRatio = parseFloat(calculatedRatio);
        let ratioStatus: "ideal" | "warning" | "neutral" = "neutral";
        if (numRatio >= 1.7 && numRatio <= 2.2) {
          ratioStatus = "ideal";
        } else if (numRatio < 1.4 || numRatio > 2.5) {
          ratioStatus = "warning";
        }

        setImageMeta({
          width: compressed.width,
          height: compressed.height,
          ratio: `${calculatedRatio}:1`,
          ratioStatus,
          originalKb: compressed.originalSizeKb,
          compressedKb: compressed.compressedSizeKb
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressed.file);

        if (compressed.originalSizeKb > compressed.compressedSizeKb) {
          toast.success(
            `Image compressed: ${compressed.originalSizeKb} KB → ${compressed.compressedSizeKb} KB (WebP)`
          );
        }
      } catch (err) {
        console.warn("Client compression error, using original file:", err);
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingAd && !imageFile) {
      toast.error("Please select a banner image");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.title);
      if (formData.description) fd.append("description", formData.description);
      fd.append("isActive", formData.isActive ? "true" : "false");
      fd.append("priority", String(formData.priority || 0));
      fd.append("actionType", formData.actionType);
      fd.append("actionValue", formData.actionValue || "");
      if (formData.actionType === "link" && formData.actionValue) {
        fd.append("redirectUrl", formData.actionValue);
      }

      if (formData.startDate) {
        fd.append("startDate", new Date(formData.startDate).toISOString());
      }
      if (formData.endDate) {
        fd.append("endDate", new Date(formData.endDate).toISOString());
      }

      if (imageFile) {
        fd.append("bannerImage", imageFile);
      }

      if (editingAd) {
        const response = await updateAdvertisement(editingAd._id, fd);
        if (response.success) {
          toast.success("Advertisement updated successfully");
          setIsModalOpen(false);
          fetchAds();
        }
      } else {
        const response = await createAdvertisement(fd);
        if (response.success) {
          toast.success("Advertisement created successfully");
          setIsModalOpen(false);
          fetchAds();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save advertisement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;
    try {
      const response = await deleteAdvertisement(id);
      if (response.success) {
        toast.success("Advertisement deleted successfully");
        fetchAds();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete advertisement");
    }
  };

  const formatDateSafely = (dateString: string, formatStr: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return format(date, formatStr);
    } catch (error) {
      return "N/A";
    }
  };

  const openEditModal = (ad: Advertisement) => {
    setEditingAd(ad);
    setImageFile(null);
    setImagePreview(ad.bannerImage);
    setImageMeta(null);
    const resolvedActionType = ad.actionType || (ad.redirectUrl ? "link" : "none");
    const resolvedActionValue = ad.actionValue || ad.redirectUrl || "";
    setFormData({
      title: ad.title,
      description: ad.description || "",
      priority: ad.priority,
      isActive: ad.isActive,
      actionType: resolvedActionType as "none" | "link" | "email" | "phone" | "whatsapp",
      actionValue: resolvedActionValue,
      startDate: ad.startDate
        ? format(new Date(ad.startDate), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
      endDate: ad.endDate
        ? format(new Date(ad.endDate), "yyyy-MM-dd")
        : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingAd(null);
    setImageFile(null);
    setImagePreview(null);
    setImageMeta(null);
    setFormData({
      title: "",
      description: "",
      priority: 1,
      isActive: true,
      actionType: "none",
      actionValue: "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Advertisement Management</h1>
          <p className="text-xs text-gray-500 sm:text-sm">
            Manage platform-wide banners and promotions
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 self-start rounded-xl bg-[#1A2279] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-100 transition-all hover:bg-indigo-900 sm:self-auto sm:px-5 sm:py-3"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          Create New Ad
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100/50 bg-white py-20 shadow-sm">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#1A2279]" />
          <p className="font-medium text-gray-500">Loading advertisements...</p>
        </div>
      ) : ads.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {ads.map((ad) => (
            <div
              key={ad._id}
              className="group min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition-all hover:shadow-md"
            >
              <div className="relative h-40 bg-gray-100">
                {ad.bannerImage ? (
                  <Image
                    src={ad.bannerImage}
                    alt={ad.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm ${
                      ad.isActive ? "bg-emerald-500 text-white" : "bg-gray-500 text-white"
                    }`}
                  >
                    {ad.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 text-sm font-bold text-gray-900 sm:text-base">
                    {ad.title}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => openEditModal(ad)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ad._id)}
                      className="rounded-lg p-1.5 text-red-400 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mb-4 line-clamp-2 h-8 text-xs text-gray-500">{ad.description}</p>

                <div className="space-y-2 border-t border-gray-50 pt-4">
                  <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Duration
                    </span>
                    <span className="text-gray-700">
                      {formatDateSafely(ad.startDate, "MMM dd")} -{" "}
                      {formatDateSafely(ad.endDate, "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                    <span className="flex items-center gap-1">
                      <Megaphone className="h-3 w-3" /> Priority
                    </span>
                    <span className="font-bold text-indigo-600">Level {ad.priority}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                    <span className="flex items-center gap-1">
                      {ad.actionType === "link" && <Globe className="h-3 w-3 text-blue-500" />}
                      {ad.actionType === "email" && <Mail className="h-3 w-3 text-amber-500" />}
                      {ad.actionType === "phone" && <Phone className="h-3 w-3 text-emerald-500" />}
                      {ad.actionType === "whatsapp" && (
                        <MessageSquare className="h-3 w-3 text-green-500" />
                      )}
                      {(!ad.actionType || ad.actionType === "none") && (
                        <Link2 className="h-3 w-3 text-gray-400" />
                      )}
                      Action
                    </span>
                    <span
                      className="max-w-[150px] truncate font-semibold text-gray-700"
                      title={ad.actionValue || ad.redirectUrl || "None"}
                    >
                      {ad.actionType === "link"
                        ? ad.actionValue || ad.redirectUrl || "Website Link"
                        : ad.actionType === "email"
                          ? ad.actionValue || "Email"
                          : ad.actionType === "phone"
                            ? ad.actionValue || "Phone"
                            : ad.actionType === "whatsapp"
                              ? ad.actionValue || "WhatsApp"
                              : "Do Nothing"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center sm:p-20">
          <div className="mb-6 rounded-full bg-gray-50 p-6">
            <Megaphone className="h-12 w-12 text-gray-300" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-gray-900 sm:text-xl">No Advertisements Yet</h3>
          <p className="max-w-sm text-xs text-gray-500 sm:text-sm">
            Start promoting groups or features by creating your first advertisement banner.
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 backdrop-blur-sm sm:p-4">
          <div className="animate-in fade-in zoom-in flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl duration-300">
            <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#4F5BDB] to-[#1A2279] p-4 text-white sm:p-6">
              <h2 className="text-lg font-bold sm:text-xl">
                {editingAd ? "Edit Advertisement" : "Create New Advertisement"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="transition-opacity hover:opacity-80"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="custom-scrollbar space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6 lg:p-8"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <div className="col-span-1 space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Ad Title</label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                    placeholder="e.g., Summer Savings Bonus"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="col-span-1 space-y-2 sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                    placeholder="Short description of the advertisement"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Image Dimension & Aspect Ratio Suggestion Guide */}
                <div className="col-span-1 flex flex-col gap-2.5 rounded-2xl border border-indigo-100/80 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-indigo-50/80 p-4 sm:col-span-2">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <span className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-indigo-900 uppercase">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      Recommended Dimensions & Ratio
                    </span>
                    <span className="self-start rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase sm:self-auto">
                      Mobile Optimized
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
                    <div className="rounded-xl border border-indigo-100/60 bg-white/90 p-3 shadow-xs backdrop-blur-sm">
                      <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                        Aspect Ratio
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold text-gray-900">2:1 or 16:9</p>
                      <p className="text-[10px] text-gray-500">Landscape Carousel</p>
                    </div>
                    <div className="rounded-xl border border-indigo-100/60 bg-white/90 p-3 shadow-xs backdrop-blur-sm">
                      <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                        Ideal Resolution
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold text-indigo-600">1200 × 600 px</p>
                      <p className="text-[10px] text-gray-500">Min 600 × 300 px</p>
                    </div>
                    <div className="rounded-xl border border-indigo-100/60 bg-white/90 p-3 shadow-xs backdrop-blur-sm">
                      <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                        Auto-Compress
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold text-emerald-600">WebP 82%</p>
                      <p className="text-[10px] text-gray-500">Instant 0ms Cache</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Banner Image
                    </label>
                    <span className="text-[11px] font-medium text-gray-400">
                      Auto-compressed on upload
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {imagePreview ? (
                      <div className="space-y-2.5">
                        <div className="group relative aspect-[2/1] max-h-56 w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-950 shadow-inner">
                          <Image
                            src={imagePreview}
                            alt="Preview"
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <span className="rounded-lg border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
                              2:1 Mobile Frame
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                                setImageMeta(null);
                              }}
                              className="rounded-full bg-white/90 p-1.5 text-red-500 shadow-md transition-all hover:scale-110 hover:bg-white"
                              title="Remove image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Live Dimension & Ratio Inspector */}
                        {imageMeta && (
                          <div
                            className={`flex flex-col gap-2 rounded-xl border p-3 text-xs sm:flex-row sm:items-center sm:justify-between ${
                              imageMeta.ratioStatus === "ideal"
                                ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                                : imageMeta.ratioStatus === "warning"
                                  ? "border-amber-200 bg-amber-50/80 text-amber-900"
                                  : "border-gray-200 bg-gray-50 text-gray-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {imageMeta.ratioStatus === "ideal" ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                              )}
                              <span>
                                <strong>
                                  {imageMeta.width} × {imageMeta.height} px
                                </strong>{" "}
                                (Ratio: {imageMeta.ratio}) —{" "}
                                {imageMeta.ratioStatus === "ideal"
                                  ? "Ideal 2:1 ratio for mobile home screen"
                                  : "Image ratio differs from 2:1 and will be cropped horizontally in the app"}
                              </span>
                            </div>
                            <span className="shrink-0 self-start rounded-lg border border-black/5 bg-white/80 px-2 py-0.5 text-[11px] font-semibold sm:self-auto">
                              {imageMeta.originalKb} KB → {imageMeta.compressedKb} KB (WebP)
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="group relative cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        />
                        <div className="flex aspect-[2.2/1] max-h-56 w-full flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-10 transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50/30">
                          <div className="rounded-2xl bg-white p-3.5 text-gray-400 shadow-xs transition-all group-hover:scale-110 group-hover:text-indigo-600">
                            <ImageIcon className="h-7 w-7" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-800">
                              Click to upload banner
                            </p>
                            <p className="mt-0.5 text-xs text-gray-400">
                              Recommended: 1200 × 600 px (Aspect 2:1)
                            </p>
                            <p className="mt-1 text-[10px] font-medium text-indigo-500">
                              Auto-compressed to WebP for instant app loading
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Start Date</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Priority (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                    <ExternalLink className="h-3.5 w-3.5 text-indigo-500" />
                    Click Action
                  </label>
                  <select
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                    value={formData.actionType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        actionType: e.target.value as
                          "none" | "link" | "email" | "phone" | "whatsapp"
                      })
                    }
                  >
                    <option value="none">⚪ None (Do Nothing)</option>
                    <option value="link">🌐 Website Link (Open URL)</option>
                    <option value="email">✉️ Email Address (Send Email)</option>
                    <option value="phone">📞 Phone Number (Make Call)</option>
                    <option value="whatsapp">💬 WhatsApp Number (Chat on WhatsApp)</option>
                  </select>
                </div>

                {formData.actionType !== "none" && (
                  <div className="col-span-2 space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase">
                      {formData.actionType === "link" && (
                        <Globe className="h-3.5 w-3.5 text-blue-500" />
                      )}
                      {formData.actionType === "email" && (
                        <Mail className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      {formData.actionType === "phone" && (
                        <Phone className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      {formData.actionType === "whatsapp" && (
                        <MessageSquare className="h-3.5 w-3.5 text-green-500" />
                      )}
                      {formData.actionType === "link"
                        ? "Website URL"
                        : formData.actionType === "email"
                          ? "Email Address"
                          : formData.actionType === "phone"
                            ? "Phone Number (with Country Code)"
                            : "WhatsApp Number (with Country Code)"}
                    </label>
                    <input
                      type={
                        formData.actionType === "email"
                          ? "email"
                          : formData.actionType === "phone" || formData.actionType === "whatsapp"
                            ? "tel"
                            : "text"
                      }
                      required
                      placeholder={
                        formData.actionType === "link"
                          ? "https://example.com"
                          : formData.actionType === "email"
                            ? "support@example.com"
                            : formData.actionType === "phone"
                              ? "+1 234 567 8900"
                              : "+1 234 567 8900 (e.g. +12345678900)"
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none"
                      value={formData.actionValue}
                      onChange={(e) => setFormData({ ...formData, actionValue: e.target.value })}
                    />
                  </div>
                )}

                <div className="flex h-full items-center gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative h-6 w-12 rounded-full transition-all ${
                      formData.isActive ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                        formData.isActive ? "left-7" : "left-1"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-gray-500 uppercase">Is Active</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-2xl bg-gray-50 py-4 font-bold text-gray-500 transition-all hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1A2279] py-4 font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-900 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingAd ? "Update Ad" : "Create Ad"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
