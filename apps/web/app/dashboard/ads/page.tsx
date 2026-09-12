"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Megaphone, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Calendar,
  Image as ImageIcon,
  Loader2,
  X,
  Check,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  MessageSquare,
  ExternalLink,
  Link2,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { getAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement } from "@/lib/api-auth";
import { toast } from "sonner";
import { format } from "date-fns";

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
): Promise<{ file: File; width: number; height: number; originalSizeKb: number; compressedSizeKb: number }> {
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
        resolve({ file, width: img.naturalWidth, height: img.naturalHeight, originalSizeKb, compressedSizeKb: originalSizeKb });
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ file, width: img.naturalWidth, height: img.naturalHeight, originalSizeKb, compressedSizeKb: originalSizeKb });
            return;
          }
          const baseCleanName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          const compressedFile = new File([blob], `${baseCleanName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          const compressedSizeKb = Math.round(compressedFile.size / 1024);
          resolve({
            file: compressedFile,
            width,
            height,
            originalSizeKb,
            compressedSizeKb,
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
    ratioStatus: 'ideal' | 'warning' | 'neutral';
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
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
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
        let ratioStatus: 'ideal' | 'warning' | 'neutral' = 'neutral';
        if (numRatio >= 1.7 && numRatio <= 2.2) {
          ratioStatus = 'ideal';
        } else if (numRatio < 1.4 || numRatio > 2.5) {
          ratioStatus = 'warning';
        }

        setImageMeta({
          width: compressed.width,
          height: compressed.height,
          ratio: `${calculatedRatio}:1`,
          ratioStatus,
          originalKb: compressed.originalSizeKb,
          compressedKb: compressed.compressedSizeKb,
        });

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(compressed.file);

        if (compressed.originalSizeKb > compressed.compressedSizeKb) {
          toast.success(`Image compressed: ${compressed.originalSizeKb} KB → ${compressed.compressedSizeKb} KB (WebP)`);
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
      fd.append('title', formData.title);
      if (formData.description) fd.append('description', formData.description);
      fd.append('isActive', formData.isActive ? 'true' : 'false');
      fd.append('priority', String(formData.priority || 0));
      fd.append('actionType', formData.actionType);
      fd.append('actionValue', formData.actionValue || '');
      if (formData.actionType === 'link' && formData.actionValue) {
        fd.append('redirectUrl', formData.actionValue);
      }
      
      if (formData.startDate) {
        fd.append('startDate', new Date(formData.startDate).toISOString());
      }
      if (formData.endDate) {
        fd.append('endDate', new Date(formData.endDate).toISOString());
      }
      
      if (imageFile) {
        fd.append('bannerImage', imageFile);
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
      startDate: ad.startDate ? format(new Date(ad.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      endDate: ad.endDate ? format(new Date(ad.endDate), 'yyyy-MM-dd') : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
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
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Advertisement Management</h1>
          <p className="text-xs sm:text-sm text-gray-500">Manage platform-wide banners and promotions</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-[#1A2279] text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-bold hover:bg-indigo-900 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 self-start sm:self-auto text-sm"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Create New Ad
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100/50 shadow-sm">
          <Loader2 className="w-8 h-8 text-[#1A2279] animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading advertisements...</p>
        </div>
      ) : ads.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {ads.map((ad) => (
            <div key={ad._id} className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden group hover:shadow-md transition-all min-w-0">
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
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm ${
                    ad.isActive ? 'bg-emerald-500 text-white' : 'bg-gray-500 text-white'
                  }`}>
                    {ad.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <h3 className="font-bold text-gray-900 line-clamp-1 text-sm sm:text-base">{ad.title}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditModal(ad)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(ad._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-4 h-8">{ad.description}</p>
                
                <div className="space-y-2 border-t border-gray-50 pt-4">
                  <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Duration</span>
                    <span className="text-gray-700">{formatDateSafely(ad.startDate, 'MMM dd')} - {formatDateSafely(ad.endDate, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                    <span className="flex items-center gap-1"><Megaphone className="w-3 h-3" /> Priority</span>
                    <span className="text-indigo-600 font-bold">Level {ad.priority}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-gray-400">
                    <span className="flex items-center gap-1">
                      {ad.actionType === "link" && <Globe className="w-3 h-3 text-blue-500" />}
                      {ad.actionType === "email" && <Mail className="w-3 h-3 text-amber-500" />}
                      {ad.actionType === "phone" && <Phone className="w-3 h-3 text-emerald-500" />}
                      {ad.actionType === "whatsapp" && <MessageSquare className="w-3 h-3 text-green-500" />}
                      {(!ad.actionType || ad.actionType === "none") && <Link2 className="w-3 h-3 text-gray-400" />}
                      Action
                    </span>
                    <span className="text-gray-700 font-semibold truncate max-w-[150px]" title={ad.actionValue || ad.redirectUrl || "None"}>
                      {ad.actionType === "link" ? (ad.actionValue || ad.redirectUrl || "Website Link") :
                       ad.actionType === "email" ? (ad.actionValue || "Email") :
                       ad.actionType === "phone" ? (ad.actionValue || "Phone") :
                       ad.actionType === "whatsapp" ? (ad.actionValue || "WhatsApp") :
                       "Do Nothing"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 sm:p-20 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-50 p-6 rounded-full mb-6">
            <Megaphone className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No Advertisements Yet</h3>
          <p className="text-gray-500 text-xs sm:text-sm max-w-sm">Start promoting groups or features by creating your first advertisement banner.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
            <div className="bg-gradient-to-r from-[#4F5BDB] to-[#1A2279] p-4 sm:p-6 text-white flex justify-between items-center shrink-0">
              <h2 className="text-lg sm:text-xl font-bold">{editingAd ? "Edit Advertisement" : "Create New Advertisement"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:opacity-80 transition-opacity">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Ad Title</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    placeholder="e.g., Summer Savings Bonus"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                
                <div className="col-span-1 sm:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea 
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    placeholder="Short description of the advertisement"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                {/* Image Dimension & Aspect Ratio Suggestion Guide */}
                <div className="col-span-1 sm:col-span-2 bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-indigo-50/80 border border-indigo-100/80 rounded-2xl p-4 flex flex-col gap-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Recommended Dimensions & Ratio
                    </span>
                    <span className="text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider self-start sm:self-auto">
                      Mobile Optimized
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-indigo-100/60 shadow-xs">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Aspect Ratio</p>
                      <p className="font-extrabold text-gray-900 text-sm mt-0.5">2:1 or 16:9</p>
                      <p className="text-[10px] text-gray-500">Landscape Carousel</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-indigo-100/60 shadow-xs">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Ideal Resolution</p>
                      <p className="font-extrabold text-indigo-600 text-sm mt-0.5">1200 × 600 px</p>
                      <p className="text-[10px] text-gray-500">Min 600 × 300 px</p>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-indigo-100/60 shadow-xs">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Auto-Compress</p>
                      <p className="font-extrabold text-emerald-600 text-sm mt-0.5">WebP 82%</p>
                      <p className="text-[10px] text-gray-500">Instant 0ms Cache</p>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase">Banner Image</label>
                    <span className="text-[11px] text-gray-400 font-medium">Auto-compressed on upload</span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {imagePreview ? (
                      <div className="space-y-2.5">
                        <div className="relative w-full aspect-[2/1] max-h-56 bg-gray-950 rounded-2xl overflow-hidden border border-gray-200 shadow-inner group">
                          <Image 
                            src={imagePreview} 
                            alt="Preview" 
                            fill 
                            unoptimized 
                            className="object-cover transition-transform group-hover:scale-[1.02] duration-300" 
                          />
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-black/70 backdrop-blur-md text-white rounded-lg border border-white/10 shadow-sm">
                              2:1 Mobile Frame
                            </span>
                            <button 
                              type="button"
                              onClick={() => {
                                setImageFile(null);
                                setImagePreview(null);
                                setImageMeta(null);
                              }}
                              className="p-1.5 bg-white/90 hover:bg-white text-red-500 rounded-full shadow-md transition-all hover:scale-110"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Live Dimension & Ratio Inspector */}
                        {imageMeta && (
                          <div className={`text-xs p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                            imageMeta.ratioStatus === 'ideal' 
                              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                              : imageMeta.ratioStatus === 'warning'
                              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                              : 'bg-gray-50 border-gray-200 text-gray-800'
                          }`}>
                            <div className="flex items-center gap-2">
                              {imageMeta.ratioStatus === 'ideal' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              )}
                              <span>
                                <strong>{imageMeta.width} × {imageMeta.height} px</strong> (Ratio: {imageMeta.ratio}) —{" "}
                                {imageMeta.ratioStatus === 'ideal' 
                                  ? 'Ideal 2:1 ratio for mobile home screen'
                                  : 'Image ratio differs from 2:1 and will be cropped horizontally in the app'}
                              </span>
                            </div>
                            <span className="text-[11px] font-semibold bg-white/80 px-2 py-0.5 rounded-lg shrink-0 self-start sm:self-auto border border-black/5">
                              {imageMeta.originalKb} KB → {imageMeta.compressedKb} KB (WebP)
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative group cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full py-10 aspect-[2.2/1] max-h-56 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2.5 group-hover:border-indigo-400 group-hover:bg-indigo-50/30 transition-all bg-gray-50/50">
                          <div className="p-3.5 bg-white rounded-2xl shadow-xs text-gray-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all">
                            <ImageIcon className="w-7 h-7" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-800">Click to upload banner</p>
                            <p className="text-xs text-gray-400 mt-0.5">Recommended: 1200 × 600 px (Aspect 2:1)</p>
                            <p className="text-[10px] text-indigo-500 font-medium mt-1">Auto-compressed to WebP for instant app loading</p>
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
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">End Date</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Priority (1-10)</label>
                  <input 
                    type="number" 
                    min="1" max="10"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: Number(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                    Click Action
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                    value={formData.actionType}
                    onChange={(e) => setFormData({
                      ...formData, 
                      actionType: e.target.value as "none" | "link" | "email" | "phone" | "whatsapp"
                    })}
                  >
                    <option value="none">⚪ None (Do Nothing)</option>
                    <option value="link">🌐 Website Link (Open URL)</option>
                    <option value="email">✉️ Email Address (Send Email)</option>
                    <option value="phone">📞 Phone Number (Make Call)</option>
                    <option value="whatsapp">💬 WhatsApp Number (Chat on WhatsApp)</option>
                  </select>
                </div>

                {formData.actionType !== "none" && (
                  <div className="space-y-2 col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5">
                      {formData.actionType === "link" && <Globe className="w-3.5 h-3.5 text-blue-500" />}
                      {formData.actionType === "email" && <Mail className="w-3.5 h-3.5 text-amber-500" />}
                      {formData.actionType === "phone" && <Phone className="w-3.5 h-3.5 text-emerald-500" />}
                      {formData.actionType === "whatsapp" && <MessageSquare className="w-3.5 h-3.5 text-green-500" />}
                      {formData.actionType === "link" ? "Website URL" :
                       formData.actionType === "email" ? "Email Address" :
                       formData.actionType === "phone" ? "Phone Number (with Country Code)" :
                       "WhatsApp Number (with Country Code)"}
                    </label>
                    <input
                      type={formData.actionType === "email" ? "email" : formData.actionType === "phone" || formData.actionType === "whatsapp" ? "tel" : "text"}
                      required
                      placeholder={
                        formData.actionType === "link" ? "https://example.com" :
                        formData.actionType === "email" ? "support@example.com" :
                        formData.actionType === "phone" ? "+1 234 567 8900" :
                        "+1 234 567 8900 (e.g. +12345678900)"
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      value={formData.actionValue}
                      onChange={(e) => setFormData({...formData, actionValue: e.target.value})}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 h-full pt-6">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      formData.isActive ? "bg-emerald-500" : "bg-gray-200"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      formData.isActive ? "left-7" : "left-1"
                    }`} />
                  </button>
                  <span className="text-xs font-bold text-gray-500 uppercase">Is Active</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#1A2279] text-white rounded-2xl font-bold hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
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
