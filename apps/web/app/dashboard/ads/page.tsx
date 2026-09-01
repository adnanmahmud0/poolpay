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
  AlertCircle
} from "lucide-react";
import { getAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement } from "@/lib/api-auth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Advertisement {
  _id: string;
  title: string;
  description: string;
  bannerImage: string; // URL from backend
  priority: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export default function AdsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: 1,
    isActive: true,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    setFormData({
      title: ad.title,
      description: ad.description,
      priority: ad.priority,
      isActive: ad.isActive,
      startDate: ad.startDate ? format(new Date(ad.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      endDate: ad.endDate ? format(new Date(ad.endDate), 'yyyy-MM-dd') : format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingAd(null);
    setImageFile(null);
    setImagePreview(null);
    setFormData({
      title: "",
      description: "",
      priority: 1,
      isActive: true,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advertisement Management</h1>
          <p className="text-sm text-gray-500">Manage platform-wide banners and promotions</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-[#1A2279] text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-900 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Ad
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100/50 shadow-sm">
          <Loader2 className="w-8 h-8 text-[#1A2279] animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Loading advertisements...</p>
        </div>
      ) : ads.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <div key={ad._id} className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden group hover:shadow-md transition-all">
              <div className="relative h-40 bg-gray-100">
                {ad.bannerImage ? (
                  <Image 
                    src={ad.bannerImage} 
                    alt={ad.title} 
                    fill 
                    unoptimized 
                    crossOrigin="anonymous"
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
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{ad.title}</h3>
                  <div className="flex items-center gap-1">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-50 p-6 rounded-full mb-6">
            <Megaphone className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Advertisements Yet</h3>
          <p className="text-gray-500 max-w-sm">Start promoting groups or features by creating your first advertisement banner.</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col">
            <div className="bg-gradient-to-r from-[#4F5BDB] to-[#1A2279] p-6 text-white flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold">{editingAd ? "Edit Advertisement" : "Create New Advertisement"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:opacity-80 transition-opacity">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 space-y-2">
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
                
                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                  <textarea 
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    placeholder="Short description of the advertisement"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase">Banner Image</label>
                  <div className="flex flex-col gap-4">
                    {imagePreview ? (
                      <div className="relative w-full h-48 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                        <Image 
                          src={imagePreview} 
                          alt="Preview" 
                          fill 
                          unoptimized 
                          crossOrigin="anonymous"
                          className="object-cover" 
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-white transition-all shadow-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative group cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full py-8 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 group-hover:border-indigo-300 transition-all bg-gray-50/50">
                          <div className="p-3 bg-white rounded-xl shadow-sm text-gray-400 group-hover:text-indigo-500 transition-colors">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-gray-700">Click to upload banner</p>
                            <p className="text-[10px] text-gray-400">PNG, JPG or WEBP (Max 5MB)</p>
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
